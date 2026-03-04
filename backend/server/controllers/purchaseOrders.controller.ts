import { Request, Response } from "express";
import { storage } from "../storage";

export const purchaseOrdersController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const rows = await storage.getAllPurchaseOrders();
            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch POs" });
        }
    },

    getById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid PO id" });
            const row = await storage.getPurchaseOrder(id);
            if (!row) return res.status(404).json({ message: "PO not found" });
            res.json(row);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch PO" });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const { supplierId, total, items } = req.body;
            if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: "Missing supplierId or items" });
            }

            const poData = {
                supplierId: Number(supplierId),
                total: Number(total) || 0,
                status: "Draft",
            };

            const itemsData = items.map((i: any) => ({
                productId: Number(i.productId),
                quantity: Number(i.quantity),
                costPrice: Number(i.costPrice),
            }));

            const newPO = await storage.createPurchaseOrder(poData, itemsData);
            res.status(201).json(newPO);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to create PO" });
        }
    },

    updateStatus: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid PO id" });

            const { status } = req.body;
            if (!status) return res.status(400).json({ message: "Missing status field" });

            const updated = await storage.updatePurchaseOrderStatus(id, String(status));
            if (!updated) return res.status(404).json({ message: "PO not found" });
            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to update PO status" });
        }
    },
};
