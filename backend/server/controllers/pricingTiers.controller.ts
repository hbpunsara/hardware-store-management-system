import type { Request, Response } from "express";
import { storage } from "../storage";

export const pricingTiersController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const tiers = await storage.getAllTierMultipliers();
            res.json(tiers);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch pricing tiers", error });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const { tierName, multiplier } = req.body;
            if (!tierName || multiplier === undefined) {
                res.status(400).json({ message: "tierName and multiplier are required" });
                return;
            }
            const updated = await storage.updateTierMultiplier(tierName, Number(multiplier));
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: "Failed to update pricing tier", error });
        }
    },
};
