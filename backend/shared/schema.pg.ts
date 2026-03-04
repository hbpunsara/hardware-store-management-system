// shared/schema.pg.ts  — Postgres-compatible schema for Supabase
import { sql } from "drizzle-orm";
import {
    pgTable,
    text,
    integer,
    real,
    boolean,
    serial,
    uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sync Queue
export const syncQueue = pgTable("sync_queue", {
    id: serial("id").primaryKey(),
    tableName: text("table_name").notNull(),
    operation: text("operation").notNull(),
    recordId: text("record_id").notNull(),
    payload: text("payload").notNull(),
    createdAt: text("created_at").default(sql`now()`).notNull(),
});

// Users
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    name: text("name"),
    role: text("role").default("cashier"),
    email: text("email"),
});

// Employees
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
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Finance Transactions
export const transactions = pgTable("transactions", {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    type: text("type").notNull(),
    amount: real("amount").notNull(),
    method: text("method").notNull(),
    customerId: integer("customer_id").references(() => customers.id),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Store Settings
export const storeSettings = pgTable("store_settings", {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value"),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Pricing Tiers for Customers (e.g., Contractor, Wholesale)
export const tierMultipliers = pgTable("tier_multipliers", {
    id: serial("id").primaryKey(),
    tierName: text("tier_name").notNull().unique(), // e.g. "Contractor", "Wholesale"
    multiplier: real("multiplier").notNull().default(1.0), // e.g. 0.90 for 10% off
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Loyalty Ledger for Customers
export const loyaltyLedger = pgTable("loyalty_ledger", {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").notNull().references(() => customers.id),
    pointsDelta: integer("points_delta").notNull(),
    reason: text("reason").notNull(),
    createdAt: text("created_at").default(sql`now()`).notNull(),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Suppliers (Vendors)
export const suppliers = pgTable("suppliers", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Products
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    price: real("price").notNull(),
    costPrice: real("cost_price").default(0),
    stock: integer("stock").notNull().default(0),
    supplierId: integer("supplier_id").references(() => suppliers.id),
    supplier: text("supplier"), // Legacy text field
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Sales (header)
export const sales = pgTable("sales", {
    id: serial("id").primaryKey(),
    subtotal: real("subtotal").notNull(),
    tax: real("tax").notNull().default(0),
    discount: real("discount").notNull().default(0),
    discountTotal: real("discount_total").notNull().default(0),
    total: real("total").notNull(),
    status: text("status").notNull().default("Completed"), // Completed, Voided, Refunded
    paymentMethod: text("payment_method").notNull(),
    cashierId: uuid("cashier_id").references(() => users.id),
    customerId: integer("customer_id").references(() => customers.id),
    emailedAt: text("emailed_at"),
    createdAt: text("created_at").default(sql`now()`).notNull(),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Sale items
export const saleItems = pgTable("sale_items", {
    id: serial("id").primaryKey(),
    saleId: integer("sale_id")
        .notNull()
        .references(() => sales.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    price: real("price").notNull(),
});

// Payrolls
export const payrolls = pgTable("payrolls", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
        .notNull()
        .references(() => employees.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    baseSalary: real("base_salary").notNull(),
    overtime: real("overtime").notNull().default(0),
    allowances: real("allowances").notNull().default(0),
    deductions: real("deductions").notNull().default(0),
    netSalary: real("net_salary").notNull(),
    daysWorked: integer("days_worked").notNull().default(0),
    status: text("status").notNull().default("Pending"),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Customers
export const customers = pgTable("customers", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    companyName: text("company_name"),
    address: text("address"),
    loyaltyPoints: integer("loyalty_points").notNull().default(0),
    accountBalance: real("account_balance").notNull().default(0),
    creditLimit: real("credit_limit").notNull().default(0),
    taxExempt: boolean("tax_exempt").notNull().default(false),
    tier: text("tier").notNull().default("Retail"),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Quotes
export const quotes = pgTable("quotes", {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id),
    subtotal: real("subtotal").notNull(),
    tax: real("tax").notNull().default(0),
    discount: real("discount").notNull().default(0),
    total: real("total").notNull(),
    status: text("status").notNull().default("Pending"), // Pending, Approved, Converted, Expired
    validUntil: text("valid_until"),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Quote Items
export const quoteItems = pgTable("quote_items", {
    id: serial("id").primaryKey(),
    quoteId: integer("quote_id")
        .notNull()
        .references(() => quotes.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    price: real("price").notNull(),
});

// Shifts
export const shifts = pgTable("shifts", {
    id: serial("id").primaryKey(),
    cashierId: uuid("cashier_id").notNull().references(() => users.id),
    startTime: text("start_time").notNull(),
    endTime: text("end_time"),
    startingFloat: real("starting_float").notNull(),
    expectedCash: real("expected_cash"),
    actualCash: real("actual_cash"),
    discrepancy: real("discrepancy"),
    status: text("status").notNull().default("Active"), // Active, Closed
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});
export const insertShiftSchema = createInsertSchema(shifts);
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// Purchase Orders (Replenishing stock from Suppliers)
export const purchaseOrders = pgTable("purchase_orders", {
    id: serial("id").primaryKey(),
    supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
    total: real("total").notNull().default(0),
    status: text("status").notNull().default("Draft"), // Draft, Ordered, Received
    orderDate: text("order_date").default(sql`now()`).notNull(),
    receivedDate: text("received_date"),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Purchase Order Items
export const purchaseOrderItems = pgTable("purchase_order_items", {
    id: serial("id").primaryKey(),
    purchaseOrderId: integer("purchase_order_id")
        .notNull()
        .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    costPrice: real("cost_price").notNull(),
});

// Stock Adjustments (Shrinkage, Damage, Cycle Counts)
export const stockAdjustments = pgTable("stock_adjustments", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id),
    userId: uuid("user_id").references(() => users.id),
    quantityAdjusted: integer("quantity_adjusted").notNull(), // Negative for shrink/damage, Positive for found stock
    reason: text("reason").notNull(), // 'Shrinkage', 'Damage', 'Cycle Count', 'Correction'
    date: text("date").default(sql`now()`).notNull(),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Returns
export const returns = pgTable("returns", {
    id: serial("id").primaryKey(),
    saleId: integer("sale_id").notNull().references(() => sales.id),
    customerId: integer("customer_id").references(() => customers.id),
    totalRefunded: real("total_refunded").notNull(),
    reason: text("reason"),
    date: text("date").default(sql`now()`).notNull(),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Return Items
export const returnItems = pgTable("return_items", {
    id: serial("id").primaryKey(),
    returnId: integer("return_id").notNull().references(() => returns.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    restockFee: real("restock_fee").notNull().default(0),
    refundAmount: real("refund_amount").notNull(),
});

// Store Credits
export const storeCredits = pgTable("store_credits", {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id),
    amount: real("amount").notNull(),
    originalAmount: real("original_amount").notNull(),
    code: text("code").notNull().unique(),
    status: text("status").notNull().default("Active"), // Active, Used
    issuedDate: text("issued_date").default(sql`now()`).notNull(),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Parked Sales
export const parkedSales = pgTable("parked_sales", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // "John Doe - Layaway"
    subtotal: real("subtotal").notNull(),
    tax: real("tax").notNull().default(0),
    discount: real("discount").notNull().default(0),
    discountTotal: real("discount_total").notNull().default(0),
    total: real("total").notNull(),
    customerId: integer("customer_id").references(() => customers.id),
    createdAt: text("created_at").default(sql`now()`).notNull(),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Parked Sale Items
export const parkedSaleItems = pgTable("parked_sale_items", {
    id: serial("id").primaryKey(),
    parkedSaleId: integer("parked_sale_id")
        .notNull()
        .references(() => parkedSales.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    price: real("price").notNull(),
});

// Promotions
export const promotions = pgTable("promotions", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(), // e.g. "SUMMER10"
    type: text("type").notNull(), // PERCENTAGE, FLAT, BOGO, VOLUME
    value: real("value").notNull(),
    minQty: integer("min_qty").default(0), // For bulk or BOGO
    startDate: text("start_date"),
    endDate: text("end_date"),
    applicableCategories: text("applicable_categories"), // Comma-separated or JSON array
    status: text("status").default("Active").notNull(), // Active, Expired, Disabled
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});
