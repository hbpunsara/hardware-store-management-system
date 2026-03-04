import { Request, Response } from "express";
import { storage } from "../storage";
import { insertParkedSaleSchema, insertParkedSaleItemSchema } from "../../shared/schema";
import { z } from "zod";

export const parkedSalesController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const sales = await storage.getAllParkedSales();
            res.json(sales);
        } catch (error) {
            console.error("Error fetching parked sales:", error);
            res.status(500).json({ message: "Failed to fetch parked sales" });
        }
    },

    getById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid parked sale ID" });
            }

            const sale = await storage.getParkedSale(id);
            if (!sale) {
                return res.status(404).json({ message: "Parked sale not found" });
            }

            res.json(sale);
        } catch (error) {
            console.error("Error fetching parked sale:", error);
            res.status(500).json({ message: "Failed to fetch parked sale" });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const saleData = insertParkedSaleSchema.parse(req.body);
            const itemsData = z.array(insertParkedSaleItemSchema).parse(req.body.items || []);

            const sale = await storage.createParkedSale(saleData, itemsData);
            res.status(201).json(sale);
        } catch (error) {
            console.error("Error parking sale:", error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid parked sale data", errors: error.errors });
            }
            res.status(500).json({ message: "Failed to park sale" });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid parked sale ID" });
            }

            const deleted = await storage.deleteParkedSale(id);
            if (!deleted) {
                return res.status(404).json({ message: "Parked sale not found" });
            }

            res.status(204).send();
        } catch (error) {
            console.error("Error deleting parked sale:", error);
            res.status(500).json({ message: "Failed to delete parked sale" });
        }
    }
};
