import { Request, Response } from "express";
import { storage } from "../storage";

export const suppliersController = {
    getAll: async (_req: Request, res: Response) => {
        try {
            const rows = await storage.getAllSuppliers();
            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch suppliers" });
        }
    },

    getById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) {
                return res.status(400).json({ message: "Invalid supplier id" });
            }
            const row = await storage.getSupplier(id);
            if (!row) return res.status(404).json({ message: "Supplier not found" });
            res.json(row);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch supplier" });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const { name, contactName, email, phone, address } = req.body;
            if (!name) {
                return res.status(400).json({ message: "Missing required field: name" });
            }
            const data = {
                name: String(name),
                contactName: contactName ? String(contactName) : null,
                email: email ? String(email) : null,
                phone: phone ? String(phone) : null,
                address: address ? String(address) : null,
            };
            const row = await storage.createSupplier(data);
            res.status(201).json(row);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to create supplier" });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) {
                return res.status(400).json({ message: "Invalid supplier id" });
            }
            const { name, contactName, email, phone, address } = req.body;
            const data: Record<string, any> = {};
            if (name !== undefined) data.name = String(name);
            if (contactName !== undefined) data.contactName = contactName ? String(contactName) : null;
            if (email !== undefined) data.email = email ? String(email) : null;
            if (phone !== undefined) data.phone = phone ? String(phone) : null;
            if (address !== undefined) data.address = address ? String(address) : null;

            const row = await storage.updateSupplier(id, data);
            if (!row) return res.status(404).json({ message: "Supplier not found" });
            res.json(row);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to update supplier" });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) {
                return res.status(400).json({ message: "Invalid supplier id" });
            }
            const success = await storage.deleteSupplier(id);
            if (!success) {
                return res.status(404).json({ message: "Supplier not found" });
            }
            res.status(204).send();
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to delete supplier" });
        }
    },
};
