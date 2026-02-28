import { db, getRemoteDb } from "./db";
import { syncQueue, products, sales, employees, transactions } from "../shared/schema";
import { eq, asc } from "drizzle-orm";

let isSyncing = false;

export async function processSyncQueue() {
    if (isSyncing) return;

    const remoteDb = getRemoteDb();
    if (!remoteDb) {
        console.log("[Sync] Remote DB not configured or offline. Skipping sync.");
        return;
    }

    isSyncing = true;
    try {
        const queueItems = await db.select().from(syncQueue).orderBy(asc(syncQueue.createdAt)).limit(50);

        if (queueItems.length > 0) {
            console.log(`[Sync] Found ${queueItems.length} items to sync.`);
        }

        for (const item of queueItems) {
            try {
                const payload = JSON.parse(item.payload);

                switch (item.tableName) {
                    case 'products':
                        if (item.operation === 'INSERT') await remoteDb.insert(products).values(payload).onConflictDoNothing();
                        else if (item.operation === 'UPDATE') await remoteDb.update(products).set(payload).where(eq(products.id, Number(item.recordId)));
                        else if (item.operation === 'DELETE') await remoteDb.delete(products).where(eq(products.id, Number(item.recordId)));
                        break;
                    // Add other tables explicitly mapped here as needed
                    case 'sales':
                        if (item.operation === 'INSERT') {
                            const { items, ...saleData } = payload;
                            // Just sync the header for this basic example
                            await remoteDb.insert(sales).values(saleData).onConflictDoNothing();
                        }
                        break;

                    case 'employees':
                        if (item.operation === 'INSERT') await remoteDb.insert(employees).values(payload).onConflictDoNothing();
                        else if (item.operation === 'UPDATE') await remoteDb.update(employees).set(payload).where(eq(employees.id, Number(item.recordId)));
                        break;
                }

                // 3. Mark successful in local queue by deleting it
                await db.delete(syncQueue).where(eq(syncQueue.id, item.id));

            } catch (err: any) {
                console.error(`[Sync] Failed to sync item ${item.id}:`, err.message);
                // We'll leave it in the queue to retry later.
            }
        }
    } catch (error) {
        console.error("[Sync] Critical sync manager error:", error);
    } finally {
        isSyncing = false;
    }
}

// Start polling
export function startSyncDaemon() {
    console.log("[Sync] Starting background sync daemon...");
    // Check every 15 seconds
    setInterval(processSyncQueue, 15000);
}
