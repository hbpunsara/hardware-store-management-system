import { type Request, type Response } from "express";
import { storage } from "../storage";

export const loyaltyController = {
    redeem: async (req: Request, res: Response) => {
        try {
            const { customerId, points } = req.body;

            if (!customerId || !points || points <= 0) {
                return res.status(400).json({ message: "Invalid request payload" });
            }

            const customer = await storage.getCustomer(customerId);
            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }

            if (customer.loyaltyPoints < points) {
                return res.status(400).json({ message: `Not enough loyalty points. Available: ${customer.loyaltyPoints}` });
            }

            // Deduct points
            const ledgerEntry = await storage.addLoyaltyPoints(customerId, -points, "Redeemed for cart discount");

            res.status(200).json({
                message: "Points redeemed successfully",
                pointsRemaining: customer.loyaltyPoints - points,
                ledgerEntry
            });
        } catch (error) {
            console.error("Loyalty redeem error:", error);
            res.status(500).json({ message: "Failed to redeem loyalty points" });
        }
    },

    getLedger: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.customerId);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid customer ID" });

            const ledger = await storage.getLoyaltyLedger(id);
            res.json(ledger);
        } catch (error) {
            console.error("Fetch loyalty ledger error:", error);
            res.status(500).json({ message: "Failed to fetch loyalty history" });
        }
    }
};
