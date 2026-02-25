import { Request, Response } from "express";
import { storage } from "../storage";

const roleDisplay: Record<string, string> = {
  admin: "Administrator",
  administrator: "Administrator",
  cashier: "Cashier",
  "inventory manager": "Inventory Manager",
  supervisor: "Supervisor",
  accountant: "Accountant",
};

function toUserRow(row: { id: string; username: string; name: string | null; role: string | null; email: string | null }) {
  const rawRole = (row.role ?? "cashier").toLowerCase();
  return {
    id: row.id,
    name: row.name ?? row.username,
    username: row.username,
    role: roleDisplay[rawRole] ?? rawRole.charAt(0).toUpperCase() + rawRole.slice(1),
    email: row.email ?? "",
    status: "Active",
    lastLogin: "N/A",
  };
}

export const usersController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await storage.getAllUsers();
    res.json(rows.map((r) => toUserRow(r)));
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name, email, role, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Missing required fields: name, email, password" });
      }
      const baseUsername = (email.split("@")[0] || "user").replace(/[^a-zA-Z0-9]/g, "") || `user${Date.now()}`;
      let username = baseUsername;
      let suffix = 0;
      while (await storage.getUserByUsername(username)) {
        suffix++;
        username = `${baseUsername}${suffix}`;
      }
      const row = await storage.createUser({
        username,
        password: String(password),
        name: String(name).trim(),
        role: role ? String(role).toLowerCase() : "cashier",
        email: String(email).trim(),
      });
      res.status(201).json(toUserRow(row));
    } catch (err: unknown) {
      const msg = (err as { code?: string }).code === "23505"
        ? "A user with this email already exists"
        : (err as Error).message;
      console.error("Create user error:", err);
      res.status(500).json({ message: msg || "Failed to create user" });
    }
  },
};
