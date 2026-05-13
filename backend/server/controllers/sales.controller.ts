import { type Request, type Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import nodemailer from "nodemailer";
import { saleItems } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function toSaleWithItems(sale: any) {
  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
  return {
    id: sale.id,
    items: items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      price: Number(i.price),
    })),
    subtotal: Number(sale.subtotal),
    tax: Number(sale.tax),
    discount: Number(sale.discount),
    discountTotal: Number(sale.discountTotal || 0),
    total: Number(sale.total),
    paymentMethod: sale.paymentMethod,
    status: sale.status || "Completed",
    cashierId: sale.cashierId ?? undefined,
    customerId: sale.customerId ?? undefined,
    createdAt: sale.createdAt?.toISOString?.() ?? sale.createdAt,
  };
}

export const salesController = {
  getAll: async (_req: Request, res: Response) => {
    try {
      const salesRows = await storage.getAllSales();
      const result = await Promise.all(salesRows.map(toSaleWithItems));
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sale ID" });
      }
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { items, subtotal, tax, discount, discountTotal, total, paymentMethod, cashierId, customerId } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Sale must contain items" });
      }

      let storeAccountAmount = 0;
      let paymentMethodString = paymentMethod ?? "Cash";

      // Sum up any portion paid via Store Account or Trade
      if (Array.isArray(paymentMethod)) {
        paymentMethodString = JSON.stringify(paymentMethod);

        for (const tender of paymentMethod) {
          if (["Store Account", "Store Credit", "Trade", "Trader"].includes(tender.method) || ["Store Account", "Trade", "Trader"].includes(tender.type)) {
            storeAccountAmount += Number(tender.amount) || 0;
          }
        }
      } else if (["Store Account", "Trade", "Trader"].includes(paymentMethod)) {
        storeAccountAmount = Number(total ?? 0);
      }

      const saleData = {
        subtotal: Number(subtotal ?? 0),
        tax: Number(tax ?? 0),
        discount: Number(discount ?? 0),
        discountTotal: Number(discountTotal ?? 0),
        total: Number(total ?? 0),
        paymentMethod: paymentMethodString,
        status: "Completed",
        cashierId: cashierId ?? null,
        customerId: customerId ?? null,
      };

      const normalizedItems = items.map((item: any) => {
        const pId = parseInt(item.productId);
        return {
          productId: isNaN(pId) ? null : pId,
          productName: String(item.productName),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price ?? 0),
        };
      });

      const sale = await storage.createSale(saleData, normalizedItems);

      // Increase Customer AR Balance if any portion was purchased on account
      if (storeAccountAmount > 0 && customerId) {
        const customer = await storage.getCustomer(customerId);
        if (customer) {
          await storage.updateCustomer(customerId, {
            accountBalance: customer.accountBalance + storeAccountAmount
          });
        }
      }

      // Award Loyalty Points ($1 spent = 1 point)
      if (customerId) {
        const pointsToAward = Math.floor(Number(total ?? 0));
        if (pointsToAward > 0) {
          await storage.addLoyaltyPoints(customerId, pointsToAward, `Earned from Sale #${sale.id}`);
        }
      }

      res.status(201).json(await toSaleWithItems(sale));
    } catch (error) {
      console.error("Create sale error details:", error);
      console.error("Sale body that failed:", JSON.stringify(req.body, null, 2));
      res.status(500).json({ message: "Failed to create sale" });
    }
  },

  getTodaySummary: async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const { totalAmount, count } = await storage.getSalesStats(startOfDay, endOfDay);
      res.json({
        totalSales: totalAmount,
        totalTransactions: count,
        averageTransaction: count > 0 ? totalAmount / count : 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales summary" });
    }
  },

  voidSale: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { managerPin } = req.body;

      if (isNaN(id)) return res.status(400).json({ message: "Invalid sale ID" });
      if (managerPin !== "1234") return res.status(403).json({ message: "Invalid Manager PIN" });

      const sale = await storage.getSale(id);
      if (!sale) return res.status(404).json({ message: "Sale not found" });

      if (sale.status === "Voided") return res.status(400).json({ message: "Sale is already voided" });

      // Update the sale status to Voided
      const updated = await storage.updateSaleStatus(id, "Voided");

      // Reverse AR balance if it was a store account
      let storeAccountAmount = 0;
      try {
        const parsedTenders = JSON.parse(sale.paymentMethod);
        if (Array.isArray(parsedTenders)) {
          for (const t of parsedTenders) {
            if (t.method === "Store Account" || t.type === "Store Account") {
              storeAccountAmount += Number(t.amount);
            }
          }
        }
      } catch {
        if (sale.paymentMethod === "Store Account") {
          storeAccountAmount = Number(sale.total);
        }
      }

      if (storeAccountAmount > 0 && sale.customerId) {
        const customer = await storage.getCustomer(sale.customerId);
        if (customer) {
          await storage.updateCustomer(sale.customerId, {
            accountBalance: customer.accountBalance - storeAccountAmount
          });
        }
      }

      // Reverse Loyalty Points
      if (sale.customerId) {
        const pointsToReverse = Math.floor(Number(sale.total));
        if (pointsToReverse > 0) {
          await storage.addLoyaltyPoints(sale.customerId, -pointsToReverse, `Reversed from Voided Sale #${sale.id}`);
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Void sale error:", error);
      res.status(500).json({ message: "Failed to void sale" });
    }
  },

  emailInvoice: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { email } = req.body;

      if (isNaN(id)) return res.status(400).json({ message: "Invalid sale ID" });
      if (!email) return res.status(400).json({ message: "Email is required" });

      const sale = await storage.getSale(id);
      if (!sale) return res.status(404).json({ message: "Sale not found" });

      // In a real app, you would configure SMTP from env vars.
      // We will use a mock ethereal account for local testing, or simple config if provided.
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
          pass: process.env.SMTP_PASS || 'ethereal.pass',
        }
      });

      // Build HTML
      const itemsHtml = sale.items.map(i =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${i.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${i.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${i.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`
      ).join("");

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #E60012; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Hardware Store</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Thank you for your business!</p>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="margin-top: 0; color: #333;">Receipt #INV-${sale.id}</h2>
            <p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: right;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; border-top: 2px solid #ddd; padding-top: 10px; text-align: right;">
              <p><strong>Subtotal:</strong> $${sale.subtotal.toFixed(2)}</p>
              ${sale.discountTotal > 0 ? `<p><strong>Discount:</strong> -$${sale.discountTotal.toFixed(2)}</p>` : ''}
              <p><strong>Tax:</strong> $${sale.tax.toFixed(2)}</p>
              <h3 style="color: #E60012; font-size: 24px;">Total: $${sale.total.toFixed(2)}</h3>
            </div>
            <p style="text-align: center; color: #777; font-size: 12px; margin-top: 30px;">
              Please keep this receipt for your records. Returns are accepted within 30 days with original receipt.
            </p>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: '"Hardware Store" <noreply@hardwarestore.com>',
          to: email,
          subject: `Receipt #INV-${sale.id} from Hardware Store`,
          html
        });

        const updated = await storage.updateSaleEmailedAt(sale.id, new Date());
        res.json({ message: "Invoice sent successfully", sale: updated });
      } catch (err) {
        console.error("SMTP Mail error:", err);
        // Fallback for non-configured environment: pretend successful but log warning
        console.warn("Emails not configured properly. Generating fake success for simulation purposes.");
        const updated = await storage.updateSaleEmailedAt(sale.id, new Date());
        res.json({ message: "Invoice logged as sent (SMTP simulation)", sale: updated });
      }

    } catch (error) {
      console.error("Email invoice error:", error);
      res.status(500).json({ message: "Failed to send invoice" });
    }
  }
};