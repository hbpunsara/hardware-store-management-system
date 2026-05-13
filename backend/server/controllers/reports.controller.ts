import { Request, Response } from "express";
import { db } from "../db";
import { sales, saleItems, products } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

/**
 * Helper: run a python command trying `python` first (Windows), then `python3` (Linux/Mac).
 */
async function runPython(scriptPath: string, args: string = ""): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`python "${scriptPath}" ${args}`);
    if (stderr) console.warn("Python stderr:", stderr);
    return stdout;
  } catch {
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" ${args}`);
    if (stderr) console.warn("Python3 stderr:", stderr);
    return stdout;
  }
}

/**
 * Helper: convert a Date or string createdAt to a JS Date for safe comparison.
 * Drizzle/PG returns Date objects, but some edge cases may return strings.
 */
function toDate(val: any): Date {
  if (val instanceof Date) return val;
  return new Date(val);
}

/**
 * Helper: get "YYYY-MM" from a Date object for month grouping.
 */
function getYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Helper: get "YYYY-MM-DD" from a Date object for day grouping.
 */
function getDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const reportsController = {
  getOverview: async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Previous month for comparison
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const allSales = await (db as any).select().from(sales);

      // Filter current month sales (non-voided)
      const salesRows = allSales.filter((s: any) => {
        const d = toDate(s.createdAt);
        return d >= startOfMonth && d <= endOfMonth && s.status !== "Voided";
      });

      // Filter previous month sales (non-voided)
      const prevMonthSales = allSales.filter((s: any) => {
        const d = toDate(s.createdAt);
        return d >= startOfPrevMonth && d <= endOfPrevMonth && s.status !== "Voided";
      });

      const totalRevenue = salesRows.reduce((sum: number, r: any) => sum + Number(r.total), 0);
      const totalTransactions = salesRows.length;
      const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Compute real month-over-month changes
      const prevRevenue = prevMonthSales.reduce((sum: number, r: any) => sum + Number(r.total), 0);
      const prevTransactions = prevMonthSales.length;
      const prevAvg = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;

      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const transactionChange = prevTransactions > 0 ? ((totalTransactions - prevTransactions) / prevTransactions) * 100 : 0;
      const avgChange = prevAvg > 0 ? ((avgOrderValue - prevAvg) / prevAvg) * 100 : 0;

      // Top products by revenue
      const allItems = await (db as any).select({
        productName: saleItems.productName,
        quantity: saleItems.quantity,
        price: saleItems.price,
        saleId: saleItems.saleId,
        costPrice: products.costPrice
      }).from(saleItems).leftJoin(products, eq(saleItems.productId, products.id));

      const saleIdSet = new Set(salesRows.map((s: any) => s.id));
      const items = allItems.filter((i: any) => saleIdSet.has(i.saleId));

      const productAgg: Record<string, { sales: number; revenue: number; cost: number }> = {};
      for (const i of items) {
        const name = i.productName;
        if (!productAgg[name]) productAgg[name] = { sales: 0, revenue: 0, cost: 0 };
        productAgg[name].sales += i.quantity;
        productAgg[name].revenue += i.quantity * Number(i.price);
        productAgg[name].cost += i.quantity * (Number(i.costPrice) || 0);
      }

      const topProducts = Object.entries(productAgg)
        .map(([name, data]) => {
          const marginPct = data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0;
          return { name, sales: data.sales, revenue: data.revenue, trend: marginPct > 0 ? `+${marginPct.toFixed(1)}%` : `${marginPct.toFixed(1)}%` };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Category breakdown
      const allItemsWithCategory = await (db as any).select({
        category: products.category,
        quantity: saleItems.quantity,
        price: saleItems.price,
        saleId: saleItems.saleId,
      }).from(saleItems).leftJoin(products, eq(saleItems.productId, products.id));

      const itemsWithCat = allItemsWithCategory.filter((i: any) => saleIdSet.has(i.saleId));

      const categoryAgg: Record<string, number> = {};
      let totalCat = 0;
      for (const i of itemsWithCat) {
        const cat = i.category ?? "Other";
        const rev = i.quantity * Number(i.price);
        categoryAgg[cat] = (categoryAgg[cat] ?? 0) + rev;
        totalCat += rev;
      }

      const colors = ["bg-[#E60012]", "bg-[#0AB5CD]", "bg-[#7AC143]", "bg-[#F5A623]"];
      const categoryData = Object.entries(categoryAgg).map(([name, amount], i) => ({
        name,
        percentage: totalCat > 0 ? Math.round((amount / totalCat) * 100) : 0,
        amount,
        color: colors[i % colors.length],
      }));

      res.json({
        monthlyRevenue: totalRevenue,
        totalTransactions,
        avgOrderValue,
        topProducts,
        categoryData,
        // Real computed month-over-month percentages
        revenueChange: Number(revenueChange.toFixed(1)),
        transactionChange: Number(transactionChange.toFixed(1)),
        avgChange: Number(avgChange.toFixed(1)),
      });
    } catch (error) {
      console.error("Reports overview error:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  },

  getWeeklyTrend: async (_req: Request, res: Response) => {
    try {
      const allSales = await (db as any).select().from(sales);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const now = new Date();
      const result: { day: string; revenue: number; heightPct: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const targetDate = getDateString(d);

        const daySales = allSales.filter((s: any) => {
          const saleDate = toDate(s.createdAt);
          return getDateString(saleDate) === targetDate && s.status !== "Voided";
        });

        const revenue = daySales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
        result.push({ day: days[d.getDay()], revenue, heightPct: 5 });
      }

      // Normalize to percentage heights (max = 90%)
      const maxRevenue = Math.max(...result.map((r) => r.revenue), 1);
      result.forEach((r: any) => {
        r.heightPct = Math.max(Math.round((r.revenue / maxRevenue) * 90), 5);
      });

      res.json(result);
    } catch (error) {
      console.error("Weekly trend error:", error);
      res.status(500).json({ message: "Failed to fetch weekly trend" });
    }
  },

  getForecasting: async (_req: Request, res: Response) => {
    try {
      const allSales = await (db as any).select().from(sales);
      const now = new Date();
      const data: { month: string; actual: number | null; predicted: number | null }[] = [];

      const scriptPath = path.join(process.cwd(), "ml_service", "seasonal_analysis.py");
      const cachePath = path.join(process.cwd(), "ml_service", "forecast.json");

      let stdout: string;
      try {
        stdout = await runPython(scriptPath);
      } catch (execErr) {
        console.warn("Python execution failed. Falling back to cached forecast.json");
        try {
          stdout = await fs.promises.readFile(cachePath, "utf-8");
        } catch (e) {
          stdout = "[]";
        }
      }

      // 1. Get last 6 months of Actuals
      for (let i = -5; i <= 0; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = d.toLocaleString("default", { month: "short" });
        const targetYM = getYearMonth(d);

        const monthSales = allSales.filter((s: any) => {
          const saleDate = toDate(s.createdAt);
          return getYearMonth(saleDate) === targetYM && s.status !== "Voided";
        });
        const total = monthSales.reduce((acc: number, s: any) => acc + Number(s.total), 0);
        data.push({ month: monthName, actual: total, predicted: null });
      }

      // 2. Append consecutive ML Forecasted values for the upcoming months
      let forecastArray: number[] = [];
      try {
        const parsed = JSON.parse(stdout.trim());
        forecastArray = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        forecastArray = [];
      }

      if (forecastArray.length > 0) {
        for (let j = 0; j < forecastArray.length; j++) {
          const nextMonthIndex = j + 1;
          const d = new Date(now.getFullYear(), now.getMonth() + nextMonthIndex, 1);
          const monthName = d.toLocaleString("default", { month: "short" });
          data.push({ month: monthName, actual: null, predicted: Math.floor(Number(forecastArray[j])) });
        }
      } else {
        // Fallback: simple growth projection based on actual data
        for (let i = 1; i <= 3; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const monthName = d.toLocaleString("default", { month: "short" });
          const actuals = data.filter((d) => d.actual !== null && d.actual > 0);
          const lastActual = actuals.at(-1)?.actual ?? 0;

          // Use average of available actuals if enough data, otherwise flat
          if (actuals.length >= 2) {
            const avg = actuals.reduce((s, a) => s + (a.actual ?? 0), 0) / actuals.length;
            data.push({ month: monthName, actual: null, predicted: Math.floor(avg) });
          } else {
            data.push({ month: monthName, actual: null, predicted: Math.floor(lastActual) });
          }
        }
      }
      res.json(data);
    } catch (error) {
      console.error("Failed to fetch forecasting", error);
      res.status(500).json({ message: "Failed to fetch forecasting" });
    }
  },

  getBasketAnalysis: async (_req: Request, res: Response) => {
    try {
      const scriptPath = path.join(process.cwd(), "ml_service", "market_basket.py");
      const rulesPath = path.join(process.cwd(), "ml_service", "rules.json");

      let stdout: string;
      try {
        stdout = await runPython(scriptPath);
      } catch (execErr) {
        console.warn("Python execution failed. Falling back to cached rules.json");
        try {
          stdout = await fs.promises.readFile(rulesPath, "utf-8");
        } catch {
          stdout = "[]";
        }
      }

      let basketAnalysis;
      try {
        basketAnalysis = JSON.parse(stdout.trim());
      } catch {
        basketAnalysis = [];
      }

      // Return whatever the ML/rules produced — no hardcoded fallback
      if (!basketAnalysis || !Array.isArray(basketAnalysis)) {
        return res.json([]);
      }

      res.json(basketAnalysis);
    } catch (error) {
      console.error("ML Basket Analysis error:", error);
      res.status(500).json({ message: "Failed to fetch basket analysis" });
    }
  },

  getInsights: async (_req: Request, res: Response) => {
    try {
      const allProducts = await (db as any).select().from(products);
      const lowStock = allProducts.filter((p: any) => p.stock < 10);
      const outOfStock = allProducts.filter((p: any) => p.stock <= 0);
      const allSales = await (db as any).select().from(sales);

      // All sale items for peak hour analysis
      const allItems = await (db as any).select({
        saleId: saleItems.saleId,
        quantity: saleItems.quantity,
      }).from(saleItems);

      const insights: { title: string; description: string; icon: string; color: string }[] = [];

      // --- 1. Peak Sales Hours (computed from actual data) ---
      const hourCounts: Record<number, number> = {};
      for (const s of allSales) {
        if (s.status === "Voided") continue;
        const d = toDate(s.createdAt);
        const hour = d.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      const hourEntries = Object.entries(hourCounts).map(([h, c]) => ({ hour: Number(h), count: c }));
      if (hourEntries.length > 0) {
        hourEntries.sort((a, b) => b.count - a.count);
        const peakHour = hourEntries[0].hour;
        const peakEnd = peakHour + 2;
        const totalSalesCount = allSales.filter((s: any) => s.status !== "Voided").length;
        const peakCount = hourEntries.slice(0, 2).reduce((s, h) => s + h.count, 0);
        const peakPct = totalSalesCount > 0 ? Math.round((peakCount / totalSalesCount) * 100) : 0;

        const formatHour = (h: number) => {
          if (h === 0) return "12 AM";
          if (h < 12) return `${h} AM`;
          if (h === 12) return "12 PM";
          return `${h - 12} PM`;
        };

        insights.push({
          title: "Peak Sales Hours",
          description: `${formatHour(peakHour)} – ${formatHour(peakEnd > 23 ? 23 : peakEnd)} accounts for ${peakPct}% of sales. Consider scheduling more cashiers during this window.`,
          icon: "Clock",
          color: "bg-[#E60012]",
        });
      } else {
        insights.push({
          title: "Peak Sales Hours",
          description: "Not enough sales data yet to determine peak hours. Make more sales to unlock this insight.",
          icon: "Clock",
          color: "bg-[#E60012]",
        });
      }

      // --- 2. Stock Alerts (from DB) ---
      if (outOfStock.length > 0) {
        insights.push({
          title: "Out of Stock",
          description: `${outOfStock.length} product(s) are out of stock: ${outOfStock.slice(0, 3).map((p: any) => p.name).join(", ")}${outOfStock.length > 3 ? "..." : ""}. Reorder immediately.`,
          icon: "Target",
          color: "bg-[#E60012]",
        });
      }
      
      if (lowStock.length > 0) {
        const lowOnly = lowStock.filter((p: any) => p.stock > 0);
        if (lowOnly.length > 0) {
          insights.push({
            title: "Low Stock Alert",
            description: `${lowOnly.length} product(s) running low — reorder ${lowOnly.slice(0, 2).map((p: any) => `${p.name} (${p.stock} left)`).join(", ")} soon.`,
            icon: "Target",
            color: "bg-[#F5A623]",
          });
        }
      } else {
        insights.push({
          title: "Stock Healthy",
          description: `All ${allProducts.length} products are well stocked. No immediate reorders needed.`,
          icon: "Target",
          color: "bg-[#0AB5CD]",
        });
      }

      // --- 3. Sales performance (from DB) ---
      const now = new Date();
      const thisMonthSales = allSales.filter((s: any) => {
        const d = toDate(s.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.status !== "Voided";
      });
      const thisMonthRevenue = thisMonthSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);

      const lastMonthSales = allSales.filter((s: any) => {
        const d = toDate(s.createdAt);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear() && s.status !== "Voided";
      });
      const lastMonthRevenue = lastMonthSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);

      if (lastMonthRevenue > 0) {
        const changePct = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
        const direction = changePct >= 0 ? "up" : "down";
        insights.push({
          title: "Monthly Performance",
          description: `Revenue is ${direction} ${Math.abs(changePct).toFixed(1)}% compared to last month (LKR ${thisMonthRevenue.toLocaleString()} vs LKR ${lastMonthRevenue.toLocaleString()}).`,
          icon: "TrendingUp",
          color: changePct >= 0 ? "bg-[#7AC143]" : "bg-[#E60012]",
        });
      } else {
        insights.push({
          title: "Total Sales",
          description: `${allSales.filter((s: any) => s.status !== "Voided").length} transaction(s) recorded with LKR ${thisMonthRevenue.toLocaleString()} this month.`,
          icon: "TrendingUp",
          color: "bg-[#7AC143]",
        });
      }

      // --- 4. Product catalog insight ---
      const totalProducts = allProducts.length;
      const productsWithNoSales = allProducts.filter((p: any) => {
        return !allItems.some((i: any) => i.saleId && allSales.some((s: any) => s.id === i.saleId));
      });

      if (totalProducts > 0) {
        insights.push({
          title: "Product Catalog",
          description: `${totalProducts} products in catalog across ${Array.from(new Set(allProducts.map((p: any) => p.category))).length} categories.`,
          icon: "ShoppingBag",
          color: "bg-[#9B59B6]",
        });
      }

      res.json(insights);
    } catch (error) {
      console.error("Insights error:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  },

  getProductForecasting: async (_req: Request, res: Response) => {
    try {
      // Query all sale items with their sale dates directly from PostgreSQL
      const allSales = await (db as any).select().from(sales);
      const allItems = await (db as any).select({
        productName: saleItems.productName,
        quantity: saleItems.quantity,
        saleId: saleItems.saleId,
      }).from(saleItems);

      // Build a map of saleId -> createdAt (Date) for non-voided sales
      const saleMap = new Map<number, Date>();
      for (const s of allSales) {
        if (s.status !== "Voided") {
          saleMap.set(s.id, toDate(s.createdAt));
        }
      }

      // Group by product + month
      const productMonthly: Record<string, Record<string, number>> = {};
      for (const item of allItems) {
        const saleDate = saleMap.get(item.saleId);
        if (!saleDate) continue; // skip voided or missing

        const name = item.productName;
        const ym = getYearMonth(saleDate);

        if (!productMonthly[name]) productMonthly[name] = {};
        productMonthly[name][ym] = (productMonthly[name][ym] || 0) + item.quantity;
      }

      const now = new Date();
      const productsResult: any[] = [];

      for (const [productName, monthData] of Object.entries(productMonthly)) {
        // Sort months chronologically
        const sortedMonths = Object.keys(monthData).sort();

        // Build history
        const history: { month: string; qty: number }[] = [];
        const qtyValues: number[] = [];

        for (const ym of sortedMonths) {
          const [y, m] = ym.split("-").map(Number);
          const d = new Date(y, m - 1, 1);
          const label = d.toLocaleString("default", { month: "short", year: "numeric" });
          const qty = monthData[ym];
          history.push({ month: label, qty });
          qtyValues.push(qty);
        }

        const totalSold = qtyValues.reduce((s, q) => s + q, 0);
        const avgMonthly = qtyValues.length > 0 ? Math.round((totalSold / qtyValues.length) * 10) / 10 : 0;

        // 3-month moving average forecast
        let forecastValues: number[];
        if (qtyValues.length === 0) {
          forecastValues = [0, 0, 0];
        } else if (qtyValues.length === 1) {
          forecastValues = [qtyValues[0], qtyValues[0], qtyValues[0]];
        } else if (qtyValues.length === 2) {
          const avg = Math.round((qtyValues[0] + qtyValues[1]) / 2);
          forecastValues = [avg, avg, avg];
        } else {
          const last3 = [...qtyValues.slice(-3)];
          forecastValues = [];
          for (let i = 0; i < 3; i++) {
            const nextVal = last3.reduce((s, v) => s + v, 0) / last3.length;
            forecastValues.push(Math.round(nextVal));
            last3.shift();
            last3.push(nextVal);
          }
        }

        // Generate forecast month labels
        const forecast: { month: string; qty: number }[] = [];
        for (let i = 0; i < forecastValues.length; i++) {
          const futureDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
          const label = futureDate.toLocaleString("default", { month: "short", year: "numeric" });
          forecast.push({ month: label, qty: forecastValues[i] });
        }

        // Determine trend direction
        let trend = "stable";
        if (qtyValues.length >= 2) {
          const recentAvg = (qtyValues[qtyValues.length - 1] + qtyValues[qtyValues.length - 2]) / 2;
          const olderAvg = qtyValues.slice(0, -1).reduce((s, v) => s + v, 0) / Math.max(qtyValues.length - 1, 1);
          if (recentAvg > olderAvg * 1.1) trend = "growing";
          else if (recentAvg < olderAvg * 0.9) trend = "declining";
        }

        // Growth percentage
        let growthPct = 0;
        if (qtyValues.length >= 2 && qtyValues[qtyValues.length - 2] > 0) {
          growthPct = Math.round(((qtyValues[qtyValues.length - 1] - qtyValues[qtyValues.length - 2]) / qtyValues[qtyValues.length - 2]) * 1000) / 10;
        }

        productsResult.push({
          name: productName,
          history,
          forecast,
          totalSold,
          avgMonthly,
          trend,
          growthPct,
        });
      }

      // Sort by totalSold descending
      productsResult.sort((a, b) => b.totalSold - a.totalSold);

      res.json({ products: productsResult });
    } catch (error) {
      console.error("Product forecasting error:", error);
      res.status(500).json({ message: "Failed to fetch product forecasting" });
    }
  },
};
