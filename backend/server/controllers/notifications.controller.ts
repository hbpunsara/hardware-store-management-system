import { Request, Response } from "express";
import { db } from "../db";
import { notifications, products } from "../../shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export const notificationsController = {
  // Get all notifications (both generated and from DB)
  getAll: async (req: Request, res: Response) => {
    try {
      // 1. Generate low stock alerts dynamically if needed
      // Check for low stock
      const lowStockProducts = await (db as any)
        .select()
        .from(products)
        .where(sql`${products.stock} <= 5`);

      // We could insert them if they don't exist, but simplistic approach:
      // Just fetch existing notifications from DB
      const dbNotifications = await (db as any)
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(20);

      const dynamicNotifications = [];

      // Add low stock dynamic notifications (not saved to DB to prevent spam, or we can just serve them mixed)
      for (const p of lowStockProducts) {
        dynamicNotifications.push({
          id: `dyn-${p.id}`,
          title: "Low Stock Alert",
          message: `${p.name} is running low (${p.stock} left)`,
          type: "warning",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      // Combine and return
      let allNotifications = [...dynamicNotifications, ...dbNotifications];

      // Format time safely
      const formatted = allNotifications.map(n => ({
        ...n,
        time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
      }));

      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  },

  // Mark notification as read (delete or update)
  markRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (id.startsWith('dyn-')) {
        // Dynamic notification, just ignore
        return res.json({ success: true });
      }

      await (db as any).update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, parseInt(id)));

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  },
  
  clearAll: async (req: Request, res: Response) => {
    try {
      await (db as any).delete(notifications);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  }
};
