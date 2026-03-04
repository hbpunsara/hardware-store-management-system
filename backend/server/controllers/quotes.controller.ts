import { type Request, type Response } from "express";
import { storage } from "../storage";
import PDFDocument from "pdfkit";

export const quotesController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const quotes = await storage.getAllQuotes();
            res.json(quotes);
        } catch (error) {
            console.error("Fetch quotes error:", error);
            res.status(500).json({ message: "Failed to fetch quotes" });
        }
    },

    getById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

            const quote = await storage.getQuote(id);
            if (!quote) return res.status(404).json({ message: "Quote not found" });

            res.json(quote);
        } catch (error) {
            console.error("Fetch quote error:", error);
            res.status(500).json({ message: "Failed to fetch quote" });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const { items, subtotal, tax, discount, total, customerId, validUntil, notes } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: "Quote must contain items" });
            }

            const quoteData = {
                subtotal: Number(subtotal ?? 0),
                tax: Number(tax ?? 0),
                discount: Number(discount ?? 0),
                total: Number(total ?? 0),
                customerId: customerId ?? null,
                validUntil: validUntil ?? null,
                notes: notes ?? null,
                status: "Pending",
            };

            const normalizedItems = items.map((item: any) => ({
                productId: item.productId ?? null,
                productName: String(item.productName),
                quantity: Number(item.quantity) || 1,
                price: Number(item.price ?? 0),
            }));

            const quote = await storage.createQuote(quoteData, normalizedItems);
            res.status(201).json(quote);
        } catch (error) {
            console.error("Create quote error:", error);
            res.status(500).json({ message: "Failed to create quote" });
        }
    },

    updateStatus: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

            const { status } = req.body;
            if (!status) return res.status(400).json({ message: "Status is required" });

            const updated = await storage.updateQuote(id, { status });
            if (!updated) return res.status(404).json({ message: "Quote not found" });

            res.json(updated);
        } catch (error) {
            console.error("Update quote status error:", error);
            res.status(500).json({ message: "Failed to update quote status" });
        }
    },

    generatePdf: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

            const quote = await storage.getQuote(id);
            if (!quote) return res.status(404).json({ message: "Quote not found" });

            const doc = new PDFDocument({ margin: 50 });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=quote-${id}.pdf`);

            doc.pipe(res);

            // Add Header
            doc.fontSize(20).text('Hardware Store Pro', { align: 'center' });
            doc.fontSize(10).text('123 Main Street, Colombo', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text(`Quote / Estimate #${quote.id}`, { align: 'center' });
            doc.moveDown();

            // Customer Info
            if (quote.customer) {
                doc.fontSize(12).text(`Customer: ${quote.customer.name}`);
                if (quote.customer.email) doc.fontSize(10).text(`Email: ${quote.customer.email}`);
                if (quote.customer.phone) doc.fontSize(10).text(`Phone: ${quote.customer.phone}`);
            } else {
                doc.fontSize(12).text(`Customer: Walk-in`);
            }
            doc.moveDown();

            // Date Info
            doc.fontSize(10).text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`);
            if (quote.validUntil) {
                doc.fontSize(10).text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`);
            }
            doc.moveDown();

            // Items Table Header
            const tableTop = doc.y;
            doc.font('Helvetica-Bold');
            doc.text('Item', 50, tableTop);
            doc.text('Qty', 300, tableTop);
            doc.text('Price', 400, tableTop);
            doc.text('Total', 500, tableTop);

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
            doc.font('Helvetica');

            let y = tableTop + 25;
            quote.items.forEach(item => {
                doc.text(item.productName, 50, y);
                doc.text(item.quantity.toString(), 300, y);
                doc.text(`$${Number(item.price).toFixed(2)}`, 400, y);
                doc.text(`$${(Number(item.price) * item.quantity).toFixed(2)}`, 500, y);
                y += 20;
            });

            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 15;

            // Totals
            doc.font('Helvetica-Bold');
            doc.text('Subtotal:', 400, y);
            doc.text(`$${Number(quote.subtotal).toFixed(2)}`, 500, y);
            y += 20;

            if (Number(quote.discount) > 0) {
                doc.text('Discount:', 400, y);
                doc.text(`-$${Number(quote.discount).toFixed(2)}`, 500, y);
                y += 20;
            }

            doc.text('Tax:', 400, y);
            doc.text(`$${Number(quote.tax).toFixed(2)}`, 500, y);
            y += 20;

            doc.fontSize(14).text('Total:', 400, y);
            doc.text(`$${Number(quote.total).toFixed(2)}`, 500, y);

            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica').text('Thank you for your business!', { align: 'center' });
            if (quote.notes) {
                doc.moveDown();
                doc.text(`Notes: ${quote.notes}`);
            }

            doc.end();
        } catch (error) {
            console.error("Generate quote PDF error:", error);
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to generate PDF" });
            }
        }
    },
};
