import { type Request, type Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCustomerSchema, sales, transactions } from "../../shared/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "../db";
import PDFDocument from "pdfkit";

export const customersController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const customers = await storage.getAllCustomers();
            res.json(customers);
        } catch (error) {
            console.error("Fetch customers error:", error);
            res.status(500).json({ message: "Failed to fetch customers" });
        }
    },

    getById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

            const customer = await storage.getCustomer(id);
            if (!customer) return res.status(404).json({ message: "Customer not found" });

            res.json(customer);
        } catch (error) {
            console.error("Fetch customer error:", error);
            res.status(500).json({ message: "Failed to fetch customer" });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const validatedData = insertCustomerSchema.parse(req.body);
            const customer = await storage.createCustomer(validatedData);
            res.status(201).json(customer);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Validation error", errors: error.errors });
            }
            console.error("Create customer error:", error);
            res.status(500).json({ message: "Failed to create customer" });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

            const validatedData = insertCustomerSchema.partial().parse(req.body);

            const updated = await storage.updateCustomer(id, validatedData);
            if (!updated) return res.status(404).json({ message: "Customer not found" });

            res.json(updated);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Validation error", errors: error.errors });
            }
            console.error("Update customer error:", error);
            res.status(500).json({ message: "Failed to update customer" });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

            const deleted = await storage.deleteCustomer(id);
            if (!deleted) return res.status(404).json({ message: "Customer not found" });

            res.status(204).end();
        } catch (error) {
            console.error("Delete customer error:", error);
            res.status(500).json({ message: "Failed to delete customer" });
        }
    },

    payAccount: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

            const { amount, method } = req.body;
            if (!amount || isNaN(Number(amount))) return res.status(400).json({ message: "Invalid amount" });

            const customer = await storage.getCustomer(id);
            if (!customer) return res.status(404).json({ message: "Customer not found" });

            // Deduct from account balance
            const newBalance = customer.accountBalance - Number(amount);
            await storage.updateCustomer(id, { accountBalance: newBalance });

            // Record transaction
            await storage.createTransaction({
                date: new Date().toISOString(),
                description: `Account Payment - ${customer.name}`,
                category: "Account Payment",
                type: "Income",
                amount: Number(amount),
                method: method || "cash",
                customerId: id,
            });

            const updatedCustomer = await storage.getCustomer(id);
            res.json(updatedCustomer);
        } catch (error) {
            console.error("Pay account error:", error);
            res.status(500).json({ message: "Failed to process payment" });
        }
    },

    generateStatementPdf: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const monthStr = req.query.month as string; // YYYY-MM
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
            if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
                return res.status(400).json({ message: "Invalid month format. Use YYYY-MM." });
            }

            const customer = await storage.getCustomer(id);
            if (!customer) return res.status(404).json({ message: "Customer not found" });

            const [year, month] = monthStr.split('-');
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
            const endDate = new Date(parseInt(year), parseInt(month), 1).toISOString();

            // Fetch charges (sales on account)
            const accountSales = await db.select().from(sales)
                .where(and(
                    eq(sales.customerId, id),
                    eq(sales.paymentMethod, "Store Account"),
                    gte(sales.createdAt, startDate),
                    lt(sales.createdAt, endDate)
                ));

            // Fetch payments
            const accountPayments = await db.select().from(transactions)
                .where(and(
                    eq(transactions.customerId, id),
                    eq(transactions.category, "Account Payment"),
                    gte(transactions.date, startDate),
                    lt(transactions.date, endDate)
                ));

            // Generate PDF
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=statement-${customer.name.replace(/\s+/g, '_')}-${monthStr}.pdf`);
            doc.pipe(res);

            // Header
            doc.fontSize(20).text('Hardware Store Pro', { align: 'center' });
            doc.fontSize(10).text('123 Main Street, Colombo', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text(`Account Statement`, { align: 'center' });
            doc.fontSize(12).text(`Period: ${monthStr}`, { align: 'center' });
            doc.moveDown();

            // Cust Info
            doc.fontSize(12).text(`Customer: ${customer.name}`);
            if (customer.companyName) doc.fontSize(10).text(`Company: ${customer.companyName}`);
            doc.fontSize(10).text(`Account Balance: LKR ${customer.accountBalance.toFixed(2)}`);
            doc.moveDown();

            // Detailed Table
            const startY = doc.y;
            doc.font('Helvetica-Bold');
            doc.text('Date', 50, startY);
            doc.text('Description', 150, startY);
            doc.text('Charges', 350, startY, { align: 'right' });
            doc.text('Payments', 450, startY, { align: 'right' });
            doc.moveTo(50, startY + 15).lineTo(500, startY + 15).stroke();
            doc.font('Helvetica');

            let currentY = startY + 25;
            let totalCharges = 0;
            let totalPayments = 0;

            const allActivity = [
                ...accountSales.map(s => ({ date: s.createdAt, desc: `Charge - Invoice #${s.id}`, charge: Number(s.total), payment: 0 })),
                ...accountPayments.map(p => ({ date: p.date, desc: `Payment - ${p.method}`, charge: 0, payment: Number(p.amount) }))
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            allActivity.forEach(act => {
                doc.text(new Date(act.date).toLocaleDateString(), 50, currentY);
                doc.text(act.desc, 150, currentY);
                if (act.charge > 0) doc.text(act.charge.toFixed(2), 350, currentY, { align: 'right' });
                if (act.payment > 0) doc.text(act.payment.toFixed(2), 450, currentY, { align: 'right' });

                totalCharges += act.charge;
                totalPayments += act.payment;
                currentY += 20;

                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
            });

            doc.moveTo(50, currentY).lineTo(500, currentY).stroke();
            currentY += 15;

            // Summary
            doc.font('Helvetica-Bold');
            doc.text('Totals:', 150, currentY);
            doc.text(totalCharges.toFixed(2), 350, currentY, { align: 'right' });
            doc.text(totalPayments.toFixed(2), 450, currentY, { align: 'right' });

            doc.end();
        } catch (error) {
            console.error("Generate statement error:", error);
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to generate statement" });
            }
        }
    }
};
