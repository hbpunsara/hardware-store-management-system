import type { Express } from "express";
import { createServer, type Server } from "http";
import { productController } from "./controllers/product.controller";
import { salesController } from "./controllers/sales.controller";
import { authController } from "./controllers/auth.controller";
import { employeesController } from "./controllers/employees.controller";
import { transactionsController } from "./controllers/transactions.controller";
import { storeController } from "./controllers/store.controller";
import { usersController } from "./controllers/users.controller";
import { reportsController } from "./controllers/reports.controller";
import { payrollController } from "./controllers/payroll.controller";
import { systemController } from "./controllers/system.controller";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", authController.login);
  app.post("/api/auth/logout", authController.logout);
  app.get("/api/auth/me", authController.me);

  // Product routes
  app.get("/api/products", productController.getAll);
  app.get("/api/products/search", productController.search);
  app.get("/api/products/:id", productController.getById);
  app.post("/api/products", productController.create);
  app.put("/api/products/:id", productController.update);
  app.delete("/api/products/:id", productController.delete);

  // Sales routes
  app.get("/api/sales", salesController.getAll);
  app.get("/api/sales/today-summary", salesController.getTodaySummary);
  app.get("/api/sales/:id", salesController.getById);
  app.post("/api/sales", salesController.create);

  // Employees routes
  app.get("/api/employees", employeesController.getAll);
  app.post("/api/employees", employeesController.create);
  app.put("/api/employees/:id", employeesController.update);

  // Transactions (Finance) routes
  app.get("/api/transactions", transactionsController.getAll);
  app.post("/api/transactions", transactionsController.create);

  // Store settings routes
  app.get("/api/store-settings", storeController.getAll);
  app.put("/api/store-settings", storeController.update);

  // Users (Settings) routes
  app.get("/api/users", usersController.getAll);
  app.post("/api/users", usersController.create);

  // Payroll routes
  app.get("/api/payroll", payrollController.getAll);
  app.post("/api/payroll/calculate", payrollController.calculateAll);
  app.post("/api/payroll/process", payrollController.processAll);

  // Reports routes
  app.get("/api/reports/overview", reportsController.getOverview);
  app.get("/api/reports/forecasting", reportsController.getForecasting);
  app.get("/api/reports/basket-analysis", reportsController.getBasketAnalysis);
  app.get("/api/reports/insights", reportsController.getInsights);

  // System routes
  app.get("/api/system/status", systemController.getStatus);

  // ML Recommendations route
  app.post("/api/recommendations", async (req, res) => {
    try {
      const response = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        throw new Error(`ML Service responded with ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("ML Recommendation Error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations from ML service" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
