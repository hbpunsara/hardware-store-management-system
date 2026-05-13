import type { Express } from "express";
import { createServer, type Server } from "http";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

import { productController } from "./controllers/product.controller";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, "logo-" + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
import { salesController } from "./controllers/sales.controller";
import { authController } from "./controllers/auth.controller";
import { employeesController } from "./controllers/employees.controller";
import { transactionsController } from "./controllers/transactions.controller";
import { storeController } from "./controllers/store.controller";
import { usersController } from "./controllers/users.controller";
import { reportsController } from "./controllers/reports.controller";
import { payrollController } from "./controllers/payroll.controller";
import { systemController } from "./controllers/system.controller";
import { customersController } from "./controllers/customers.controller";
import { quotesController } from "./controllers/quotes.controller";
import { suppliersController } from "./controllers/suppliers.controller";
import { purchaseOrdersController } from "./controllers/purchaseOrders.controller";
import { inventoryController } from "./controllers/inventory.controller";
import { returnsController } from "./controllers/returns.controller";
import { parkedSalesController } from "./controllers/parkedSales.controller";
import { promotionsController } from "./controllers/promotions.controller";
import { pricingTiersController } from "./controllers/pricingTiers.controller";
import { loyaltyController } from "./controllers/loyalty.controller";
import { shiftsController } from "./controllers/shifts.controller";
import { printerController } from "./controllers/printer.controller";
import { notificationsController } from "./controllers/notifications.controller";
import { validateSchema } from "./middleware/validate";
import { 
  insertProductSchema, 
  insertSaleSchema, 
  createSaleRequestSchema,
  insertEmployeeSchema 
} from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", authController.login);
  app.post("/api/auth/logout", authController.logout);
  app.post("/api/auth/force-logout", authController.forceLogout);
  app.get("/api/auth/me", authController.me);

  // Product routes
  app.get("/api/products", productController.getAll);
  app.get("/api/products/search", productController.search);
  app.get("/api/products/:id", productController.getById);
  app.post("/api/products/bulk", productController.createBulk);
  app.post("/api/products", validateSchema(insertProductSchema), productController.create);
  app.put("/api/products/:id", validateSchema(insertProductSchema.partial()), productController.update);
  app.delete("/api/products/:id", productController.delete);

  // Parked Sales
  app.get("/api/sales/parked", parkedSalesController.getAll);
  app.get("/api/sales/parked/:id", parkedSalesController.getById);
  app.post("/api/sales/parked", parkedSalesController.create);
  app.delete("/api/sales/parked/:id", parkedSalesController.delete);

  // Sales routes
  app.get("/api/sales", salesController.getAll);
  app.get("/api/sales/today-summary", salesController.getTodaySummary);
  app.get("/api/sales/:id", salesController.getById);
  app.post("/api/sales", validateSchema(createSaleRequestSchema), salesController.create);
  app.post("/api/sales/:id/void", salesController.voidSale);
  app.post("/api/sales/:id/email", salesController.emailInvoice);

  // Hardware integration
  app.post("/api/print", printerController.printReceipt);

  // Employees routes
  app.get("/api/employees", employeesController.getAll);
  app.post("/api/employees", validateSchema(insertEmployeeSchema), employeesController.create);
  app.put("/api/employees/:id", validateSchema(insertEmployeeSchema.partial()), employeesController.update);
  app.delete("/api/employees/:id", employeesController.delete);

  // Transactions (Finance) routes
  app.get("/api/transactions", transactionsController.getAll);
  app.post("/api/transactions", transactionsController.create);

  // Shifts routes
  app.get("/api/shifts", shiftsController.getAll);
  app.get("/api/shifts/active", shiftsController.getActive);
  app.post("/api/shifts/start", shiftsController.start);
  app.post("/api/shifts/end", shiftsController.end);

  // Store settings routes
  app.get("/api/store-settings", storeController.getAll);
  app.put("/api/store-settings", storeController.update);

  // Pricing Tiers routes
  app.get("/api/pricing-tiers", pricingTiersController.getAll);
  app.put("/api/pricing-tiers", pricingTiersController.update);

  // Users (Settings) routes
  app.get("/api/users", usersController.getAll);
  app.post("/api/users", usersController.create);
  app.patch("/api/users/:id", usersController.update);

  // Payroll routes
  app.get("/api/payroll", payrollController.getAll);
  app.get("/api/payroll/all", payrollController.getAll);
  app.post("/api/payroll/calculate", payrollController.calculateAll);
  app.post("/api/payroll/process", payrollController.processAll);
  app.post("/api/payroll/delete-month", payrollController.deleteMonth);
  app.put("/api/payroll/:id", payrollController.update);
  app.get("/api/payroll/:id/payslip-pdf", payrollController.getPayslip);

  // Employee Salary Config routes
  app.get("/api/employees/:employeeId/salary-config", payrollController.getSalaryConfig);
  app.put("/api/employees/:employeeId/salary-info", payrollController.updateBasicSalary);
  app.post("/api/employees/:employeeId/salary-components", payrollController.addSalaryComponent);
  app.put("/api/salary-components/:compId", payrollController.updateSalaryComponent);
  app.delete("/api/salary-components/:compId", payrollController.deleteSalaryComponent);

  // Customers routes
  app.get("/api/customers", customersController.getAll);
  app.get("/api/customers/:id", customersController.getById);
  app.post("/api/customers", customersController.create);
  app.put("/api/customers/:id", customersController.update);
  app.delete("/api/customers/:id", customersController.delete);
  app.post("/api/customers/:id/pay", customersController.payAccount);
  app.get("/api/customers/:id/statement-pdf", customersController.generateStatementPdf);

  // Loyalty routes
  app.post("/api/loyalty/redeem", loyaltyController.redeem);
  app.get("/api/customers/:customerId/loyalty", loyaltyController.getLedger);

  // Quotes routes
  app.get("/api/quotes", quotesController.getAll);
  app.get("/api/quotes/:id", quotesController.getById);
  app.post("/api/quotes", quotesController.create);
  app.put("/api/quotes/:id/status", quotesController.updateStatus);
  app.get("/api/quotes/:id/pdf", quotesController.generatePdf);

  // Suppliers routes
  app.get("/api/suppliers", suppliersController.getAll);
  app.get("/api/suppliers/:id", suppliersController.getById);
  app.post("/api/suppliers", suppliersController.create);
  app.put("/api/suppliers/:id", suppliersController.update);
  app.delete("/api/suppliers/:id", suppliersController.delete);

  // Purchase Orders routes
  app.get("/api/purchase-orders", purchaseOrdersController.getAll);
  app.get("/api/purchase-orders/:id", purchaseOrdersController.getById);
  app.post("/api/purchase-orders", purchaseOrdersController.create);
  app.put("/api/purchase-orders/:id/status", purchaseOrdersController.updateStatus);

  // Inventory / Stock Adjustments routes
  app.get("/api/inventory/adjustments", inventoryController.getAllAdjustments);
  app.post("/api/inventory/adjustments", inventoryController.createAdjustment);

  // Returns
  app.get("/api/returns/sale/:saleId", returnsController.getBySaleId);
  app.get("/api/returns/:id", returnsController.getById);
  app.post("/api/returns", returnsController.createReturn);

  // Printer routes
  app.post("/api/printer/receipt", printerController.printReceipt);

  // Promotions
  app.get("/api/promotions", promotionsController.getAll);
  app.get("/api/promotions/active", promotionsController.getActive);
  app.get("/api/promotions/code/:code", promotionsController.getByCode);
  app.post("/api/promotions", promotionsController.create);
  app.put("/api/promotions/:id", promotionsController.update);
  app.delete("/api/promotions/:id", promotionsController.delete);

  // Reports routes
  app.get("/api/reports/overview", reportsController.getOverview);
  app.get("/api/reports/weekly-trend", reportsController.getWeeklyTrend);
  app.get("/api/reports/forecasting", reportsController.getForecasting);
  app.get("/api/reports/product-forecasting", reportsController.getProductForecasting);
  app.get("/api/reports/basket-analysis", reportsController.getBasketAnalysis);
  app.get("/api/reports/insights", reportsController.getInsights);


  // System routes
  app.get("/api/system/status", systemController.getStatus);
  app.post("/api/system/sync", systemController.sync);
  app.get("/api/system/backups", systemController.getBackups);
  app.post("/api/system/backup", systemController.createBackup);
  app.post("/api/system/upload-logo", upload.single("logo"), systemController.uploadLogo);

  // Notifications routes
  app.get("/api/notifications", notificationsController.getAll);
  app.patch("/api/notifications/:id/read", notificationsController.markRead);
  app.delete("/api/notifications", notificationsController.clearAll);

  // ML Train endpoint
  app.post("/api/ml/train", async (req, res) => {
    try {
      const marketBasketPath = path.join(process.cwd(), "ml_service", "market_basket.py");
      const seasonalAnalysisPath = path.join(process.cwd(), "ml_service", "seasonal_analysis.py");
      
      // Use python or python3 based on environment
      await execAsync(`python "${marketBasketPath}" train`).catch(() => execAsync(`python3 "${marketBasketPath}" train`));
      await execAsync(`python "${seasonalAnalysisPath}" train`).catch(() => execAsync(`python3 "${seasonalAnalysisPath}" train`));
      
      res.json({ success: true, message: "Training complete" });
    } catch (error) {
      console.error("ML Train Error:", error);
      res.status(500).json({ error: "Failed to train ML models" });
    }
  });

  // ML Recommendations route — uses RL agent (epsilon-greedy Q-table) on top of basket rules
  app.post("/api/recommendations", async (req, res) => {
    try {
      const items = req.body.items || [];
      if (items.length === 0) {
        return res.json({ recommendations: [] });
      }

      const rlScriptPath = path.join(process.cwd(), "ml_service", "rl_recommender.py");
      const cartArg = items.join(",");

      let recommendations: string[] = [];

      try {
        // Try RL agent first (uses Q-table + market basket candidates)
        const { stdout } = await execAsync(`python3 "${rlScriptPath}" recommend "${cartArg}"`);
        const parsed = JSON.parse(stdout.trim());
        recommendations = parsed.recommendations || [];
      } catch (rlErr) {
        // Fallback: static rules.json lookup
        console.warn("RL agent unavailable, falling back to static rules:", (rlErr as any).message);
        const rulesPath = path.join(process.cwd(), "ml_service", "rules.json");
        try {
          const fileContent = await fs.promises.readFile(rulesPath, "utf-8");
          const rules = JSON.parse(fileContent);
          const recs = new Set<string>();
          const cartLower = items.map((i: string) => i.toLowerCase());
          for (const rule of rules) {
            const products = rule.products || [];
            if (products.some((p: string) => cartLower.includes(p.toLowerCase()))) {
              for (const product of products) {
                if (!cartLower.includes(product.toLowerCase())) recs.add(product);
              }
            }
          }
          recommendations = Array.from(recs).slice(0, 3);
        } catch {
          recommendations = [];
        }
      }

      res.json({ recommendations });
    } catch (error) {
      console.error("ML Recommendation Error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations from ML service" });
    }
  });

  // RL Feedback endpoint — called when user accepts or ignores a recommendation
  // reward: 1 = product added to cart, 0 = ignored/dismissed
  app.post("/api/recommendations/feedback", async (req, res) => {
    try {
      const { product, reward } = req.body;
      if (!product || reward === undefined) {
        return res.status(400).json({ error: "product and reward are required" });
      }

      const rlScriptPath = path.join(process.cwd(), "ml_service", "rl_recommender.py");
      // Map boolean/number reward: positive interactions = +1, negative = -0.1
      const rlReward = reward === 1 || reward === true ? 1 : -0.1;

      try {
        const { stdout } = await execAsync(
          `python3 "${rlScriptPath}" feedback "${product.replace(/"/g, '\\"')}" ${rlReward}`
        );
        const result = JSON.parse(stdout.trim());
        res.json({ success: true, ...result });
      } catch (err) {
        console.warn("RL feedback update failed:", (err as any).message);
        // Non-critical — don't fail the request
        res.json({ success: false, message: "RL update skipped (python unavailable)" });
      }
    } catch (error) {
      console.error("RL Feedback Error:", error);
      res.status(500).json({ error: "Failed to process feedback" });
    }
  });

  // RL Q-Table inspection endpoint (admin/debug use)
  app.get("/api/recommendations/qtable", async (req, res) => {
    try {
      const rlScriptPath = path.join(process.cwd(), "ml_service", "rl_recommender.py");
      const { stdout } = await execAsync(`python3 "${rlScriptPath}" qtable`);
      res.json(JSON.parse(stdout.trim()));
    } catch {
      res.json({});
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

