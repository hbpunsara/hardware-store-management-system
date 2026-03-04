import { Request, Response } from "express";
import { storage } from "../storage";
import { insertShiftSchema } from "../../shared/schema";

export const shiftsController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const shifts = await storage.getShifts();
            res.json(shifts);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch shifts" });
        }
    },

    getActive: async (req: Request, res: Response) => {
        try {
            if (!(req as any).user) return res.status(401).json({ message: "Not authenticated" });
            const shift = await storage.getActiveShift((req as any).user.id);
            if (shift) {
                res.json(shift);
            } else {
                res.status(404).json({ message: "No active shift found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch active shift" });
        }
    },

    start: async (req: Request, res: Response) => {
        try {
            if (!(req as any).user) return res.status(401).json({ message: "Not authenticated" });
            const activeData = await storage.getActiveShift((req as any).user.id);
            if (activeData) {
                return res.status(400).json({ message: "You already have an active shift." });
            }

            const parsed = insertShiftSchema.safeParse({
                cashierId: (req as any).user.id,
                startTime: new Date().toISOString(),
                startingFloat: req.body.startingFloat,
                status: "Active"
            });
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid starting float" });
            }
            const shift = await storage.startShift(parsed.data);
            res.status(201).json(shift);
        } catch (error) {
            res.status(500).json({ message: "Failed to start shift" });
        }
    },

    end: async (req: Request, res: Response) => {
        try {
            if (!(req as any).user) return res.status(401).json({ message: "Not authenticated" });
            const activeData = await storage.getActiveShift((req as any).user.id);
            if (!activeData) {
                return res.status(400).json({ message: "No active shift to end." });
            }

            const { actualCash } = req.body;
            if (typeof actualCash !== 'number') {
                return res.status(400).json({ message: "actualCash must be a number" });
            }

            const expectedCash = req.body.expectedCash ?? activeData.startingFloat;
            const discrepancy = actualCash - expectedCash;

            const closedShift = await storage.endShift(activeData.id, actualCash, expectedCash, discrepancy);
            if (closedShift) {
                res.json(closedShift);
            } else {
                res.status(500).json({ message: "Failed to close shift" });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to end shift" });
        }
    }
};
