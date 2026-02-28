import { users, products, sales, saleItems, employees, transactions, storeSettings, payrolls, syncQueue } from "../shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc, sql, and, gte, lt } from "drizzle-orm";

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = typeof saleItems.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type StoreSetting = typeof storeSettings.$inferSelect;
export type InsertStoreSetting = typeof storeSettings.$inferInsert;
export type Payroll = typeof payrolls.$inferSelect;
export type InsertPayroll = typeof payrolls.$inferInsert;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;

  getAllSales(): Promise<Sale[]>;
  getSale(id: number): Promise<(Sale & { items: SaleItem[] }) | undefined>;
  createSale(sale: InsertSale, items: Omit<InsertSaleItem, "saleId">[]): Promise<Sale>;
  getSalesStats(start: Date, end: Date): Promise<{ totalAmount: number; count: number }>;

  getAllEmployees(): Promise<Employee[]>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined>;

  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;

  getStoreSetting(key: string): Promise<StoreSetting | undefined>;
  setStoreSetting(key: string, value: string): Promise<StoreSetting>;
  getAllStoreSettings(): Promise<StoreSetting[]>;

  getAllPayrolls(month?: string): Promise<(Payroll & { employee: Employee })[]>;
  getPayroll(id: number): Promise<(Payroll & { employee: Employee }) | undefined>;
  createPayroll(data: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll | undefined>;
  deletePayroll(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {

  // Helper to enqueue a background sync operation
  private async pushToSyncQueue(tableName: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', recordId: string | number, payload: any) {
    try {
      await db.insert(syncQueue).values({
        tableName,
        operation,
        recordId: String(recordId),
        payload: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to enqueue sync operation:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    if (user) await this.pushToSyncQueue('users', 'INSERT', user.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    if (product) await this.pushToSyncQueue('products', 'INSERT', product.id, product);
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updateData, isSynced: false, updatedAt: new Date().toISOString() })
      .where(eq(products.id, id))
      .returning();
    if (product) await this.pushToSyncQueue('products', 'UPDATE', product.id, product);
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (deleted) await this.pushToSyncQueue('products', 'DELETE', id, { id });
    return !!deleted;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchStr = `%${query}%`;
    return await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, searchStr),
          ilike(products.sku, searchStr),
          ilike(products.category, searchStr)
        )
      );
  }

  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }

  async getSale(id: number): Promise<(Sale & { items: SaleItem[] }) | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    return { ...sale, items };
  }

  async createSale(insertSale: InsertSale, items: Omit<InsertSaleItem, "saleId">[]): Promise<Sale> {
    // Note: Since we are using better-sqlite3 directly, Native Drizzle Transactions on SQLite can be done:
    return await db.transaction(async (tx) => {
      const [newSale] = await tx.insert(sales).values(insertSale).returning();
      if (!newSale) throw new Error("Failed to create sale");

      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          ...item,
          saleId: newSale.id,
        }));
        await tx.insert(saleItems).values(itemsToInsert);

        // Update stock for items with productId
        for (const item of items) {
          if (item.productId != null) {
            await tx.update(products)
              .set({
                stock: sql`${products.stock} - ${item.quantity}`,
                isSynced: false,
                updatedAt: new Date().toISOString()
              })
              .where(eq(products.id, item.productId));

            const [updatedProd] = await tx.select().from(products).where(eq(products.id, item.productId));
            // Push internal SQL updates to the external queue
            if (updatedProd) {
              await tx.insert(syncQueue).values({
                tableName: 'products',
                operation: 'UPDATE',
                recordId: String(updatedProd.id),
                payload: JSON.stringify(updatedProd),
              });
            }
          }
        }
      }

      const freshItems = await tx.select().from(saleItems).where(eq(saleItems.saleId, newSale.id));
      await tx.insert(syncQueue).values({
        tableName: 'sales',
        operation: 'INSERT',
        recordId: String(newSale.id),
        payload: JSON.stringify({ ...newSale, items: freshItems }),
      });

      return newSale;
    });
  }

  async getSalesStats(start: Date, end: Date): Promise<{ totalAmount: number; count: number }> {
    const rows = await db
      .select()
      .from(sales)
      .where(and(gte(sales.createdAt, start.toISOString()), lt(sales.createdAt, end.toISOString())));

    const totalAmount = rows.reduce((sum, r) => sum + Number(r.total), 0);
    return { totalAmount, count: rows.length };
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [emp] = await db.insert(employees).values(data).returning();
    if (emp) await this.pushToSyncQueue('employees', 'INSERT', emp.id, emp);
    return emp;
  }

  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [emp] = await db
      .update(employees)
      .set({ ...data, isSynced: false, updatedAt: new Date().toISOString() })
      .where(eq(employees.id, id))
      .returning();
    if (emp) await this.pushToSyncQueue('employees', 'UPDATE', emp.id, emp);
    return emp;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.id));
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(data).returning();
    if (tx) await this.pushToSyncQueue('transactions', 'INSERT', tx.id, tx);
    return tx;
  }

  async getStoreSetting(key: string): Promise<StoreSetting | undefined> {
    const [s] = await db.select().from(storeSettings).where(eq(storeSettings.key, key));
    return s;
  }

  async setStoreSetting(key: string, value: string): Promise<StoreSetting> {
    const [existing] = await db.select().from(storeSettings).where(eq(storeSettings.key, key));
    if (existing) {
      const [updated] = await db
        .update(storeSettings)
        .set({ value, isSynced: false, updatedAt: new Date().toISOString() })
        .where(eq(storeSettings.key, key))
        .returning();
      if (updated) await this.pushToSyncQueue('store_settings', 'UPDATE', updated.id, updated);
      return updated;
    }
    const [created] = await db.insert(storeSettings).values({ key, value }).returning();
    if (created) await this.pushToSyncQueue('store_settings', 'INSERT', created.id, created);
    return created;
  }

  async getAllStoreSettings(): Promise<StoreSetting[]> {
    return await db.select().from(storeSettings);
  }

  async getAllPayrolls(month?: string): Promise<(Payroll & { employee: Employee })[]> {
    let q = db.select({ payroll: payrolls, employee: employees })
      .from(payrolls)
      .innerJoin(employees, eq(payrolls.employeeId, employees.id));

    if (month) {
      q = q.where(eq(payrolls.month, month)) as any;
    }

    const rows = await q;
    return rows.map(r => ({ ...r.payroll, employee: r.employee }));
  }

  async getPayroll(id: number): Promise<(Payroll & { employee: Employee }) | undefined> {
    const [row] = await db.select({ payroll: payrolls, employee: employees })
      .from(payrolls)
      .innerJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(eq(payrolls.id, id));
    if (!row) return undefined;
    return { ...row.payroll, employee: row.employee };
  }

  async createPayroll(data: InsertPayroll): Promise<Payroll> {
    const [payroll] = await db.insert(payrolls).values(data).returning();
    if (payroll) await this.pushToSyncQueue('payrolls', 'INSERT', payroll.id, payroll);
    return payroll;
  }

  async updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll | undefined> {
    const [payroll] = await db.update(payrolls).set({ ...data, isSynced: false, updatedAt: new Date().toISOString() }).where(eq(payrolls.id, id)).returning();
    if (payroll) await this.pushToSyncQueue('payrolls', 'UPDATE', payroll.id, payroll);
    return payroll;
  }

  async deletePayroll(id: number): Promise<boolean> {
    const [deleted] = await db.delete(payrolls).where(eq(payrolls.id, id)).returning();
    if (deleted) await this.pushToSyncQueue('payrolls', 'DELETE', id, { id });
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
