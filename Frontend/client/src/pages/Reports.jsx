import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
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

const forecastData = [
  { month: "Jan", actual: 45000, predicted: null },
  { month: "Feb", actual: 52000, predicted: null },
  { month: "Mar", actual: 48000, predicted: null },
  { month: "Apr", actual: 61000, predicted: null },
  { month: "May", actual: 55000, predicted: null },
  { month: "Jun", actual: null, predicted: 58000 },
  { month: "Jul", actual: null, predicted: 62000 },
  { month: "Aug", actual: null, predicted: 67000 },
];

const basketAnalysis = [
  { products: ["Hammer", "Nails", "Wood Glue"], frequency: 78, confidence: "92%" },
  { products: ["Paint Brush", "Paint Roller", "Painter's Tape"], frequency: 65, confidence: "88%" },
  { products: ["Screwdriver Set", "Drill Bits", "Screws"], frequency: 54, confidence: "85%" },
  { products: ["Measuring Tape", "Level Tool", "Pencil Set"], frequency: 42, confidence: "79%" },
];

const insights = [
  { title: "Peak Sales Hours", description: "10 AM - 12 PM shows 35% higher sales", icon: Clock, color: "bg-[#E60012]" },
  { title: "Stock Alert", description: "Reorder Nails 2\" - running low this week", icon: Target, color: "bg-[#F5A623]" },
  { title: "Trending Up", description: "Power tools category grew 28% this month", icon: TrendingUp, color: "bg-[#7AC143]" },
];

const REPORT_COLORS = ["bg-[#E60012]", "bg-[#0AB5CD]", "bg-[#7AC143]", "bg-[#F5A623]"];

export const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsService.getOverview()
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

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
                  className={`px-5 py-2.5 rounded-xl font-bold capitalize transition-all ${
                    activeTab === tab 
                      ? "bg-[#E60012] text-white shadow-lg" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary">
                <Calendar className="w-4 h-4 mr-2" /> Date Range
              </Button>
              <Button>
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
                      <button className="px-3 py-1 text-sm font-semibold text-[#E60012] bg-[#E60012]/10 rounded-lg">Week</button>
                      <button className="px-3 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg">Month</button>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2 px-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const heights = [55, 72, 48, 85, 68, 92, 78];
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-gradient-to-t from-[#E60012] to-[#FF6B6B] rounded-t-lg"
                            style={{ height: `${heights[i]}%` }}
                          />
                          <span className="text-xs font-semibold text-gray-500">{day}</span>
                        </div>
                      );
                    })}
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
                        <th>Trend</th>
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
                            <span className={`nintendo-badge flex items-center gap-1 w-fit ${
                              (product.trend || "+0%").startsWith('+') ? 'nintendo-badge-success' : 'nintendo-badge-danger'
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
                            ${((data.actual || data.predicted) / 1000).toFixed(0)}k
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
                  <p className="text-2xl font-extrabold text-[#7AC143]">$58,000</p>
                  <p className="text-sm text-gray-500">+5.5% vs current month</p>
                </div>
                <div className="nintendo-stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#0AB5CD]" />
                    </div>
                    <span className="font-bold text-gray-900">Forecast Accuracy</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#0AB5CD]">94.2%</p>
                  <p className="text-sm text-gray-500">Based on last 6 months</p>
                </div>
                <div className="nintendo-stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#F5A623]/10 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <span className="font-bold text-gray-900">Seasonal Trend</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#F5A623]">Peak Q3</p>
                  <p className="text-sm text-gray-500">Construction season expected</p>
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
                  const Icon = insight.icon;
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
                  <div className="p-4 bg-[#E60012]/5 border-l-4 border-[#E60012] rounded-r-xl">
                    <p className="font-bold text-gray-900 mb-1">Restock Alert</p>
                    <p className="text-gray-600">Based on sales velocity, you should reorder 2" Nails within the next 3 days to avoid stockout.</p>
                  </div>
                  <div className="p-4 bg-[#7AC143]/5 border-l-4 border-[#7AC143] rounded-r-xl">
                    <p className="font-bold text-gray-900 mb-1">Pricing Opportunity</p>
                    <p className="text-gray-600">Hammer 16oz has high demand elasticity. A 5% price increase may boost revenue without affecting sales volume.</p>
                  </div>
                  <div className="p-4 bg-[#0AB5CD]/5 border-l-4 border-[#0AB5CD] rounded-r-xl">
                    <p className="font-bold text-gray-900 mb-1">Staff Optimization</p>
                    <p className="text-gray-600">Saturday 10AM-2PM has 40% higher traffic. Consider scheduling additional cashiers during this window.</p>
                  </div>
                  <div className="p-4 bg-[#F5A623]/5 border-l-4 border-[#F5A623] rounded-r-xl">
                    <p className="font-bold text-gray-900 mb-1">Cross-sell Opportunity</p>
                    <p className="text-gray-600">Customers buying paint often don't buy brushes. Consider point-of-sale prompts for painting accessories.</p>
                  </div>
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
