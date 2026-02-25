import { type Request, type Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { saleItems } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function toSaleWithItems(sale) {
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
    total: Number(sale.total),
    paymentMethod: sale.paymentMethod,
    cashierId: sale.cashierId ?? undefined,
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
      const { items, subtotal, tax, discount, total, paymentMethod, cashierId } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Sale must contain items" });
      }

      const saleData = {
        subtotal: String(subtotal ?? 0),
        tax: String(tax ?? 0),
        discount: String(discount ?? 0),
        total: String(total ?? 0),
        paymentMethod: paymentMethod ?? "cash",
        cashierId: cashierId ?? null,
      };

      const normalizedItems = items.map((item) => ({
        productId: item.productId ?? null,
        productName: String(item.productName),
        quantity: Number(item.quantity) || 1,
        price: String(item.price ?? 0),
      }));

      const sale = await storage.createSale(saleData, normalizedItems);
      res.status(201).json(await toSaleWithItems(sale));
    } catch (error) {
      console.error("Create sale error:", error);
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
  }
};