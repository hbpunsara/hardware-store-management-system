import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import {
  DollarSign, ShoppingCart, Package, AlertTriangle,
  ArrowUpRight, TrendingUp, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import salesService from "../services/salesService";
import productService from "../services/productService";
import reportsService from "../services/reportsService";

// ─── Skeleton primitives ──────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

// ─── Pie chart colour palette (override ugly CSS class strings from backend) ──
const PIE_COLORS = ["#E60012", "#0AB5CD", "#7AC143", "#F5A623", "#9B59B6", "#1ABC9C"];

// ─── Custom tooltip for BarChart ──────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      <p className="text-[#E60012] font-semibold">
        LKR {new Intl.NumberFormat("en-LK").format(payload[0].value)}
      </p>
    </div>
  );
};

// ─── Custom tooltip for PieChart ─────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-bold text-gray-800">{d.name}</p>
      <p style={{ color: d.payload.fill }} className="font-semibold">
        {d.payload.percentage}% · LKR {new Intl.NumberFormat("en-LK").format(d.value)}
      </p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Dashboard = () => {
  const [summary, setSummary] = useState({ totalSales: 0, totalTransactions: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-LK").format(amount ?? 0);

  const loadDashboard = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    try {
      const [summaryData, salesData, productsData, trendData, overviewData] =
        await Promise.all([
          salesService.getTodaySummary(),
          salesService.getAll(),
          productService.getAll(),
          reportsService.getWeeklyTrend(),
          reportsService.getOverview(),
        ]);

      setSummary(summaryData);
      setRecentSales([...salesData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      setLowStockItems(productsData.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 4));
      setWeeklyTrend(trendData);
      setCategoryData(overviewData.categoryData ?? []);
      setAvgOrderValue(overviewData.avgOrderValue ?? 0);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 60-second auto-refresh
  useEffect(() => {
    loadDashboard(true);
    const interval = setInterval(() => loadDashboard(false), 60_000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // ── Stat cards definition ──────────────────────────────────────────────────
  const stats = [
    {
      title: "Today's Revenue",
      value: `LKR ${formatCurrency(summary.totalSales)}`,
      icon: DollarSign,
      color: "bg-[#E60012]",
      shadow: "shadow-red-100",
    },
    {
      title: "Transactions",
      value: String(summary.totalTransactions),
      icon: ShoppingCart,
      color: "bg-[#0AB5CD]",
      shadow: "shadow-cyan-100",
    },
    {
      title: "Products Sold",
      value: String(
        recentSales.reduce(
          (s, r) => s + (r.items?.reduce((a, i) => a + i.quantity, 0) || 0),
          0
        )
      ),
      icon: Package,
      color: "bg-[#7AC143]",
      shadow: "shadow-green-100",
    },
    {
      title: "Avg. Order Value",
      value: `LKR ${formatCurrency(Math.round(avgOrderValue))}`,
      icon: TrendingUp,
      color: "bg-[#F5A623]",
      shadow: "shadow-amber-100",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar title="Dashboard" showSearch />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Last-refreshed indicator ─────────────────────────────────── */}
          {lastRefreshed && (
            <div className="flex items-center gap-2 text-xs text-gray-400 -mb-2">
              <RefreshCw className="w-3 h-3" />
              Last updated: {lastRefreshed.toLocaleTimeString()}
              <span className="ml-1 text-gray-300">· auto-refreshes every 60 s</span>
            </div>
          )}

          {/* ── Stat Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="nintendo-stat-card">
                    <Skeleton className="w-12 h-12 mb-4" />
                    <Skeleton className="h-7 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className={`nintendo-stat-card hover:shadow-xl transition-all duration-300 shadow-lg ${stat.shadow}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="nintendo-badge flex items-center gap-1 nintendo-badge-success text-xs">
                          <ArrowUpRight className="w-3 h-3" />
                          Live
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-gray-900 mb-1">
                        {stat.value}
                      </div>
                      <span className="text-sm text-gray-500 font-medium">
                        {stat.title}
                      </span>
                    </div>
                  );
                })}
          </div>

          {/* ── Weekly Revenue Bar Chart ─────────────────────────────────── */}
          <div className="nintendo-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl text-gray-900">
                  7-Day Revenue Trend
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Daily revenue for the past week
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#E60012] bg-red-50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-[#E60012] rounded-full animate-pulse" />
                Live Data
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={weeklyTrend}
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 13, fontWeight: 600, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                    width={48}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "#f9f9f9" }} />
                  <Bar
                    dataKey="revenue"
                    fill="#E60012"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={52}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Bottom row: Recent Sales + Right panel ───────────────────── */}
          <div className="grid grid-cols-3 gap-6">

            {/* Recent Sales table */}
            <div className="col-span-2 nintendo-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-xl text-gray-900">Recent Sales</h3>
                <a
                  href="/sales"
                  className="text-sm font-bold text-[#E60012] hover:underline"
                >
                  View All
                </a>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentSales.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No sales recorded yet.
                </div>
              ) : (
                <table className="nintendo-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="font-bold text-[#E60012]">
                          INV-{sale.id}
                        </td>
                        <td className="text-gray-600">
                          {sale.createdAt
                            ? new Date(sale.createdAt).toLocaleTimeString()
                            : "—"}
                        </td>
                        <td className="text-gray-600">
                          {sale.items?.length || 0} items
                        </td>
                        <td className="font-bold text-gray-900">
                          LKR {formatCurrency(sale.total)}
                        </td>
                        <td>
                          <span className="nintendo-badge nintendo-badge-success">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Right panel: Low Stock + Category Pie */}
            <div className="space-y-6">

              {/* Low Stock Alert */}
              <div className="nintendo-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-900">
                    Low Stock Alert
                  </h3>
                  <AlertTriangle className="w-5 h-5 text-[#E60012]" />
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : lowStockItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    All products well stocked ✓
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Threshold: 10
                          </p>
                        </div>
                        <span
                          className={`nintendo-badge ${
                            item.stock <= 5
                              ? "nintendo-badge-danger"
                              : "nintendo-badge-warning"
                          }`}
                        >
                          {item.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Revenue Pie */}
              <div className="nintendo-card p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900">
                    Revenue by Category
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This month's breakdown
                  </p>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Skeleton className="w-36 h-36 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : categoryData.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No category data yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="name"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span className="text-xs text-gray-600 font-medium">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
