import { Request, Response } from "express";
import { db, getRemoteDb } from "../db";
import { syncQueue } from "../../shared/schema";
import { sql } from "drizzle-orm";

class SystemController {
    async getStatus(req: Request, res: Response) {
        try {
            // Check local DB
            const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(syncQueue);

            // Check remote DB connectivity
            let isOnline = false;
            const remoteDb = getRemoteDb();
            if (remoteDb) {
                try {
                    // simple 1=1 query using Drizzle raw sql
                    await remoteDb.execute(sql`SELECT 1`);
                    isOnline = true;
                } catch (e) {
                    isOnline = false;
                }
            }

            res.json({
                online: isOnline,
                pendingSyncItems: Number(count)
            });

        } catch (error) {
            res.status(500).json({ message: "Failed to check system status" });
        }
    }
}

export const systemController = new SystemController();
