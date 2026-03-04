import { Request, Response } from "express";
import { storage } from "../storage";
import { insertPromotionSchema } from "../../shared/schema";
import { z } from "zod";

export const promotionsController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const promos = await storage.getAllPromotions();
            res.json(promos);
        } catch (error) {
            console.error("Error fetching promotions:", error);
            res.status(500).json({ message: "Failed to fetch promotions" });
        }
    },

    getActive: async (_req: Request, res: Response) => {
        try {
            const promos = await storage.getAllPromotions();
            const now = new Date();

            const activePromos = promos.filter(p => {
                if (p.status !== "Active") return false;
                if (p.startDate && new Date(p.startDate) > now) return false;
                if (p.endDate && new Date(p.endDate) < now) return false;
                return true;
            });

            res.json(activePromos);
        } catch (error) {
            console.error("Error fetching active promotions:", error);
            res.status(500).json({ message: "Failed to fetch active promotions" });
        }
    },

    getByCode: async (req: Request, res: Response) => {
        try {
            const code = req.params.code;
            const promo = await storage.getPromotionByCode(code);

            if (!promo) {
                return res.status(404).json({ message: "Promotion code not found" });
            }

            // Check if it's active
            if (promo.status !== "Active") {
                return res.status(400).json({ message: `Promotion is ${promo.status.toLowerCase()}` });
            }

            // Check dates if applicable
            const now = new Date();
            if (promo.startDate && new Date(promo.startDate) > now) {
                return res.status(400).json({ message: "Promotion has not started yet" });
            }
            if (promo.endDate && new Date(promo.endDate) < now) {
                return res.status(400).json({ message: "Promotion has expired" });
            }

            res.json(promo);
        } catch (error) {
            console.error("Error fetching promotion by code:", error);
            res.status(500).json({ message: "Failed to fetch promotion" });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const promoData = insertPromotionSchema.parse(req.body);
            const exists = await storage.getPromotionByCode(promoData.code);
            if (exists) {
                return res.status(400).json({ message: "Promotion code already exists" });
            }

            const promo = await storage.createPromotion(promoData);
            res.status(201).json(promo);
        } catch (error) {
            console.error("Error creating promotion:", error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid promotion data", errors: error.errors });
            }
            res.status(500).json({ message: "Failed to create promotion" });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid promotion ID" });
            }

            const promoData = insertPromotionSchema.partial().parse(req.body);
            const updated = await storage.updatePromotion(id, promoData);

            if (!updated) {
                return res.status(404).json({ message: "Promotion not found" });
            }

            res.json(updated);
        } catch (error) {
            console.error("Error updating promotion:", error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid promotion data", errors: error.errors });
            }
            res.status(500).json({ message: "Failed to update promotion" });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid promotion ID" });
            }

            const deleted = await storage.deletePromotion(id);
            if (!deleted) {
                return res.status(404).json({ message: "Promotion not found" });
            }

            res.status(204).send();
        } catch (error) {
            console.error("Error deleting promotion:", error);
            res.status(500).json({ message: "Failed to delete promotion" });
        }
    }
};
