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

  // Parked Sales
  app.get("/api/sales/parked", parkedSalesController.getAll);
  app.get("/api/sales/parked/:id", parkedSalesController.getById);
  app.post("/api/sales/parked", parkedSalesController.create);
  app.delete("/api/sales/parked/:id", parkedSalesController.delete);

  // Sales routes
  app.get("/api/sales", salesController.getAll);
  app.get("/api/sales/today-summary", salesController.getTodaySummary);
  app.get("/api/sales/:id", salesController.getById);
  app.post("/api/sales", salesController.create);
  app.post("/api/sales/:id/void", salesController.voidSale);
  app.post("/api/sales/:id/email", salesController.emailInvoice);

  // Hardware integration
  app.post("/api/print", printerController.printReceipt);

  // Employees routes
  app.get("/api/employees", employeesController.getAll);
  app.post("/api/employees", employeesController.create);
  app.put("/api/employees/:id", employeesController.update);

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
  app.patch("/api/users/:id", usersController.updateStatus);

  // Payroll routes
  app.get("/api/payroll", payrollController.getAll);
  app.post("/api/payroll/calculate", payrollController.calculateAll);
  app.post("/api/payroll/process", payrollController.processAll);

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
