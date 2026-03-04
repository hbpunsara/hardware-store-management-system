import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertReturnItem, ReturnItem } from "../../shared/schema";

export const returnsController = {
    getBySaleId: async (req: Request, res: Response) => {
        try {
            const saleId = parseInt(req.params.saleId);
            if (isNaN(saleId)) return res.status(400).json({ message: "Invalid sale ID" });

            const returns = await storage.getReturnsBySaleId(saleId);
            res.json(returns);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to fetch returns" });
        }
    },

    getById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ message: "Invalid return ID" });

            const ret = await storage.getReturn(id);
            if (!ret) return res.status(404).json({ message: "Return not found" });

            res.json(ret);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to fetch return" });
        }
    },

    createReturn: async (req: Request, res: Response) => {
        try {
            const { saleId, customerId, items, reason, issueStoreCredit } = req.body;

            if (!saleId) return res.status(400).json({ message: "Sale ID is required" });
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: "Return must contain items" });
            }

            // Verify original sale exists
            const sale = await storage.getSale(Number(saleId));
            if (!sale) return res.status(404).json({ message: "Original sale not found" });

            let totalRefunded = 0;
            const returnItemsPayload: Omit<InsertReturnItem, "returnId">[] = items.map((item: any) => {
                const refundAmt = Number(item.refundAmount) || 0;
                const fee = Number(item.restockFee) || 0;
                totalRefunded += refundAmt;

                return {
                    productId: Number(item.productId),
                    quantity: Number(item.quantity) || 1,
                    restockFee: fee,
                    refundAmount: refundAmt,
                };
            });

            const returnData = {
                saleId: Number(saleId),
                customerId: customerId ? Number(customerId) : null,
                totalRefunded,
                reason: String(reason || "Customer Return"),
            };

            const createdReturn = await storage.createReturn(returnData, returnItemsPayload);

            // Handle store credit issuance if requested
            if (issueStoreCredit && customerId && totalRefunded > 0) {
                const code = `SC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
                await storage.createStoreCredit({
                    customerId: Number(customerId),
                    amount: totalRefunded,
                    originalAmount: totalRefunded,
                    code,
                    status: "Active"
                });
            }

            res.status(201).json(createdReturn);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to create return" });
        }
    }
};
