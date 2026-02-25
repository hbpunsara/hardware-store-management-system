import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (auth + staff)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("cashier"),
  email: text("email"),
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
});

// Finance transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull(),
});

// Store settings (key-value)
export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
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
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  supplier: text("supplier"),
});

export const insertProductSchema = createInsertSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Sales (header)
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  cashierId: varchar("cashier_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
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
