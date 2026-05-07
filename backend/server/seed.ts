import "dotenv/config";
import { eq } from "drizzle-orm";
import { localDb as db } from "./db";
import { users, products, employees, storeSettings, notifications, promotions, loyaltyLedger, shifts, customers } from "../shared/schema";

async function seed() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    await db.insert(users).values([
      { username: "admin", password: "admin123", name: "Admin User", role: "admin" },
      { username: "cashier", password: "cashier123", name: "Priya Sharma", role: "cashier" },
      { username: "inventory", password: "inv123", name: "Robert Fernando", role: "inventory_manager" },
    ]);
    console.log("Seeded users: admin, cashier");
  } else {
    console.log("Users already exist, skipping");
  }

  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    await db.insert(products).values([
      { sku: "HAM-16", name: "Hammer 16oz", category: "Tools", price: 12.99, stock: 24, supplier: "ForgeCo" },
      { sku: "NAIL-2", name: 'Nails 2" (100pc)', category: "Hardware", price: 2.20, stock: 5, supplier: "SteelMart" },
      { sku: "BRSH-2", name: 'Paint Brush 2"', category: "Painting", price: 3.99, stock: 80, supplier: "ColorSync" },
      { sku: "DUCT-1", name: "Duct Tape", category: "Adhesives", price: 4.50, stock: 34, supplier: "Grip&Go" },
      { sku: "SCRW-PH", name: "Philips Screwdriver", category: "Tools", price: 6.50, stock: 45, supplier: "ForgeCo" },
      { sku: "TAPE-M", name: "Measuring Tape", category: "Tools", price: 7.25, stock: 30, supplier: "ForgeCo" },
      { sku: "KNIFE-U", name: "Utility Knife", category: "Tools", price: 5.75, stock: 25, supplier: "ForgeCo" },
    ]);
    console.log("Seeded 7 products");
  } else {
    console.log("Products already exist, skipping");
  }

  const existingEmployees = await db.select().from(employees);
  if (existingEmployees.length === 0) {
    await db.insert(employees).values([
      { name: "John Perera", role: "Cashier", department: "Sales", status: "Absent", avatar: "JP" },
      { name: "Mary Silva", role: "Cashier", department: "Sales", status: "Absent", avatar: "MS" },
      { name: "Robert Fernando", role: "Stock Manager", department: "Inventory", status: "Absent", avatar: "RF" },
    ]);
    console.log("Seeded employees");
  }

  const existingSettings = await db.select().from(storeSettings);
  if (existingSettings.length === 0) {
    await db.insert(storeSettings).values([
      { key: "store_name", value: "Hardware Pro Store" },
      { key: "store_address", value: "123 Main Street, Colombo" },
      { key: "store_phone", value: "+94 11 234 5678" },
      { key: "store_email", value: "info@hardwarepro.lk" },
      { key: "store_tax_id", value: "TAX-12345-LK" },
      { key: "store_currency", value: "LKR" },
    ]);
    console.log("Seeded store settings");
  }

  const existingNotifications = await db.select().from(notifications);
  if (existingNotifications.length === 0) {
    await db.insert(notifications).values([
      { title: "System Update", message: "Hardware Pro version 2.0 deployed successfully.", type: "success" },
      { title: "Low Stock Alert", message: "Hammer 16oz is running low on stock.", type: "warning" },
      { title: "New Promotion", message: "Summer Sale promotion is now active.", type: "info" }
    ]);
    console.log("Seeded notifications");
  }

  const existingPromotions = await db.select().from(promotions);
  if (existingPromotions.length === 0) {
    await db.insert(promotions).values([
      { code: "WELCOME10", type: "PERCENTAGE", value: 10, status: "Active" },
      { code: "BULK50", type: "FLAT", value: 50, minQty: 10, status: "Active" }
    ]);
    console.log("Seeded promotions");
  }

  const existingCustomers = await db.select().from(customers);
  if (existingCustomers.length === 0) {
    await db.insert(customers).values([
      { name: "John Doe", email: "john@example.com", phone: "0771234567", loyaltyPoints: 150, tier: "Retail" },
      { name: "BuildCo Constructors", email: "procurement@buildco.lk", phone: "0112345678", loyaltyPoints: 500, tier: "Contractor" }
    ]);
    console.log("Seeded customers");
  }

  const existingLoyalty = await db.select().from(loyaltyLedger);
  if (existingLoyalty.length === 0) {
    const custs = await db.select().from(customers);
    if (custs.length > 0) {
      await db.insert(loyaltyLedger).values([
        { customerId: custs[0].id, pointsDelta: 100, reason: "Welcome Bonus" },
        { customerId: custs[0].id, pointsDelta: 50, reason: "Earned from Sale #101" }
      ]);
      console.log("Seeded loyalty ledger");
    }
  }

  const existingShifts = await db.select().from(shifts);
  if (existingShifts.length === 0) {
    const cashiers = await db.select().from(users).where(eq(users.role, "cashier"));
    if (cashiers.length > 0) {
      await db.insert(shifts).values([
        { cashierId: cashiers[0].id, startTime: new Date().toISOString(), startingFloat: 5000, status: "Active" }
      ]);
      console.log("Seeded shifts");
    }
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
