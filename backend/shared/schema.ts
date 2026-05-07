import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";

// Sync Queue for Offline
export const syncQueue = sqliteTable("sync_queue", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  tableName: text("table_name").notNull(),
  operation: text("operation").notNull(), // INSERT, UPDATE, DELETE
  recordId: text("record_id").notNull(),  // Assuming PKs can be cast to string
  payload: text("payload").notNull(), // JSON string
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Users (auth + staff)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()), // using text since SQLite UUIDs are text
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("cashier"),
  email: text("email"),
});

// Employees (attendance / staff list)
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  status: text("status").default("Absent"),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  hours: text("hours"),
  avatar: text("avatar"),
  // Sync metadata
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Finance transactions
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  method: text("method").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Store settings (key-value)
export const storeSettings = sqliteTable("store_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Pricing Tiers for Customers (e.g., Contractor, Wholesale)
export const tierMultipliers = sqliteTable("tier_multipliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tierName: text("tier_name").notNull().unique(), // e.g. "Contractor", "Wholesale"
  multiplier: real("multiplier").notNull().default(1.0), // e.g. 0.90 for 10% off
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Loyalty Ledger for Customers
export const loyaltyLedger = sqliteTable("loyalty_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  pointsDelta: integer("points_delta").notNull(),
  reason: text("reason").notNull(), // 'Earned from Sale #123', 'Redeemed'
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Suppliers
export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers);
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Products
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  costPrice: real("cost_price").default(0),
  stock: integer("stock").notNull().default(0),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  supplier: text("supplier"), // Legacy fallback
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const insertProductSchema = createInsertSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Sales (header)
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull().default(0),
  discount: real("discount").notNull().default(0),
  discountTotal: real("discount_total").notNull().default(0),
  total: real("total").notNull(),
  status: text("status").notNull().default("Completed"), // Completed, Voided, Refunded
  paymentMethod: text("payment_method").notNull(),
  cashierId: text("cashier_id").references(() => users.id),
  customerId: integer("customer_id").references(() => customers.id),
  emailedAt: text("emailed_at"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Sale items (line items)
export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;

// Payrolls
export const payrolls = sqliteTable("payrolls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // e.g. "January 2024"
  baseSalary: real("base_salary").notNull(),
  overtime: real("overtime").notNull().default(0),
  allowances: real("allowances").notNull().default(0),
  deductions: real("deductions").notNull().default(0),
  netSalary: real("net_salary").notNull(),
  daysWorked: integer("days_worked").notNull().default(0),
  status: text("status").notNull().default("Pending"), // Pending, Processed
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertPayrollSchema = createInsertSchema(payrolls);
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payrolls.$inferSelect;

// Customers
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  companyName: text("company_name"),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  accountBalance: real("account_balance").notNull().default(0),
  creditLimit: real("credit_limit").notNull().default(0),
  taxExempt: integer("tax_exempt", { mode: 'boolean' }).default(false).notNull(),
  tier: text("tier").notNull().default("Retail"), // Retail, Contractor, etc.
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertCustomerSchema = createInsertSchema(customers);
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Quotes
export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull(),
  validUntil: text("valid_until"),
  status: text("status").notNull().default("Pending"), // Pending, Approved, Converted, Expired
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertQuoteSchema = createInsertSchema(quotes);
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

// Quote items
export const quoteItems = sqliteTable("quote_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});
export const insertQuoteItemSchema = createInsertSchema(quoteItems);
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;

// Shifts
export const shifts = sqliteTable("shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cashierId: text("cashier_id").notNull().references(() => users.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  startingFloat: real("starting_float").notNull(),
  expectedCash: real("expected_cash"),
  actualCash: real("actual_cash"),
  discrepancy: real("discrepancy"),
  status: text("status").notNull().default("Active"), // Active, Closed
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertShiftSchema = createInsertSchema(shifts);
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// Purchase Orders
export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  total: real("total").notNull().default(0),
  status: text("status").notNull().default("Draft"), // Draft, Ordered, Received
  orderDate: text("order_date").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  receivedDate: text("received_date"),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// Purchase Order Items
export const purchaseOrderItems = sqliteTable("purchase_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  costPrice: real("cost_price").notNull(),
});
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems);
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;

// Stock Adjustments
export const stockAdjustments = sqliteTable("stock_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: text("user_id").references(() => users.id), // SQLite UUIDs are text
  quantityAdjusted: integer("quantity_adjusted").notNull(),
  reason: text("reason").notNull(),
  date: text("date").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertStockAdjustmentSchema = createInsertSchema(stockAdjustments);
export type InsertStockAdjustment = z.infer<typeof insertStockAdjustmentSchema>;
export type StockAdjustment = typeof stockAdjustments.$inferSelect;

// Returns
export const returns = sqliteTable("returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  customerId: integer("customer_id").references(() => customers.id),
  totalRefunded: real("total_refunded").notNull(),
  reason: text("reason"),
  date: text("date").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertReturnSchema = createInsertSchema(returns);
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Return = typeof returns.$inferSelect;

// Return Items
export const returnItems = sqliteTable("return_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  returnId: integer("return_id").notNull().references(() => returns.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  restockFee: real("restock_fee").notNull().default(0),
  refundAmount: real("refund_amount").notNull(),
});
export const insertReturnItemSchema = createInsertSchema(returnItems);
export type InsertReturnItem = z.infer<typeof insertReturnItemSchema>;
export type ReturnItem = typeof returnItems.$inferSelect;

// Store Credits
export const storeCredits = sqliteTable("store_credits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id),
  amount: real("amount").notNull(),
  originalAmount: real("original_amount").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("Active"), // Active, Used
  issuedDate: text("issued_date").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertStoreCreditSchema = createInsertSchema(storeCredits);
export type InsertStoreCredit = z.infer<typeof insertStoreCreditSchema>;
export type StoreCredit = typeof storeCredits.$inferSelect;

// Parked Sales
export const parkedSales = sqliteTable("parked_sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull().default(0),
  discount: real("discount").notNull().default(0),
  discountTotal: real("discount_total").notNull().default(0),
  total: real("total").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertParkedSaleSchema = createInsertSchema(parkedSales);
export type InsertParkedSale = z.infer<typeof insertParkedSaleSchema>;
export type ParkedSale = typeof parkedSales.$inferSelect;

// Parked Sale Items
export const parkedSaleItems = sqliteTable("parked_sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parkedSaleId: integer("parked_sale_id")
    .notNull()
    .references(() => parkedSales.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});
export const insertParkedSaleItemSchema = createInsertSchema(parkedSaleItems);
export type InsertParkedSaleItem = z.infer<typeof insertParkedSaleItemSchema>;
export type ParkedSaleItem = typeof parkedSaleItems.$inferSelect;

// Promotions
export const promotions = sqliteTable("promotions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. "SUMMER10"
  type: text("type").notNull(), // PERCENTAGE, FLAT, BOGO, VOLUME
  value: real("value").notNull(),
  minQty: integer("min_qty").default(0), // For bulk or BOGO
  startDate: text("start_date"),
  endDate: text("end_date"),
  applicableCategories: text("applicable_categories"), // Comma-separated or JSON array of names
  status: text("status").default("Active").notNull(), // Active, Expired, Disabled
  isSynced: integer("is_synced", { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
export const insertPromotionSchema = createInsertSchema(promotions);
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

// Market Basket Recommendations
export const marketBasketRecommendations = sqliteTable("market_basket_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetProductId: integer("target_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  recommendedProductId: integer("recommended_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  confidenceScore: real("confidence_score").notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const insertMarketBasketRecommendationSchema = createInsertSchema(marketBasketRecommendations);
export type InsertMarketBasketRecommendation = z.infer<typeof insertMarketBasketRecommendationSchema>;
export type MarketBasketRecommendation = typeof marketBasketRecommendations.$inferSelect;

// Seasonal Trends
export const seasonalTrends = sqliteTable("seasonal_trends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // e.g. "January" or "1"
  demandMultiplier: real("demand_multiplier").notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const insertSeasonalTrendSchema = createInsertSchema(seasonalTrends);
export type InsertSeasonalTrend = z.infer<typeof insertSeasonalTrendSchema>;
export type SeasonalTrend = typeof seasonalTrends.$inferSelect;

// Notifications
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // 'info', 'warning', 'success', 'error'
  isRead: integer("is_read", { mode: 'boolean' }).default(false).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

