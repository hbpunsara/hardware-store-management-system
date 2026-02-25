import { Request, Response } from "express";
import { db } from "../db";
import { sales, saleItems, products } from "../../shared/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export const reportsController = {
  getOverview: async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const salesRows = await db
        .select()
        .from(sales)
        .where(and(gte(sales.createdAt, startOfMonth), lt(sales.createdAt, endOfMonth)));

      const totalRevenue = salesRows.reduce((sum, r) => sum + Number(r.total), 0);
      const totalTransactions = salesRows.length;
      const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Top products by quantity sold (from sale_items)
      const items = await db
        .select({
          productName: saleItems.productName,
          quantity: saleItems.quantity,
          price: saleItems.price,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(gte(sales.createdAt, startOfMonth), lt(sales.createdAt, endOfMonth)));

      const productAgg: Record<string, { sales: number; revenue: number }> = {};
      for (const i of items) {
        const name = i.productName;
        if (!productAgg[name]) productAgg[name] = { sales: 0, revenue: 0 };
        productAgg[name].sales += i.quantity;
        productAgg[name].revenue += i.quantity * Number(i.price);
      }

      const topProducts = Object.entries(productAgg)
        .map(([name, data]) => ({ name, sales: data.sales, revenue: data.revenue, trend: "+0%" }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Category breakdown - join with products
      const itemsWithCategory = await db
        .select({
          category: products.category,
          quantity: saleItems.quantity,
          price: saleItems.price,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(and(gte(sales.createdAt, startOfMonth), lt(sales.createdAt, endOfMonth)));

      const categoryAgg: Record<string, number> = {};
      let totalCat = 0;
      for (const i of itemsWithCategory) {
        const cat = i.category ?? "Other";
        const rev = i.quantity * Number(i.price);
        categoryAgg[cat] = (categoryAgg[cat] ?? 0) + rev;
        totalCat += rev;
      }

      const categoryData = Object.entries(categoryAgg).map(([name, amount]) => ({
        name,
        percentage: totalCat > 0 ? Math.round((amount / totalCat) * 100) : 0,
        amount,
      }));

      const colors = ["bg-[#E60012]", "bg-[#0AB5CD]", "bg-[#7AC143]", "bg-[#F5A623]"];
      categoryData.forEach((c, i) => {
        (c as Record<string, unknown>).color = colors[i % colors.length];
      });

      res.json({
        monthlyRevenue: totalRevenue,
        totalTransactions,
        avgOrderValue,
        topProducts,
        categoryData,
      });
    } catch (error) {
      console.error("Reports error:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  },
};
