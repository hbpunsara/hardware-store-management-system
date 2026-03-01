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

// Products
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    price: real("price").notNull(),
    stock: integer("stock").notNull().default(0),
    supplier: text("supplier"),
    isSynced: boolean("is_synced").default(false).notNull(),
    updatedAt: text("updated_at").default(sql`now()`).notNull(),
});

// Sales (header)
export const sales = pgTable("sales", {
    id: serial("id").primaryKey(),
    subtotal: real("subtotal").notNull(),
    tax: real("tax").notNull().default(0),
    discount: real("discount").notNull().default(0),
    total: real("total").notNull(),
    paymentMethod: text("payment_method").notNull(),
    cashierId: uuid("cashier_id").references(() => users.id),
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
