import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import {
  Download,
  Calendar,
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
  Printer,
  FileText
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

const REPORT_COLORS = ["bg-[#E60012]", "bg-[#0AB5CD]", "bg-[#7AC143]", "bg-[#F5A623]"];

export const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [trendPeriod, setTrendPeriod] = useState("week");
  const [overview, setOverview] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [basketAnalysis, setBasketAnalysis] = useState([]);
  const [insights, setInsights] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsService.getOverview().catch(() => null),
      reportsService.getForecasting().catch(() => []),
      reportsService.getBasketAnalysis().catch(() => []),
      reportsService.getInsights().catch(() => []),
      reportsService.getWeeklyTrend().catch(() => [])
    ]).then(([overviewData, forecast, basket, ins, trend]) => {
      setOverview(overviewData);
      setForecastData(forecast);
      setBasketAnalysis(basket);
      setInsights(ins);
      setWeeklyTrend(trend);
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

  const handleTrainML = async () => {
    try {
      setTraining(true);
      toast.success("Training ML models. This may take a moment...");
      await reportsService.trainML();
      toast.success("ML Models trained successfully!");
      const [forecast, basket] = await Promise.all([
        reportsService.getForecasting().catch(() => []),
        reportsService.getBasketAnalysis().catch(() => [])
      ]);
      setForecastData(forecast);
      setBasketAnalysis(basket);
    } catch (err) {
      toast.error(err.message || "Failed to train ML models");
    } finally {
      setTraining(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const rows = ["Product,Units Sold,Revenue (LKR),Margin %"];
      topProducts.forEach(p =>
        rows.push(`"${p.name}",${p.sales},${(p.revenue ?? 0).toFixed(2)},${p.trend}`)
      );
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handlePrint = () => window.print();

  const handleApplyDateRange = () => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Start date must be before end date");
      return;
    }
    setShowDateModal(false);
    toast.success(`Showing data from ${dateFrom} to ${dateTo}`);
  };

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
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {["overview", "seasonal analysis", "basket analysis", "insights"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold capitalize transition-all ${activeTab === tab
                    ? "bg-[#E60012] text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex gap-3 no-print">
              <Button variant="secondary" onClick={handleTrainML} disabled={training}>
                <Brain className={`w-4 h-4 mr-2 ${training ? 'animate-pulse' : ''}`} /> 
                {training ? 'Training...' : 'Retrain ML Models'}
              </Button>
              <Button variant="secondary" onClick={() => setShowDateModal(true)}>
                <Calendar className="w-4 h-4 mr-2" /> Date Range
              </Button>
              <Button variant="secondary" onClick={handleExportCSV}>
                <FileText className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="secondary" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print Report
              </Button>
              <Button onClick={handleExportAll}>
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
                    <span className="nintendo-badge nintendo-badge-success">+18.2%</span>
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
                    <span className="nintendo-badge nintendo-badge-success">+12.5%</span>
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
                    <span className="nintendo-badge nintendo-badge-warning">-2.1%</span>
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

      {/* Date Range Modal */}
      <Modal isOpen={showDateModal} onClose={() => setShowDateModal(false)} title="Select Date Range" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="nintendo-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="nintendo-input w-full"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowDateModal(false)}>Cancel</Button>
            <Button onClick={handleApplyDateRange}>
              <Calendar className="w-4 h-4 mr-2" /> Apply Range
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
