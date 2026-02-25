import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { 
  DollarSign, ShoppingCart, Package, Users, AlertTriangle, ArrowUpRight, Activity
} from "lucide-react";
import salesService from "../services/salesService";
import productService from "../services/productService";

export const Dashboard = () => {
  const [summary, setSummary] = useState({ totalSales: 0, totalTransactions: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [summaryData, salesData, productsData] = await Promise.all([
          salesService.getTodaySummary(),
          salesService.getAll(),
          productService.getAll(),
        ]);
        setSummary(summaryData);
        setRecentSales(salesData.slice(0, 5));
        setLowStockItems(productsData.filter(p => p.stock <= 10).slice(0, 4));
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK').format(amount ?? 0);

  const stats = [
    { title: "Today's Revenue", value: `LKR ${formatCurrency(summary.totalSales)}`, change: "", trend: "up", icon: DollarSign, color: "bg-[#E60012]" },
    { title: "Transactions", value: String(summary.totalTransactions), change: "", trend: "up", icon: ShoppingCart, color: "bg-[#0AB5CD]" },
    { title: "Products Sold", value: recentSales.reduce((s, r) => s + (r.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0), change: "", trend: "up", icon: Package, color: "bg-[#7AC143]" },
    { title: "Low Stock Alerts", value: String(lowStockItems.length), change: "", trend: "up", icon: Users, color: "bg-[#F5A623]" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Dashboard" showSearch />
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="nintendo-stat-card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {stat.change && (
                      <span className="nintendo-badge flex items-center gap-1 nintendo-badge-success">
                        <ArrowUpRight className="w-3 h-3" />{stat.change}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                  <span className="text-sm text-gray-500 font-medium">{stat.title}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 nintendo-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-xl text-gray-900">Recent Sales</h3>
                <a href="/sales" className="text-sm font-bold text-[#E60012] hover:underline">View All</a>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading...</div>
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
                        <td className="font-bold text-[#E60012]">INV-{sale.id}</td>
                        <td className="text-gray-600">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString() : "-"}
                        </td>
                        <td className="text-gray-600">{sale.items?.length || 0} items</td>
                        <td className="font-bold text-gray-900">LKR {formatCurrency(sale.total)}</td>
                        <td><span className="nintendo-badge nintendo-badge-success">Completed</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="space-y-6">
              <div className="nintendo-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-900">Low Stock Alert</h3>
                  <AlertTriangle className="w-5 h-5 text-[#E60012]" />
                </div>
                {loading ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
                ) : lowStockItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">All products well stocked</p>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">Threshold: 10</p>
                        </div>
                        <span className={`nintendo-badge ${item.stock <= 5 ? "nintendo-badge-danger" : "nintendo-badge-warning"}`}>
                          {item.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
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
