import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  serial,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";

// Sync Queue for Offline
export const syncQueue = pgTable("sync_queue", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  operation: text("operation").notNull(), // INSERT, UPDATE, DELETE
  recordId: text("record_id").notNull(),
  payload: text("payload").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users (auth + staff)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("cashier"),
  email: text("email"),
  // Sync metadata
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employees (attendance / staff list)
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  status: text("status").default("Absent"),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  hours: text("hours"),
  avatar: text("avatar"),
  // Payroll details
  basicSalary: doublePrecision("basic_salary").default(0),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  nic: text("nic"),
  overtimeMultiplier: doublePrecision("overtime_multiplier").default(1.5),
  // Sync metadata
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employees);
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Attendance logs
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // YYYY-MM-DD
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  hoursWorked: doublePrecision("hours_worked").default(0),
  status: text("status").notNull().default("Present"), // Present, Absent, Leave
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Finance transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  amount: doublePrecision("amount").notNull(),
  method: text("method").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Store settings (key-value)
export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pricing Tiers for Customers (e.g., Contractor, Wholesale)
export const tierMultipliers = pgTable("tier_multipliers", {
  id: serial("id").primaryKey(),
  tierName: text("tier_name").notNull().unique(),
  multiplier: doublePrecision("multiplier").notNull().default(1.0),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Ledger for Customers
export const loyaltyLedger = pgTable("loyalty_ledger", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  pointsDelta: integer("points_delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers);
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: doublePrecision("price").notNull(),
  costPrice: doublePrecision("cost_price").default(0),
  stock: integer("stock").notNull().default(0),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  supplier: text("supplier"), // Legacy fallback
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Sales (header)
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax").notNull().default(0),
  discount: doublePrecision("discount").notNull().default(0),
  discountTotal: doublePrecision("discount_total").notNull().default(0),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull().default("Completed"),
  paymentMethod: text("payment_method").notNull(),
  cashierId: uuid("cashier_id").references(() => users.id),
  customerId: integer("customer_id").references(() => customers.id),
  emailedAt: timestamp("emailed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sale items (line items)
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

export const createSaleRequestSchema = insertSaleSchema.extend({
  items: z.array(z.object({
    productId: z.union([z.number(), z.string(), z.null()]).optional(),
    productName: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  paymentMethod: z.union([z.string(), z.array(z.any())]),
  cashierId: z.string().uuid().nullable().optional(),
  customerId: z.number().nullable().optional(),
});

export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;

// Payrolls
export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  baseSalary: doublePrecision("base_salary").notNull(),
  overtime: doublePrecision("overtime").notNull().default(0),
  allowances: doublePrecision("allowances").notNull().default(0),
  deductions: doublePrecision("deductions").notNull().default(0),
  netSalary: doublePrecision("net_salary").notNull(),
  daysWorked: integer("days_worked").notNull().default(0),
  status: text("status").notNull().default("Pending"),
  paidAt: text("paid_at"),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payroll components (detailed breakdown)
export const payrollComponents = pgTable("payroll_components", {
  id: serial("id").primaryKey(),
  payrollId: integer("payroll_id").notNull().references(() => payrolls.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  amount: doublePrecision("amount").notNull(),
});

export const insertPayrollSchema = createInsertSchema(payrolls);
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payrolls.$inferSelect;

export const insertAttendanceSchema = createInsertSchema(attendance);
export type Attendance = typeof attendance.$inferSelect;
export const insertPayrollComponentSchema = createInsertSchema(payrollComponents);
export type PayrollComponent = typeof payrollComponents.$inferSelect;

// Employee Salary Components (recurring settings)
export const employeeSalaryComponents = pgTable("employee_salary_components", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  amountType: text("amount_type").notNull().default("Fixed"),
  value: doublePrecision("value").notNull(),
});

export const insertEmployeeSalaryComponentSchema = createInsertSchema(employeeSalaryComponents);
export type EmployeeSalaryComponent = typeof employeeSalaryComponents.$inferSelect;

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  companyName: text("company_name"),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  accountBalance: doublePrecision("account_balance").notNull().default(0),
  creditLimit: doublePrecision("credit_limit").notNull().default(0),
  taxExempt: boolean("tax_exempt").default(false).notNull(),
  tier: text("tier").notNull().default("Retail"),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertCustomerSchema = createInsertSchema(customers);
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Quotes
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax").notNull().default(0),
  discount: doublePrecision("discount").notNull().default(0),
  total: doublePrecision("total").notNull(),
  validUntil: text("valid_until"),
  status: text("status").notNull().default("Pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertQuoteSchema = createInsertSchema(quotes);
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

// Quote items
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
});
export const insertQuoteItemSchema = createInsertSchema(quoteItems);
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;

// Shifts
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  cashierId: uuid("cashier_id").notNull().references(() => users.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  startingFloat: doublePrecision("starting_float").notNull(),
  expectedCash: doublePrecision("expected_cash"),
  actualCash: doublePrecision("actual_cash"),
  discrepancy: doublePrecision("discrepancy"),
  status: text("status").notNull().default("Active"),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertShiftSchema = createInsertSchema(shifts);
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  total: doublePrecision("total").notNull().default(0),
  status: text("status").notNull().default("Draft"),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  receivedDate: timestamp("received_date"),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// Purchase Order Items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  costPrice: doublePrecision("cost_price").notNull(),
});
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems);
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;

// Stock Adjustments
export const stockAdjustments = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: uuid("user_id").references(() => users.id),
  quantityAdjusted: integer("quantity_adjusted").notNull(),
  reason: text("reason").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertStockAdjustmentSchema = createInsertSchema(stockAdjustments);
export type InsertStockAdjustment = z.infer<typeof insertStockAdjustmentSchema>;
export type StockAdjustment = typeof stockAdjustments.$inferSelect;

// Returns
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  customerId: integer("customer_id").references(() => customers.id),
  totalRefunded: doublePrecision("total_refunded").notNull(),
  reason: text("reason"),
  date: timestamp("date").defaultNow().notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertReturnSchema = createInsertSchema(returns);
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Return = typeof returns.$inferSelect;

// Return Items
export const returnItems = pgTable("return_items", {
  id: serial("id").primaryKey(),
  returnId: integer("return_id").notNull().references(() => returns.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  restockFee: doublePrecision("restock_fee").notNull().default(0),
  refundAmount: doublePrecision("refund_amount").notNull(),
});
export const insertReturnItemSchema = createInsertSchema(returnItems);
export type InsertReturnItem = z.infer<typeof insertReturnItemSchema>;
export type ReturnItem = typeof returnItems.$inferSelect;

// Store Credits
export const storeCredits = pgTable("store_credits", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  amount: doublePrecision("amount").notNull(),
  originalAmount: doublePrecision("original_amount").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("Active"),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertStoreCreditSchema = createInsertSchema(storeCredits);
export type InsertStoreCredit = z.infer<typeof insertStoreCreditSchema>;
export type StoreCredit = typeof storeCredits.$inferSelect;

// Parked Sales
export const parkedSales = pgTable("parked_sales", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax").notNull().default(0),
  discount: doublePrecision("discount").notNull().default(0),
  discountTotal: doublePrecision("discount_total").notNull().default(0),
  total: doublePrecision("total").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertParkedSaleSchema = createInsertSchema(parkedSales);
export type InsertParkedSale = z.infer<typeof insertParkedSaleSchema>;
export type ParkedSale = typeof parkedSales.$inferSelect;

// Parked Sale Items
export const parkedSaleItems = pgTable("parked_sale_items", {
  id: serial("id").primaryKey(),
  parkedSaleId: integer("parked_sale_id")
    .notNull()
    .references(() => parkedSales.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
});
export const insertParkedSaleItemSchema = createInsertSchema(parkedSaleItems);
export type InsertParkedSaleItem = z.infer<typeof insertParkedSaleItemSchema>;
export type ParkedSaleItem = typeof parkedSaleItems.$inferSelect;

// Promotions
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: doublePrecision("value").notNull(),
  minQty: integer("min_qty").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  applicableCategories: text("applicable_categories"),
  status: text("status").default("Active").notNull(),
  isSynced: boolean("is_synced").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertPromotionSchema = createInsertSchema(promotions);
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

// Market Basket Recommendations
export const marketBasketRecommendations = pgTable("market_basket_recommendations", {
  id: serial("id").primaryKey(),
  targetProductId: integer("target_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  recommendedProductId: integer("recommended_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  confidenceScore: doublePrecision("confidence_score").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarketBasketRecommendationSchema = createInsertSchema(marketBasketRecommendations);
export type InsertMarketBasketRecommendation = z.infer<typeof insertMarketBasketRecommendationSchema>;
export type MarketBasketRecommendation = typeof marketBasketRecommendations.$inferSelect;

// Seasonal Trends
export const seasonalTrends = pgTable("seasonal_trends", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  demandMultiplier: doublePrecision("demand_multiplier").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSeasonalTrendSchema = createInsertSchema(seasonalTrends);
export type InsertSeasonalTrend = z.infer<typeof insertSeasonalTrendSchema>;
export type SeasonalTrend = typeof seasonalTrends.$inferSelect;

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
