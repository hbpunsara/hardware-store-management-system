import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Plus,
  Download,
  Calendar,
  Save
} from "lucide-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { transactionService } from "../services/transactionService";
import { reportsService } from "../services/reportsService";

const categories = ["Sales", "Inventory", "Utilities", "Payroll", "Rent", "Maintenance", "Marketing", "Other"];
const paymentMethods = ["Cash", "Card", "Bank Transfer", "Cheque", "Mobile Payment"];

export const Finance = () => {
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [transactions, setTransactions] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: "Sales",
    type: "income",
    amount: "",
    method: "Cash",
    date: new Date().toISOString().split('T')[0]
  });
  const toast = useToast();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [data, trend] = await Promise.all([
        transactionService.getAll(),
        reportsService.getWeeklyTrend().catch(() => [])
      ]);
      setTransactions(data);
      setWeeklyTrend(trend);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK').format(amount);
  };

  const handleAddTransaction = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await transactionService.create({
        date: formData.date,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        amount: parseFloat(formData.amount),
        method: formData.method
      });
      await fetchTransactions();
      setShowAddModal(false);
      setFormData({
        description: "",
        category: "Sales",
        type: "income",
        amount: "",
        method: "Cash",
        date: new Date().toISOString().split('T')[0]
      });
      toast.success(`${formData.type === "income" ? "Income" : "Expense"} added successfully!`);
    } catch (err) {
      toast.error("Failed to add transaction");
    }
  };

  const filteredTransactions = transactions.filter(t =>
    filterType === "all" || t.type === filterType
  );

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const expenseByCategory = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const expenseTotal = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
  const expenseCategories = Object.entries(expenseByCategory).map(([name, amount], i) => {
    const colors = ["bg-[#E60012]", "bg-[#0AB5CD]", "bg-[#7AC143]", "bg-[#F5A623]", "bg-[#9B59B6]"];
    return {
      name,
      amount,
      percentage: expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0,
      color: colors[i % colors.length]
    };
  });

  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  // ── 6-month cash flow data for AreaChart ──────────────────────────────────
  const cashFlowData = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const ym = d.toISOString().slice(0, 7); // "YYYY-MM"
      const monthLabel = d.toLocaleString("default", { month: "short" });
      const income = transactions
        .filter(t => t.type === "income" && (t.date || "").startsWith(ym))
        .reduce((s, t) => s + Number(t.amount), 0);
      const expense = transactions
        .filter(t => t.type === "expense" && (t.date || "").startsWith(ym))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { month: monthLabel, income, expense };
    });
  })();

  // ── Pie data from expense categories ─────────────────────────────────────
  const PIE_COLORS = ["#E60012", "#0AB5CD", "#7AC143", "#F5A623", "#9B59B6", "#1ABC9C"];
  const pieChartData = expenseCategories.map((cat, i) => ({
    name: cat.name,
    value: cat.amount,
    percentage: cat.percentage,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // ── Shared tooltip ────────────────────────────────────────────────────────
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: "8px 14px", fontSize: 13 }}>
        {label && <p style={{ fontWeight: 700, color: "#374151", marginBottom: 4 }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill, fontWeight: 600 }}>
            {p.name}: LKR {Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  const financeStats = [
    { label: "Total Revenue", value: `LKR ${formatCurrency(totalIncome)}`, change: totalIncome > 0 ? `+${profitMargin}%` : "—", trend: "up", icon: TrendingUp, color: "bg-[#7AC143]" },
    { label: "Total Expenses", value: `LKR ${formatCurrency(totalExpense)}`, change: totalExpense > 0 ? `${Math.round((totalExpense / Math.max(totalIncome, 1)) * 100)}%` : "—", trend: "down", icon: TrendingDown, color: "bg-[#E60012]" },
    { label: "Net Profit", value: `LKR ${formatCurrency(netProfit)}`, change: netProfit >= 0 ? `${profitMargin}% margin` : "Loss", trend: netProfit >= 0 ? "up" : "down", icon: Wallet, color: "bg-[#0AB5CD]" },
    { label: "Transactions", value: transactions.length.toString(), change: `${transactions.length} total`, trend: "up", icon: PiggyBank, color: "bg-[#F5A623]" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar title="Finance Management" />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Button variant={dateRange === "today" ? "primary" : "secondary"} onClick={() => setDateRange("today")}>
                Today
              </Button>
              <Button variant={dateRange === "week" ? "primary" : "secondary"} onClick={() => setDateRange("week")}>
                This Week
              </Button>
              <Button variant={dateRange === "month" ? "primary" : "secondary"} onClick={() => setDateRange("month")}>
                This Month
              </Button>
              <Button variant="secondary" onClick={() => toast.info("Custom date range coming soon!")}>
                <Calendar className="w-4 h-4 mr-2" /> Custom Range
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => {
                try {
                  const headers = ["Date", "Description", "Category", "Method", "Type", "Amount"];
                  const rows = transactions.map(t => [t.date, t.description, t.category, t.method, t.type, t.amount]);
                  const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `finance-report-${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Financial report exported!");
                } catch (err) {
                  toast.error("Failed to export report");
                }
              }}>
                <Download className="w-4 h-4 mr-2" /> Export Report
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Transaction
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {financeStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="nintendo-stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`nintendo-badge flex items-center gap-1 ${stat.trend === "up" ? "nintendo-badge-success" : "nintendo-badge-danger"
                      }`}>
                      {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                  <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                </div>
              );
            })}
          </div>

          {/* ── 6-Month Cash Flow Area Chart ────────────────────────────── */}
          <div className="nintendo-card p-6">
            <div className="mb-5">
              <h3 className="font-bold text-xl text-gray-900">Monthly Cash Flow</h3>
              <p className="text-sm text-gray-400 mt-0.5">Income vs Expenses — past 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={cashFlowData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7AC143" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7AC143" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E60012" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E60012" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={52}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<ChartTooltip />} />
                <Legend formatter={v => <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{v}</span>} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#7AC143" strokeWidth={2.5}
                  fill="url(#incomeGrad)" dot={{ r: 4, fill: "#7AC143" }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#E60012" strokeWidth={2.5}
                  fill="url(#expenseGrad)" dot={{ r: 4, fill: "#E60012" }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="nintendo-card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-xl text-gray-900">Recent Transactions</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterType("all")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === "all" ? "bg-[#E60012] text-white" : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterType("income")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === "income" ? "bg-[#7AC143] text-white" : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      Income
                    </button>
                    <button
                      onClick={() => setFilterType("expense")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === "expense" ? "bg-[#E60012] text-white" : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      Expenses
                    </button>
                  </div>
                </div>
                <table className="nintendo-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Method</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-500">No transactions yet. Add one to get started.</td></tr>
                    ) : filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="text-gray-600">{tx.date}</td>
                        <td className="font-medium text-gray-900">{tx.description}</td>
                        <td>
                          <span className="nintendo-badge nintendo-badge-info">{tx.category}</span>
                        </td>
                        <td className="text-gray-600">{tx.method}</td>
                        <td>
                          <span className={`font-bold flex items-center gap-1 ${tx.type === "income" ? "text-[#7AC143]" : "text-[#E60012]"
                            }`}>
                            {tx.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            LKR {formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="nintendo-card p-6">
                <div className="mb-3">
                  <h4 className="font-bold text-lg text-gray-900">Expense Breakdown</h4>
                  <p className="text-xs text-gray-400 mt-0.5">By category</p>
                </div>
                {expenseCategories.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    No expenses recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%" cy="44%"
                        innerRadius={48} outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {pieChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name, props) => [
                          `LKR ${Number(val).toLocaleString()} (${props.payload.percentage}%)`,
                          name,
                        ]}
                        contentStyle={{ borderRadius: 10, fontSize: 13, border: "1px solid #eee" }}
                      />
                      <Legend
                        iconType="circle" iconSize={8}
                        formatter={v => <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="nintendo-card p-6">
                <h4 className="font-bold text-lg text-gray-900 mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Gross Profit Margin</span>
                    <span className="font-bold text-[#7AC143]">{profitMargin}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Income Entries</span>
                    <span className="font-bold text-gray-900">{transactions.filter(t => t.type === "income").length} records</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Expense Entries</span>
                    <span className="font-bold text-[#F5A623]">{transactions.filter(t => t.type === "expense").length} records</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Net Position</span>
                    <span className={`font-bold ${netProfit >= 0 ? "text-[#7AC143]" : "text-[#E60012]"}`}>LKR {formatCurrency(netProfit)}</span>
                  </div>
                </div>
              </div>

              <div className="nintendo-card p-6">
                <div className="mb-3">
                  <h4 className="font-bold text-lg text-gray-900">7-Day Revenue</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Daily sales this week</p>
                </div>
                {weeklyTrend.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                    No sales data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={weeklyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        formatter={val => [`LKR ${Number(val).toLocaleString()}`, "Revenue"]}
                        contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #eee" }}
                      />
                      <Bar dataKey="revenue" fill="#7AC143" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Transaction" size="md">
          <div className="space-y-5">
            <div className="flex gap-3">
              <button
                onClick={() => setFormData({ ...formData, type: "income" })}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.type === "income"
                  ? "bg-[#7AC143] text-white"
                  : "bg-gray-100 text-gray-600"
                  }`}
              >
                <ArrowUpRight className="w-5 h-5 inline mr-2" />
                Income
              </button>
              <button
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.type === "expense"
                  ? "bg-[#E60012] text-white"
                  : "bg-gray-100 text-gray-600"
                  }`}
              >
                <ArrowDownRight className="w-5 h-5 inline mr-2" />
                Expense
              </button>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Daily Sales Revenue"
                className="nintendo-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (LKR) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="nintendo-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="nintendo-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="nintendo-input"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="nintendo-input"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddTransaction}>
                <Save className="w-4 h-4 mr-2" /> Add Transaction
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Finance;
