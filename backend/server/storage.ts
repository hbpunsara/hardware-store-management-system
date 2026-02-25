import { users, products, sales, saleItems, employees, transactions, storeSettings } from "../shared/schema";
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
}

export class DatabaseStorage implements IStorage {
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
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
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
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(eq(products.id, item.productId));
          }
        }
      }

      return newSale;
    });
  }

  async getSalesStats(start: Date, end: Date): Promise<{ totalAmount: number; count: number }> {
    const rows = await db
      .select()
      .from(sales)
      .where(and(gte(sales.createdAt, start), lt(sales.createdAt, end)));

    const totalAmount = rows.reduce((sum, r) => sum + Number(r.total), 0);
    return { totalAmount, count: rows.length };
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [emp] = await db.insert(employees).values(data).returning();
    return emp;
  }

  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [emp] = await db
      .update(employees)
      .set(data)
      .where(eq(employees.id, id))
      .returning();
    return emp;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.id));
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(data).returning();
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
        .set({ value })
        .where(eq(storeSettings.key, key))
        .returning();
      return updated;
    }
    const [created] = await db.insert(storeSettings).values({ key, value }).returning();
    return created;
  }

  async getAllStoreSettings(): Promise<StoreSetting[]> {
    return await db.select().from(storeSettings);
  }
}

export const storage = new DatabaseStorage();
