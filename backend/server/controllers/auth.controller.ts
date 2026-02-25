import { Request, Response } from "express";
import { storage } from "../storage";

export const authController = {
  login: async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  },

  logout: (_req: Request, res: Response) => {
    res.json({ message: "Logged out successfully" });
  },

  me: async (req: Request, res: Response) => {
    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  },
};
