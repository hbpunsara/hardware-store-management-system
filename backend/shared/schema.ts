import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  id: text("id").primaryKey(), // using text since SQLite UUIDs are text
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Products
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  supplier: text("supplier"),
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
  total: real("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  cashierId: text("cashier_id").references(() => users.id),
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
