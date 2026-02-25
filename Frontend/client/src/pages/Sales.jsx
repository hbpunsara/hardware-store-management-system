import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { DollarSign, TrendingUp, ShoppingCart, CreditCard, Calendar, Download, Eye } from "lucide-react";
import salesService from "../services/salesService";

export const Sales = () => {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalTransactions: 0, averageTransaction: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [salesData, summaryData] = await Promise.all([
          salesService.getAll(),
          salesService.getTodaySummary(),
        ]);
        setSales(salesData);
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to load sales:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK').format(amount ?? 0);

  const stats = [
    { title: "Today's Revenue", value: `LKR ${formatCurrency(summary.totalSales)}`, change: "", icon: DollarSign, color: "bg-[#E60012]" },
    { title: "Total Transactions", value: String(summary.totalTransactions), change: "", icon: ShoppingCart, color: "bg-[#0AB5CD]" },
    { title: "Avg. Transaction", value: `LKR ${formatCurrency(summary.averageTransaction)}`, change: "", icon: TrendingUp, color: "bg-[#7AC143]" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Sales & Finance" showSearch />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Button variant="secondary"><Calendar className="w-4 h-4 mr-2" /> Today</Button>
            </div>
            <Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="nintendo-stat-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                  <span className="text-sm text-gray-500 font-medium">{stat.title}</span>
                </div>
              );
            })}
          </div>

          <div className="nintendo-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-gray-900">Recent Transactions</h3>
            </div>
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading...</div>
            ) : (
              <table className="nintendo-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date & Time</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-bold text-[#E60012]">INV-{sale.id}</td>
                      <td>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "-"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString() : ""}
                          </p>
                        </div>
                      </td>
                      <td className="text-gray-600">{sale.items?.length || 0} items</td>
                      <td className="font-bold text-gray-900">LKR {formatCurrency(sale.total)}</td>
                      <td>
                        <span className="nintendo-badge nintendo-badge-info">
                          {sale.paymentMethod || "cash"}
                        </span>
                      </td>
                      <td>
                        <button className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sales;
