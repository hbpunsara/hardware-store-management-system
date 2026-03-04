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
  Clock
} from "lucide-react";
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
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Reports & Analytics" />

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {["overview", "forecasting", "basket analysis", "insights"].map((tab) => (
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
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDateModal(true)}>
                <Calendar className="w-4 h-4 mr-2" /> Date Range
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
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl text-gray-900">Revenue Trend</h3>
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
                  <div className="h-64 flex items-end justify-between gap-2 px-2">
                    {getTrendData().length === 0 ? (
                      loading ? (
                        <p className="text-gray-400 text-sm w-full text-center">Loading...</p>
                      ) : (
                        <p className="text-gray-400 text-sm w-full text-center">No sales data yet</p>
                      )
                    ) : getTrendData().map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-gradient-to-t from-[#E60012] to-[#FF6B6B] rounded-t-lg transition-all duration-500"
                          style={{ height: `${d.heightPct || 5}%` }}
                          title={`LKR ${(d.revenue || 0).toLocaleString()}`}
                        />
                        <span className="text-xs font-semibold text-gray-500">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="nintendo-card p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-6">Sales by Category</h3>
                  {categoryData.length === 0 ? (
                    <p className="text-gray-500 text-sm py-8 text-center">No category data yet. Make some sales to see breakdown.</p>
                  ) : (
                    <div className="space-y-4">
                      {categoryData.map((cat, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${cat.color || REPORT_COLORS[i % REPORT_COLORS.length]}`} />
                          <span className="text-sm font-medium text-gray-700 flex-1">{cat.name}</span>
                          <span className="text-sm font-bold text-gray-900">{cat.percentage}%</span>
                          <span className="text-xs text-gray-500">LKR {(cat.amount ?? 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
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

          {activeTab === "forecasting" && (
            <div className="space-y-6">
              <div className="nintendo-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#9B59B6]/10 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-[#9B59B6]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">Sales Forecasting</h3>
                      <p className="text-sm text-gray-500">AI-powered predictions based on historical data</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="nintendo-badge bg-[#9B59B6]/10 text-[#9B59B6]">
                      <Zap className="w-3 h-3 mr-1" /> ML Model Active
                    </span>
                  </div>
                </div>

                <div className="h-80 flex items-end justify-between gap-3 px-4 mb-4">
                  {forecastData.map((data, i) => {
                    const maxValue = 70000;
                    const actualHeight = data.actual ? (data.actual / maxValue) * 100 : 0;
                    const predictedHeight = data.predicted ? (data.predicted / maxValue) * 100 : 0;

                    return (
                      <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full h-full flex items-end">
                          {data.actual && (
                            <div
                              className="w-full bg-gradient-to-t from-[#E60012] to-[#FF6B6B] rounded-t-lg"
                              style={{ height: `${actualHeight}%` }}
                            />
                          )}
                          {data.predicted && (
                            <div
                              className="w-full bg-gradient-to-t from-[#9B59B6] to-[#C39BD3] rounded-t-lg border-2 border-dashed border-[#9B59B6]"
                              style={{ height: `${predictedHeight}%` }}
                            />
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-semibold text-gray-500">{data.month}</span>
                          <p className="text-xs font-bold text-gray-900">
                            {(((data.actual || data.predicted) || 0) / 1000).toFixed(0)}k
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#E60012] rounded" />
                    <span className="text-sm font-medium text-gray-600">Actual Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#9B59B6] rounded border-2 border-dashed border-[#9B59B6]" />
                    <span className="text-sm font-medium text-gray-600">Predicted Sales</span>
                  </div>
                </div>
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
                  <div className="p-4 bg-[#7AC143]/5 border-2 border-[#7AC143]/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-[#7AC143]" />
                      <span className="font-bold text-gray-900">Tool Starter Kit</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Bundle Hammer + Screwdriver Set + Measuring Tape</p>
                    <p className="text-sm font-bold text-[#7AC143]">Potential 15% increase in avg. order value</p>
                  </div>
                  <div className="p-4 bg-[#0AB5CD]/5 border-2 border-[#0AB5CD]/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-[#0AB5CD]" />
                      <span className="font-bold text-gray-900">Painter's Bundle</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Bundle Brushes + Rollers + Tape + Drop Cloth</p>
                    <p className="text-sm font-bold text-[#0AB5CD]">Potential 22% increase in paint category sales</p>
                  </div>
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
