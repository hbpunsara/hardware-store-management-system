import { users, products, sales, saleItems, employees, transactions, storeSettings, payrolls, syncQueue, customers, quotes, quoteItems, suppliers, purchaseOrders, purchaseOrderItems, stockAdjustments, returns, returnItems, storeCredits, parkedSales, parkedSaleItems, promotions, tierMultipliers, loyaltyLedger, shifts } from "../shared/schema";
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
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type InsertStockAdjustment = typeof stockAdjustments.$inferInsert;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = typeof returns.$inferInsert;
export type ReturnItem = typeof returnItems.$inferSelect;
export type InsertReturnItem = typeof returnItems.$inferInsert;
export type StoreCredit = typeof storeCredits.$inferSelect;
export type InsertStoreCredit = typeof storeCredits.$inferInsert;
export type ParkedSale = typeof parkedSales.$inferSelect;
export type InsertParkedSale = typeof parkedSales.$inferInsert;
export type ParkedSaleItem = typeof parkedSaleItems.$inferSelect;
export type InsertParkedSaleItem = typeof parkedSaleItems.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;
export type TierMultiplier = typeof tierMultipliers.$inferSelect;
export type InsertTierMultiplier = typeof tierMultipliers.$inferInsert;
export type LoyaltyLedger = typeof loyaltyLedger.$inferSelect;
export type InsertLoyaltyLedger = typeof loyaltyLedger.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
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
  getSale(id: number): Promise<(Sale & { items: SaleItem[] }) | undefined>;
  createSale(sale: InsertSale, items: Omit<InsertSaleItem, "saleId">[]): Promise<Sale>;
  updateSaleStatus(id: number, status: string): Promise<Sale | undefined>;
  updateSaleEmailedAt(id: number, emailedAt: Date): Promise<Sale | undefined>;
  getSalesStats(start: Date, end: Date): Promise<{ totalAmount: number; count: number }>;

  getAllEmployees(): Promise<Employee[]>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

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

  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  getAllQuotes(): Promise<Quote[]>;
  getQuote(id: number): Promise<(Quote & { items: QuoteItem[], customer: Customer | null }) | undefined>;
  createQuote(quote: InsertQuote, items: Omit<InsertQuoteItem, "quoteId">[]): Promise<Quote>;
  updateQuote(id: number, updateData: Partial<InsertQuote>): Promise<Quote | undefined>;

  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  getAllPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<(PurchaseOrder & { items: PurchaseOrderItem[], supplier: Supplier | null }) | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder, items: Omit<InsertPurchaseOrderItem, "purchaseOrderId">[]): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder | undefined>;

  getAllStockAdjustments(): Promise<(StockAdjustment & { product: Product | null })[]>;
  createStockAdjustment(data: InsertStockAdjustment): Promise<StockAdjustment>;

  getReturnsBySaleId(saleId: number): Promise<Return[]>;
  getReturn(id: number): Promise<(Return & { items: ReturnItem[] }) | undefined>;
  createReturn(insertReturn: InsertReturn, items: Omit<InsertReturnItem, "returnId">[]): Promise<Return>;
  createStoreCredit(insertCredit: InsertStoreCredit): Promise<StoreCredit>;

  getLoyaltyLedger(customerId: number): Promise<LoyaltyLedger[]>;
  addLoyaltyPoints(customerId: number, pointsDelta: number, reason: string): Promise<LoyaltyLedger>;

  getShifts(): Promise<Shift[]>;
  getActiveShift(cashierId: string): Promise<Shift | undefined>;
  startShift(data: InsertShift): Promise<Shift>;
  endShift(id: number, actualCash: number, expectedCash: number, discrepancy: number): Promise<Shift | undefined>;
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

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, isSynced: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (user) await this.pushToSyncQueue('users', 'UPDATE', user.id, user);
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
      .set({ ...updateData, isSynced: false, updatedAt: new Date() })
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
                updatedAt: new Date()
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

  async updateSaleStatus(id: number, status: string): Promise<Sale | undefined> {
    const [sale] = await db.update(sales)
      .set({ status, isSynced: false, updatedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();

    if (sale) {
      await this.pushToSyncQueue('sales', 'UPDATE', String(sale.id), sale);
    }
    return sale;
  }

  async updateSaleEmailedAt(id: number, emailedAt: Date): Promise<Sale | undefined> {
    const [sale] = await db.update(sales)
      .set({ emailedAt, isSynced: false, updatedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();

    if (sale) {
      await this.pushToSyncQueue('sales', 'UPDATE', String(sale.id), sale);
    }
    return sale;
  }

  async getSalesStats(start: Date, end: Date): Promise<{ totalAmount: number; count: number }> {
    const rows = await db
      .select()
      .from(sales)
      .where(sql`created_at >= ${start} AND created_at < ${end}`);

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
      .set({ ...data, isSynced: false, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    if (emp) await this.pushToSyncQueue('employees', 'UPDATE', emp.id, emp);
    return emp;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const [deleted] = await db.delete(employees).where(eq(employees.id, id)).returning();
    if (deleted) await this.pushToSyncQueue('employees', 'DELETE', id, { id });
    return !!deleted;
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
        .set({ value, isSynced: false, updatedAt: new Date() })
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
    const [payroll] = await db.update(payrolls).set({ ...data, isSynced: false, updatedAt: new Date() }).where(eq(payrolls.id, id)).returning();
    if (payroll) await this.pushToSyncQueue('payrolls', 'UPDATE', payroll.id, payroll);
    return payroll;
  }

  async deletePayroll(id: number): Promise<boolean> {
    const [deleted] = await db.delete(payrolls).where(eq(payrolls.id, id)).returning();
    if (deleted) await this.pushToSyncQueue('payrolls', 'DELETE', id, { id });
    return !!deleted;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.id));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(data).returning();
    if (customer) await this.pushToSyncQueue('customers', 'INSERT', customer.id, customer);
    return customer;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set({ ...data, isSynced: false, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
    if (customer) await this.pushToSyncQueue('customers', 'UPDATE', customer.id, customer);
    return customer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const [deleted] = await db.delete(customers).where(eq(customers.id, id)).returning();
    if (deleted) await this.pushToSyncQueue('customers', 'DELETE', id, { id });
    return !!deleted;
  }

  async getAllQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: number): Promise<(Quote & { items: QuoteItem[], customer: Customer | null }) | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    if (!quote) return undefined;

    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id));
    let customer = null;
    if (quote.customerId) {
      const [cust] = await db.select().from(customers).where(eq(customers.id, quote.customerId));
      customer = cust || null;
    }

    return { ...quote, items, customer };
  }

  async createQuote(insertQuote: InsertQuote, items: Omit<InsertQuoteItem, "quoteId">[]): Promise<Quote> {
    return await db.transaction(async (tx) => {
      const [newQuote] = await tx.insert(quotes).values(insertQuote).returning();
      if (!newQuote) throw new Error("Failed to create quote");

      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          ...item,
          quoteId: newQuote.id,
        }));
        await tx.insert(quoteItems).values(itemsToInsert);
      }

      await tx.insert(syncQueue).values({
        tableName: 'quotes',
        operation: 'INSERT',
        recordId: String(newQuote.id),
        payload: JSON.stringify(newQuote),
      });

      return newQuote;
    });
  }

  async updateQuote(id: number, updateData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [quote] = await db.update(quotes).set({ ...updateData, isSynced: false, updatedAt: new Date() }).where(eq(quotes.id, id)).returning();
    if (quote) await this.pushToSyncQueue('quotes', 'UPDATE', quote.id, quote);
    return quote;
  }

  // --- Suppliers ---
  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return row;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [row] = await db.insert(suppliers).values(data).returning();
    if (row) await this.pushToSyncQueue('suppliers', 'INSERT', row.id, row);
    return row;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [row] = await db.update(suppliers).set({ ...data, isSynced: false, updatedAt: new Date() }).where(eq(suppliers.id, id)).returning();
    if (row) await this.pushToSyncQueue('suppliers', 'UPDATE', row.id, row);
    return row;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const [deleted] = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    if (deleted) await this.pushToSyncQueue('suppliers', 'DELETE', id, { id });
    return !!deleted;
  }

  // --- Purchase Orders ---
  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.orderDate));
  }

  async getPurchaseOrder(id: number): Promise<(PurchaseOrder & { items: PurchaseOrderItem[], supplier: Supplier | null }) | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    if (!po) return undefined;
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, po.supplierId));
    return { ...po, items, supplier: supplier || null };
  }

  async createPurchaseOrder(po: InsertPurchaseOrder, items: Omit<InsertPurchaseOrderItem, "purchaseOrderId">[]): Promise<PurchaseOrder> {
    return await db.transaction(async (tx) => {
      const [newPO] = await tx.insert(purchaseOrders).values(po).returning();
      if (!newPO) throw new Error("Failed to create PO");

      if (items.length > 0) {
        const insertItems = items.map(item => ({ ...item, purchaseOrderId: newPO.id }));
        await tx.insert(purchaseOrderItems).values(insertItems);
      }

      await tx.insert(syncQueue).values({
        tableName: 'purchase_orders',
        operation: 'INSERT',
        recordId: String(newPO.id),
        payload: JSON.stringify(newPO),
      });
      return newPO;
    });
  }

  async updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder | undefined> {
    return await db.transaction(async (tx) => {
      const receiveDate = status === "Received" ? new Date() : null;
      const [po] = await tx.update(purchaseOrders)
        .set({ status, receivedDate: receiveDate, isSynced: false, updatedAt: new Date() })
        .where(eq(purchaseOrders.id, id))
        .returning();

      if (po && status === "Received") {
        // Auto-increment stock if Received
        const items = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
        for (const item of items) {
          const [prod] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (prod) {
            await tx.update(products).set({
              stock: prod.stock + item.quantity,
              isSynced: false,
              updatedAt: new Date()
            }).where(eq(products.id, prod.id));

            // we do NOT auto-queue the product update right away to simplify distributed queues, 
            // but in production it's better to queue the stock bumps. By setting isSynced to false, it might get caught.
          }
        }
      }

      if (po) {
        await tx.insert(syncQueue).values({
          tableName: 'purchase_orders',
          operation: 'UPDATE',
          recordId: String(po.id),
          payload: JSON.stringify(po),
        });
      }
      return po;
    });
  }

  // --- Stock Adjustments ---
  async getAllStockAdjustments(): Promise<(StockAdjustment & { product: Product | null })[]> {
    const records = await db.select().from(stockAdjustments).orderBy(desc(stockAdjustments.date));
    return Promise.all(records.map(async (row) => {
      const [prod] = await db.select().from(products).where(eq(products.id, row.productId));
      return { ...row, product: prod || null };
    }));
  }

  async createStockAdjustment(data: InsertStockAdjustment): Promise<StockAdjustment> {
    return await db.transaction(async (tx) => {
      const [adj] = await tx.insert(stockAdjustments).values(data).returning();
      if (!adj) throw new Error("Failed to create adj");

      const [prod] = await tx.select().from(products).where(eq(products.id, adj.productId));
      if (prod) {
        await tx.update(products).set({
          stock: prod.stock + adj.quantityAdjusted,
          isSynced: false,
          updatedAt: new Date()
        }).where(eq(products.id, prod.id));
      }

      await tx.insert(syncQueue).values({
        tableName: 'stock_adjustments',
        operation: 'INSERT',
        recordId: String(adj.id),
        payload: JSON.stringify(adj),
      });

      return adj;
    });
  }

  // --- Returns & Store Credits ---
  async getReturnsBySaleId(saleId: number): Promise<Return[]> {
    return await db.select().from(returns).where(eq(returns.saleId, saleId));
  }

  async getReturn(id: number): Promise<(Return & { items: ReturnItem[] }) | undefined> {
    const [ret] = await db.select().from(returns).where(eq(returns.id, id));
    if (!ret) return undefined;
    const items = await db.select().from(returnItems).where(eq(returnItems.returnId, id));
    return { ...ret, items };
  }

  async createReturn(insertReturn: InsertReturn, items: Omit<InsertReturnItem, "returnId">[]): Promise<Return> {
    return await db.transaction(async (tx) => {
      const [newReturn] = await tx.insert(returns).values(insertReturn).returning();
      if (!newReturn) throw new Error("Failed to create return");

      if (items.length > 0) {
        const insertItems = items.map(item => ({ ...item, returnId: newReturn.id }));
        await tx.insert(returnItems).values(insertItems);

        // Update Stock optionally for returned items
        for (const item of items) {
          const [prod] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (prod) {
            await tx.update(products).set({
              stock: prod.stock + item.quantity,
              isSynced: false,
              updatedAt: new Date()
            }).where(eq(products.id, prod.id));
          }
        }
      }

      const freshItems = await tx.select().from(returnItems).where(eq(returnItems.returnId, newReturn.id));
      await tx.insert(syncQueue).values({
        tableName: 'returns',
        operation: 'INSERT',
        recordId: String(newReturn.id),
        payload: JSON.stringify({ ...newReturn, items: freshItems }),
      });

      return newReturn;
    });
  }

  async createStoreCredit(insertCredit: InsertStoreCredit): Promise<StoreCredit> {
    const [credit] = await db.insert(storeCredits).values(insertCredit).returning();
    if (credit) {
      await this.pushToSyncQueue('store_credits', 'INSERT', String(credit.id), credit);
    }
    return credit;
  }

  async getAllParkedSales(): Promise<(ParkedSale & { items: ParkedSaleItem[] })[]> {
    const records = await db.select().from(parkedSales);
    const withItems = await Promise.all(records.map(async (sale) => {
      const items = await db.select().from(parkedSaleItems).where(eq(parkedSaleItems.parkedSaleId, sale.id));
      return { ...sale, items };
    }));
    return withItems;
  }

  async getParkedSale(id: number): Promise<(ParkedSale & { items: ParkedSaleItem[] }) | undefined> {
    const [sale] = await db.select().from(parkedSales).where(eq(parkedSales.id, id));
    if (!sale) return undefined;
    const items = await db.select().from(parkedSaleItems).where(eq(parkedSaleItems.parkedSaleId, id));
    return { ...sale, items };
  }

  async createParkedSale(sale: InsertParkedSale, items: Omit<InsertParkedSaleItem, "parkedSaleId">[]): Promise<ParkedSale> {
    const [createdSale] = await db.insert(parkedSales).values(sale).returning();
    const itemsToInsert = items.map(item => ({ ...item, parkedSaleId: createdSale.id }));
    if (itemsToInsert.length > 0) {
      await db.insert(parkedSaleItems).values(itemsToInsert);
    }
    await this.pushToSyncQueue('parked_sales', 'INSERT', createdSale.id, createdSale);
    return createdSale;
  }

  async deleteParkedSale(id: number): Promise<boolean> {
    const [deleted] = await db.delete(parkedSales).where(eq(parkedSales.id, id)).returning();
    if (deleted) {
      await this.pushToSyncQueue('parked_sales', 'DELETE', id, null);
    }
    return !!deleted;
  }

  async getAllPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions);
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [promo] = await db.select().from(promotions).where(eq(promotions.code, code));
    return promo;
  }

  async createPromotion(promo: InsertPromotion): Promise<Promotion> {
    const [created] = await db.insert(promotions).values(promo).returning();
    await this.pushToSyncQueue('promotions', 'INSERT', created.id, created);
    return created;
  }

  async updatePromotion(id: number, data: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const [updated] = await db.update(promotions).set(data).where(eq(promotions.id, id)).returning();
    if (updated) {
      await this.pushToSyncQueue('promotions', 'UPDATE', updated.id, updated);
    }
    return updated;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const [deleted] = await db.delete(promotions).where(eq(promotions.id, id)).returning();
    if (deleted) {
      await this.pushToSyncQueue('promotions', 'DELETE', id, null);
    }
    return !!deleted;
  }

  async getAllTierMultipliers(): Promise<TierMultiplier[]> {
    return await db.select().from(tierMultipliers);
  }

  async updateTierMultiplier(tierName: string, multiplier: number): Promise<TierMultiplier> {
    const existing = await db.select().from(tierMultipliers).where(eq(tierMultipliers.tierName, tierName));
    if (existing.length === 0) {
      const [newTier] = await db.insert(tierMultipliers).values({ tierName, multiplier }).returning();
      await this.pushToSyncQueue('tier_multipliers', 'INSERT', newTier.id, newTier);
      return newTier;
    }
    const [updated] = await db.update(tierMultipliers).set({ multiplier, isSynced: false, updatedAt: new Date() }).where(eq(tierMultipliers.tierName, tierName)).returning();
    await this.pushToSyncQueue('tier_multipliers', 'UPDATE', updated.id, updated);
    return updated;
  }

  async getLoyaltyLedger(customerId: number): Promise<LoyaltyLedger[]> {
    return await db.select().from(loyaltyLedger).where(eq(loyaltyLedger.customerId, customerId)).orderBy(desc(loyaltyLedger.createdAt));
  }

  async addLoyaltyPoints(customerId: number, pointsDelta: number, reason: string): Promise<LoyaltyLedger> {
    const [ledgerEntry] = await db.insert(loyaltyLedger).values({
      customerId,
      pointsDelta,
      reason
    }).returning();
    await this.pushToSyncQueue('loyalty_ledger', 'INSERT', ledgerEntry.id, ledgerEntry);

    const customer = await this.getCustomer(customerId);
    if (customer) {
      await this.updateCustomer(customerId, { loyaltyPoints: customer.loyaltyPoints + pointsDelta });
    }

    return ledgerEntry;
  }

  async getShifts(): Promise<Shift[]> {
    return await db.select().from(shifts).orderBy(desc(shifts.id));
  }

  async getActiveShift(cashierId: string): Promise<Shift | undefined> {
    const active = await db.select().from(shifts).where(and(eq(shifts.cashierId, cashierId), eq(shifts.status, 'Active'))).limit(1);
    return active[0];
  }

  async startShift(data: InsertShift): Promise<Shift> {
    const [inserted] = await db.insert(shifts).values(data).returning();
    await this.pushToSyncQueue('shifts', 'INSERT', inserted.id, inserted);
    return inserted;
  }

  async endShift(id: number, actualCash: number, expectedCash: number, discrepancy: number): Promise<Shift | undefined> {
    const [updated] = await db.update(shifts)
      .set({
        endTime: new Date().toISOString(),
        actualCash,
        expectedCash,
        discrepancy,
        status: 'Closed',
        updatedAt: new Date()
      })
      .where(eq(shifts.id, id))
      .returning();

    if (updated) {
      await this.pushToSyncQueue('shifts', 'UPDATE', id, updated);
    }
    return updated;
  }
}

export const storage = new DatabaseStorage();
