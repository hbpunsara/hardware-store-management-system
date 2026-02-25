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
import { transactionService } from "../services/transactionService";

const categories = ["Sales", "Inventory", "Utilities", "Payroll", "Rent", "Maintenance", "Marketing", "Other"];
const paymentMethods = ["Cash", "Card", "Bank Transfer", "Cheque", "Mobile Payment"];

export const Finance = () => {
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [transactions, setTransactions] = useState([]);
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
      const data = await transactionService.getAll();
      setTransactions(data);
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

  const financeStats = [
    { label: "Total Revenue", value: `LKR ${formatCurrency(totalIncome)}`, change: "+12.5%", trend: "up", icon: TrendingUp, color: "bg-[#7AC143]" },
    { label: "Total Expenses", value: `LKR ${formatCurrency(totalExpense)}`, change: "-8.2%", trend: "down", icon: TrendingDown, color: "bg-[#E60012]" },
    { label: "Net Profit", value: `LKR ${formatCurrency(netProfit)}`, change: "+18.4%", trend: "up", icon: Wallet, color: "bg-[#0AB5CD]" },
    { label: "Transactions", value: transactions.length.toString(), change: "+5.1%", trend: "up", icon: PiggyBank, color: "bg-[#F5A623]" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Finance Management" />
        
        <div className="p-6 space-y-6">
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
              <Button variant="secondary" onClick={() => toast.success("Exporting financial report...")}>
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
                    <span className={`nintendo-badge flex items-center gap-1 ${
                      stat.trend === "up" ? "nintendo-badge-success" : "nintendo-badge-danger"
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

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="nintendo-card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-xl text-gray-900">Recent Transactions</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterType("all")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        filterType === "all" ? "bg-[#E60012] text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterType("income")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        filterType === "income" ? "bg-[#7AC143] text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Income
                    </button>
                    <button
                      onClick={() => setFilterType("expense")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        filterType === "expense" ? "bg-[#E60012] text-white" : "bg-gray-100 text-gray-600"
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
                          <span className={`font-bold flex items-center gap-1 ${
                            tx.type === "income" ? "text-[#7AC143]" : "text-[#E60012]"
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
                <h4 className="font-bold text-lg text-gray-900 mb-4">Expense Breakdown</h4>
                <div className="space-y-4">
                  {expenseCategories.length === 0 ? (
                    <p className="text-gray-500 text-sm">No expenses recorded yet</p>
                  ) : expenseCategories.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">{cat.name}</span>
                        <span className="text-sm font-bold text-gray-900">{cat.percentage}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">LKR {formatCurrency(cat.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nintendo-card p-6">
                <h4 className="font-bold text-lg text-gray-900 mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Gross Profit Margin</span>
                    <span className="font-bold text-[#7AC143]">24.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Monthly Target</span>
                    <span className="font-bold text-gray-900">78% achieved</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Pending Payments</span>
                    <span className="font-bold text-[#F5A623]">LKR 45,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Accounts Receivable</span>
                    <span className="font-bold text-[#0AB5CD]">LKR 125,000</span>
                  </div>
                </div>
              </div>

              <div className="nintendo-card p-6">
                <h4 className="font-bold text-lg text-gray-900 mb-4">Cash Flow Summary</h4>
                <div className="flex items-end justify-between gap-2 h-32">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const incomeHeights = [45, 62, 38, 75, 55, 85, 48];
                    const expenseHeights = [30, 45, 28, 55, 40, 60, 35];
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col gap-1">
                          <div 
                            className="w-full bg-[#7AC143] rounded-t"
                            style={{ height: `${incomeHeights[i]}%` }}
                          />
                          <div 
                            className="w-full bg-[#E60012] rounded-b"
                            style={{ height: `${expenseHeights[i]}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#7AC143] rounded" />
                    <span className="text-xs text-gray-600">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#E60012] rounded" />
                    <span className="text-xs text-gray-600">Expenses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Transaction" size="md">
          <div className="space-y-5">
            <div className="flex gap-3">
              <button
                onClick={() => setFormData({...formData, type: "income"})}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  formData.type === "income" 
                    ? "bg-[#7AC143] text-white" 
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <ArrowUpRight className="w-5 h-5 inline mr-2" />
                Income
              </button>
              <button
                onClick={() => setFormData({...formData, type: "expense"})}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  formData.type === "expense" 
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
                onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  className="nintendo-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="nintendo-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
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
