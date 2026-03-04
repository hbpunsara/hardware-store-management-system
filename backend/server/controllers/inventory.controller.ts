import { Request, Response } from "express";
import { storage } from "../storage";

export const inventoryController = {
    getAllAdjustments: async (_req: Request, res: Response) => {
        try {
            const rows = await storage.getAllStockAdjustments();
            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch stock adjustments" });
        }
    },

    createAdjustment: async (req: Request, res: Response) => {
        try {
            const { productId, quantityAdjusted, reason } = req.body;
            // Note: userId could be pulled from req.user if auth is properly populated

            if (!productId || typeof quantityAdjusted !== 'number' || !reason) {
                return res.status(400).json({ message: "Missing required fields: productId, quantityAdjusted, or reason" });
            }

            const row = await storage.createStockAdjustment({
                productId: Number(productId),
                quantityAdjusted: Number(quantityAdjusted),
                reason: String(reason),
                userId: null // Optional logic here if auth gives userId
            });

            res.status(201).json(row);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to log stock adjustment" });
        }
    },
};
