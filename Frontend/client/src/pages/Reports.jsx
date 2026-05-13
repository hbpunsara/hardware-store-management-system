import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { useToast } from "../components/Toast";
import {
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Brain,
  Zap,
  Target,
  ShoppingBag,
  ArrowRight,
  Lightbulb,
  Clock,
  Printer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
  PieChart, Pie, Cell
} from "recharts";

const PIE_COLORS = ["#E60012", "#0AB5CD", "#7AC143", "#F5A623", "#9B59B6", "#1ABC9C"];

const PRINT_STYLES = `@media print {
  .no-print { display: none !important; }
  body { background: white; }
  main { margin: 0 !important; }
}`;

const ChartTooltip = ({ active, payload, label, isCurrency = true }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: "8px 14px", fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: "#374151", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {isCurrency ? `LKR ${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};
import { reportsService } from "../services/reportsService";

const ICON_MAP = {
  Clock,
  Target,
  TrendingUp,
  Brain,
  Zap,
  ShoppingBag,
  Lightbulb
};



export const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [trendPeriod, setTrendPeriod] = useState("week");
  const [overview, setOverview] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [basketAnalysis, setBasketAnalysis] = useState([]);
  const [insights, setInsights] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [productForecastData, setProductForecastData] = useState({ products: [] });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsService.getOverview().catch(() => null),
      reportsService.getForecasting().catch(() => []),
      reportsService.getBasketAnalysis().catch(() => []),
      reportsService.getInsights().catch(() => []),
      reportsService.getWeeklyTrend().catch(() => []),
      reportsService.getProductForecasting().catch(() => ({ products: [] }))
    ]).then(([overviewData, forecast, basket, ins, trend, productForecast]) => {
      setOverview(overviewData);
      setForecastData(forecast);
      setBasketAnalysis(basket);
      setInsights(ins);
      setWeeklyTrend(trend);
      setProductForecastData(productForecast || { products: [] });
      // Auto-select the first (top-selling) product
      if (productForecast?.products?.length > 0) {
        setSelectedProduct(productForecast.products[0].name);
      }
      setLoading(false);
    });
  }, []);

  const handleExportAll = () => {
    try {
      const lines = [];
      lines.push("HARDWARE STORE - Analytics Report");
      lines.push(`Generated: ${new Date().toLocaleString()}`);
      lines.push("");
      lines.push("OVERVIEW");
      lines.push(`Monthly Revenue,LKR ${overview?.monthlyRevenue ?? 0}`);
      lines.push(`Total Transactions,${overview?.totalTransactions ?? 0}`);
      lines.push(`Avg Order Value,LKR ${overview?.avgOrderValue ?? 0}`);
      lines.push("");
      lines.push("TOP PRODUCTS");
      lines.push("Name,Units Sold,Revenue,Trend");
      (overview?.topProducts ?? []).forEach(p => {
        lines.push(`${p.name},${p.sales},${p.revenue},${p.trend}`);
      });
      lines.push("");
      lines.push("WEEKLY TREND");
      lines.push("Day,Revenue");
      weeklyTrend.forEach(d => lines.push(`${d.day},${d.revenue ?? 0}`));
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Analytics report exported!");
    } catch (err) {
      toast.error("Failed to export report");
    }
  };



  const handlePrint = () => window.print();


  // Filter trend data based on period
  const getTrendData = () => {
    if (trendPeriod === "week") return weeklyTrend;
    // For month, show all weekly trend data (already from backend)
    return weeklyTrend;
  };

  const topProducts = overview?.topProducts?.map(p => ({
    ...p,
    trend: p.trend || "+0%"
  })) ?? [];
  const categoryData = overview?.categoryData ?? [];

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <style>{PRINT_STYLES}</style>
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Reports & Analytics" />

        <div className="p-6 space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {["overview", "product forecasting", "seasonal analysis", "basket analysis", "insights"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab
                    ? "bg-[#E60012] text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 no-print">
              <Button variant="secondary" onClick={handlePrint} className="whitespace-nowrap">
                <Printer className="w-4 h-4 mr-2" /> Print Report
              </Button>
              <Button onClick={handleExportAll} className="whitespace-nowrap">
                <Download className="w-4 h-4 mr-2" /> Export All
              </Button>
            </div>
          </div>

          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-3 gap-5">
                <div className="nintendo-stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#7AC143]/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-[#7AC143]" />
                    </div>
                    {!loading && (
                      <span className={`nintendo-badge ${(overview?.revenueChange ?? 0) >= 0 ? 'nintendo-badge-success' : 'nintendo-badge-danger'}`}>
                        {(overview?.revenueChange ?? 0) >= 0 ? '+' : ''}{overview?.revenueChange ?? 0}%
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">
                    {loading ? "..." : `LKR ${(overview?.monthlyRevenue ?? 0).toLocaleString()}`}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">Monthly Revenue</p>
                </div>
                <div className="nintendo-stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-[#0AB5CD]" />
                    </div>
                    {!loading && (
                      <span className={`nintendo-badge ${(overview?.transactionChange ?? 0) >= 0 ? 'nintendo-badge-success' : 'nintendo-badge-danger'}`}>
                        {(overview?.transactionChange ?? 0) >= 0 ? '+' : ''}{overview?.transactionChange ?? 0}%
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">
                    {loading ? "..." : (overview?.totalTransactions ?? 0)}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
                </div>
                <div className="nintendo-stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#E60012]/10 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-[#E60012]" />
                    </div>
                    {!loading && (
                      <span className={`nintendo-badge ${(overview?.avgChange ?? 0) >= 0 ? 'nintendo-badge-success' : 'nintendo-badge-danger'}`}>
                        {(overview?.avgChange ?? 0) >= 0 ? '+' : ''}{overview?.avgChange ?? 0}%
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">
                    {loading ? "..." : `LKR ${(overview?.avgOrderValue ?? 0).toFixed(2)}`}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">Avg. Order Value</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="nintendo-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">Revenue Trend</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Daily revenue — past 7 days</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrendPeriod("week")}
                        className={`px-3 py-1 text-sm font-semibold rounded-lg transition-all ${trendPeriod === "week" ? "text-[#E60012] bg-[#E60012]/10" : "text-gray-500 hover:bg-gray-100"}`}
                      >Week</button>
                      <button
                        onClick={() => setTrendPeriod("month")}
                        className={`px-3 py-1 text-sm font-semibold rounded-lg transition-all ${trendPeriod === "month" ? "text-[#E60012] bg-[#E60012]/10" : "text-gray-500 hover:bg-gray-100"}`}
                      >Month</button>
                    </div>
                  </div>
                  {getTrendData().length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                      {loading ? "Loading…" : "No sales data yet"}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={getTrendData()} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 600, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48}
                          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        <Tooltip content={<ChartTooltip isCurrency />} cursor={{ fill: "#fafafa" }} />
                        <Legend formatter={v => <span style={{ fontSize: 12, color: "#6B7280" }}>{v}</span>} />
                        <Bar dataKey="revenue" name="Revenue (LKR)" fill="#E60012" radius={[6,6,0,0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="nintendo-card p-6">
                  <div className="mb-2">
                    <h3 className="font-bold text-xl text-gray-900">Sales by Category</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Revenue breakdown this month</p>
                  </div>
                  {categoryData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                      {loading ? "Loading…" : "No category data yet"}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                          paddingAngle={3} dataKey="amount" nameKey="name" stroke="none">
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0];
                          return (
                            <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: "8px 14px", fontSize: 13 }}>
                              <p style={{ fontWeight: 700, color: d.payload.fill }}>{d.name}</p>
                              <p style={{ color: "#374151" }}>{d.payload.percentage}% · LKR {Number(d.value).toLocaleString()}</p>
                            </div>
                          );
                        }} />
                        <Legend iconType="circle" iconSize={9}
                          formatter={v => <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="nintendo-card p-6 col-span-2">
                  <h3 className="font-bold text-xl text-gray-900 mb-6">Top Selling Products</h3>
                  <table className="nintendo-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Units Sold</th>
                        <th>Revenue</th>
                        <th>Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
                      ) : topProducts.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">No sales data yet. Make some sales to see top products.</td></tr>
                      ) : topProducts.map((product, i) => (
                        <tr key={i}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-500">
                                #{i + 1}
                              </div>
                              <span className="font-bold text-gray-900">{product.name}</span>
                            </div>
                          </td>
                          <td className="font-semibold text-gray-700">{product.sales}</td>
                          <td className="font-bold text-gray-900">LKR {(product.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td>
                            <span className={`nintendo-badge flex items-center gap-1 w-fit ${(product.trend || "+0%").startsWith('+') ? 'nintendo-badge-success' : 'nintendo-badge-danger'
                              }`}>
                              {(product.trend || "+0%").startsWith('+') ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {product.trend || "+0%"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "product forecasting" && (() => {
            const products = productForecastData?.products || [];
            const currentProduct = products.find(p => p.name === selectedProduct);

            // Build chart data for selected product (history + forecast combined)
            const chartData = [];
            if (currentProduct) {
              (currentProduct.history || []).forEach(h => {
                chartData.push({ month: h.month, actual: h.qty, predicted: null });
              });
              (currentProduct.forecast || []).forEach(f => {
                chartData.push({ month: f.month, actual: null, predicted: f.qty });
              });
            }

            const growingProducts = products.filter(p => p.trend === "growing").slice(0, 5);
            const decliningProducts = products.filter(p => p.trend === "declining").slice(0, 5);
            const totalTracked = products.length;
            const topProduct = products.length > 0 ? products[0] : null;
            const avgDemand = products.length > 0
              ? Math.round(products.reduce((s, p) => s + (p.avgMonthly || 0), 0) / products.length)
              : 0;

            return (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-5">
                  <div className="nintendo-stat-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#9B59B6]/10 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-[#9B59B6]" />
                      </div>
                      <span className="font-bold text-gray-900">Products Tracked</span>
                    </div>
                    <p className="text-2xl font-extrabold text-[#9B59B6]">
                      {loading ? "..." : totalTracked}
                    </p>
                    <p className="text-sm text-gray-500">With sales history data</p>
                  </div>
                  <div className="nintendo-stat-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#7AC143]/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#7AC143]" />
                      </div>
                      <span className="font-bold text-gray-900">Top Product</span>
                    </div>
                    <p className="text-xl font-extrabold text-[#7AC143] truncate">
                      {loading ? "..." : (topProduct?.name || "—")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {topProduct ? `${topProduct.totalSold} units total` : "No data yet"}
                    </p>
                  </div>
                  <div className="nintendo-stat-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[#0AB5CD]" />
                      </div>
                      <span className="font-bold text-gray-900">Avg Monthly Demand</span>
                    </div>
                    <p className="text-2xl font-extrabold text-[#0AB5CD]">
                      {loading ? "..." : `${avgDemand} units`}
                    </p>
                    <p className="text-sm text-gray-500">Across all products</p>
                  </div>
                </div>

                {/* Product Selector + Chart */}
                <div className="nintendo-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E60012]/10 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-[#E60012]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">Product Demand Forecast</h3>
                        <p className="text-sm text-gray-500">Per-product quantity prediction using ML moving average</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="nintendo-badge bg-[#E60012]/10 text-[#E60012]">
                        <Zap className="w-3 h-3 mr-1" /> ML Powered
                      </span>
                      <select
                        id="product-forecast-selector"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] max-w-[240px] truncate"
                      >
                        {products.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {chartData.length === 0 ? (
                    <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
                      {loading ? "Loading…" : "No product forecast data available. Make some sales first."}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={42}
                          label={{ value: "Qty Sold", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "#9CA3AF" } }} />
                        <Tooltip content={<ChartTooltip isCurrency={false} />} />
                        <Legend formatter={v => <span style={{ fontSize: 12, color: "#6B7280" }}>{v}</span>} />
                        <Line type="monotone" dataKey="actual" name="Actual Qty" stroke="#E60012" strokeWidth={2.5}
                          dot={{ r: 5, fill: "#E60012", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} connectNulls={false} />
                        <Line type="monotone" dataKey="predicted" name="Forecasted Qty" stroke="#9B59B6" strokeWidth={2.5}
                          strokeDasharray="6 3" dot={{ r: 5, fill: "#9B59B6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}

                  {/* Current product stats bar */}
                  {currentProduct && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium">Total Sold</p>
                        <p className="text-lg font-extrabold text-gray-900">{currentProduct.totalSold}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium">Avg/Month</p>
                        <p className="text-lg font-extrabold text-gray-900">{currentProduct.avgMonthly}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium">Trend</p>
                        <p className={`text-lg font-extrabold ${currentProduct.trend === 'growing' ? 'text-[#7AC143]' : currentProduct.trend === 'declining' ? 'text-[#E60012]' : 'text-[#F5A623]'}`}>
                          {currentProduct.trend === 'growing' ? '📈 Growing' : currentProduct.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium">Growth</p>
                        <p className={`text-lg font-extrabold ${(currentProduct.growthPct || 0) >= 0 ? 'text-[#7AC143]' : 'text-[#E60012]'}`}>
                          {(currentProduct.growthPct || 0) >= 0 ? '+' : ''}{currentProduct.growthPct || 0}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Growing and Declining Products */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Top Growing Products */}
                  <div className="nintendo-card p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#7AC143]/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#7AC143]" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">Top Growing Products</h4>
                    </div>
                    {growingProducts.length === 0 ? (
                      <p className="text-gray-400 text-sm py-4 text-center">No products with growing demand detected yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {growingProducts.map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-[#7AC143]/5 rounded-xl cursor-pointer hover:bg-[#7AC143]/10 transition-all"
                            onClick={() => setSelectedProduct(p.name)}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#7AC143]/20 rounded-lg flex items-center justify-center font-bold text-[#7AC143] text-sm">
                                #{i + 1}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                                <p className="text-xs text-gray-500">{p.avgMonthly} avg/mo</p>
                              </div>
                            </div>
                            <span className="nintendo-badge nintendo-badge-success flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              +{p.growthPct || 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Declining Demand Alerts */}
                  <div className="nintendo-card p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#E60012]/10 rounded-xl flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-[#E60012]" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">Declining Demand Alerts</h4>
                    </div>
                    {decliningProducts.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-[#7AC143]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <Target className="w-6 h-6 text-[#7AC143]" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">All products are healthy!</p>
                        <p className="text-gray-400 text-xs">No declining demand patterns detected.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {decliningProducts.map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-[#E60012]/5 rounded-xl cursor-pointer hover:bg-[#E60012]/10 transition-all"
                            onClick={() => setSelectedProduct(p.name)}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#E60012]/20 rounded-lg flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-[#E60012]" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                                <p className="text-xs text-gray-500">{p.avgMonthly} avg/mo · Consider reducing stock</p>
                              </div>
                            </div>
                            <span className="nintendo-badge nintendo-badge-danger flex items-center gap-1">
                              {p.growthPct || 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* All Products Forecast Table */}
                <div className="nintendo-card p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-5">All Products Forecast Summary</h3>
                  <table className="nintendo-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Total Sold</th>
                        <th>Avg/Month</th>
                        <th>Next Month Forecast</th>
                        <th>Trend</th>
                        <th>Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
                      ) : products.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">No product sales data yet. Make some sales to generate forecasts.</td></tr>
                      ) : products.map((p, i) => (
                        <tr key={i} className={`cursor-pointer transition-all ${selectedProduct === p.name ? 'bg-[#E60012]/5' : 'hover:bg-gray-50'}`}
                          onClick={() => setSelectedProduct(p.name)}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-500 text-xs">
                                #{i + 1}
                              </div>
                              <span className="font-bold text-gray-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="font-semibold text-gray-700">{p.totalSold}</td>
                          <td className="font-semibold text-gray-700">{p.avgMonthly}</td>
                          <td className="font-bold text-gray-900">
                            {p.forecast?.[0]?.qty ?? "—"} units
                          </td>
                          <td>
                            <span className={`nintendo-badge flex items-center gap-1 w-fit ${
                              p.trend === 'growing' ? 'nintendo-badge-success' :
                              p.trend === 'declining' ? 'nintendo-badge-danger' :
                              'bg-[#F5A623]/10 text-[#F5A623]'
                            }`}>
                              {p.trend === 'growing' ? <TrendingUp className="w-3 h-3" /> :
                               p.trend === 'declining' ? <TrendingDown className="w-3 h-3" /> :
                               <Activity className="w-3 h-3" />}
                              {p.trend}
                            </span>
                          </td>
                          <td>
                            <span className={`font-bold ${(p.growthPct || 0) >= 0 ? 'text-[#7AC143]' : 'text-[#E60012]'}`}>
                              {(p.growthPct || 0) >= 0 ? '+' : ''}{p.growthPct || 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {activeTab === "seasonal analysis" && (
            <div className="space-y-6">
              <div className="nintendo-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#9B59B6]/10 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-[#9B59B6]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">Seasonal Analysis (Sales Forecasting)</h3>
                      <p className="text-sm text-gray-500">AI-powered predictions based on historical data</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="nintendo-badge bg-[#9B59B6]/10 text-[#9B59B6]">
                      <Zap className="w-3 h-3 mr-1" /> ML Model Active
                    </span>
                  </div>
                </div>

                {forecastData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
                    {loading ? "Loading…" : "No forecast data"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecastData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={52}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                        label={{ value: "Revenue (LKR)", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "#9CA3AF" } }} />
                      <Tooltip content={<ChartTooltip isCurrency />} />
                      <Legend formatter={v => <span style={{ fontSize: 12, color: "#6B7280" }}>{v}</span>} />
                      <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#E60012" strokeWidth={2.5}
                        dot={{ r: 4, fill: "#E60012" }} activeDot={{ r: 6 }} connectNulls={false} />
                      <Line type="monotone" dataKey="predicted" name="Predicted Sales" stroke="#9B59B6" strokeWidth={2.5}
                        strokeDasharray="6 3" dot={{ r: 4, fill: "#9B59B6" }} activeDot={{ r: 6 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="nintendo-stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#7AC143]/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#7AC143]" />
                    </div>
                    <span className="font-bold text-gray-900">Next Month Forecast</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#7AC143]">
                    {forecastData.find(d => d.predicted) ?
                      `LKR ${forecastData.find(d => d.predicted)?.predicted?.toLocaleString()}` :
                      "No data yet"}
                  </p>
                  <p className="text-sm text-gray-500">Estimated based on recent sales</p>
                </div>
                <div className="nintendo-stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#0AB5CD]" />
                    </div>
                    <span className="font-bold text-gray-900">Months With Data</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#0AB5CD]">
                    {forecastData.filter(d => d.actual && d.actual > 0).length}
                  </p>
                  <p className="text-sm text-gray-500">Historical months tracked</p>
                </div>
                <div className="nintendo-stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#F5A623]/10 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <span className="font-bold text-gray-900">Trend Direction</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#F5A623]">
                    {(() => {
                      const actuals = forecastData.filter(d => d.actual && d.actual > 0);
                      if (actuals.length < 2) return "—";
                      return actuals.at(-1).actual >= actuals.at(-2).actual ? "📈 Up" : "📉 Down";
                    })()}
                  </p>
                  <p className="text-sm text-gray-500">Month-over-month</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "basket analysis" && (
            <div className="space-y-6">
              <div className="nintendo-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-[#0AB5CD]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">Market Basket Analysis</h3>
                    <p className="text-sm text-gray-500">Products frequently purchased together</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {basketAnalysis.map((basket, i) => (
                    <div key={i} className="p-5 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {basket.products.map((product, j) => (
                            <span key={j} className="flex items-center">
                              <span className="px-3 py-1.5 bg-white rounded-lg font-medium text-gray-900 shadow-sm">
                                {product}
                              </span>
                              {j < basket.products.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                              )}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Frequency</p>
                            <p className="font-bold text-gray-900">{basket.frequency} purchases</p>
                          </div>
                          <span className="nintendo-badge nintendo-badge-success">{basket.confidence} confidence</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0AB5CD] to-[#7AC143] rounded-full"
                          style={{ width: `${parseInt(basket.confidence)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nintendo-card p-6">
                <h4 className="font-bold text-lg text-gray-900 mb-4">Bundling Recommendations</h4>
                <div className="grid grid-cols-2 gap-4">
                  {basketAnalysis.length > 0 ? basketAnalysis.slice(0, 2).map((basket, i) => {
                    const isFirst = i === 0;
                    const bgColor = isFirst ? 'bg-[#7AC143]/5' : 'bg-[#0AB5CD]/5';
                    const borderColor = isFirst ? 'border-[#7AC143]/20' : 'border-[#0AB5CD]/20';
                    const textColor = isFirst ? 'text-[#7AC143]' : 'text-[#0AB5CD]';
                    const title = isFirst ? "Top Recommendation" : "High Value Bundle";

                    return (
                      <div key={i} className={`p-4 ${bgColor} border-2 ${borderColor} rounded-xl`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className={`w-5 h-5 ${textColor}`} />
                          <span className="font-bold text-gray-900">{title}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Bundle: {basket.products.join(" + ")}</p>
                        <p className={`text-sm font-bold ${textColor}`}>
                          Pairs frequently ({basket.confidence} match)
                        </p>
                      </div>
                    );
                  }) : (
                    <div className="col-span-2 text-center text-sm text-gray-500 py-4">
                      No recommendations available yet. Data processing required.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "insights" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-5">
                {insights.map((insight, i) => {
                  const Icon = ICON_MAP[insight.icon] || Lightbulb;
                  return (
                    <div key={i} className="nintendo-card p-6">
                      <div className={`w-12 h-12 ${insight.color}/10 rounded-xl flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${insight.color.replace('bg-', 'text-')}`} />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{insight.title}</h4>
                      <p className="text-gray-600">{insight.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="nintendo-card p-6">
                <h3 className="font-bold text-xl text-gray-900 mb-6">AI-Powered Recommendations</h3>
                <div className="space-y-4">
                  {insights.length === 0 ? (
                    <p className="text-gray-500 text-sm">No insights available yet. Add products and make sales to get AI recommendations.</p>
                  ) : insights.map((insight, i) => {
                    const borderColors = ["border-[#E60012]", "border-[#7AC143]", "border-[#0AB5CD]", "border-[#F5A623]"];
                    const bgColors = ["bg-[#E60012]/5", "bg-[#7AC143]/5", "bg-[#0AB5CD]/5", "bg-[#F5A623]/5"];
                    return (
                      <div key={i} className={`p-4 ${bgColors[i % bgColors.length]} border-l-4 ${borderColors[i % borderColors.length]} rounded-r-xl`}>
                        <p className="font-bold text-gray-900 mb-1">{insight.title}</p>
                        <p className="text-gray-600">{insight.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


    </div>
  );
};

export default Reports;
