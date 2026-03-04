import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { DollarSign, TrendingUp, ShoppingCart, CreditCard, Calendar, Download, Eye, X } from "lucide-react";
import salesService from "../services/salesService";

export const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalTransactions: 0, averageTransaction: 0 });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [salesData, summaryData] = await Promise.all([
          salesService.getAll(),
          salesService.getTodaySummary(),
        ]);
        setSales(salesData);
        setFilteredSales(salesData);
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to load sales:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const applyDateFilter = (filter) => {
    setDateFilter(filter);
    const now = new Date();
    let filtered = sales;
    if (filter === "today") {
      filtered = sales.filter(s => {
        const date = new Date(s.createdAt);
        return date.toDateString() === now.toDateString();
      });
    } else if (filter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = sales.filter(s => new Date(s.createdAt) >= weekAgo);
    } else if (filter === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = sales.filter(s => new Date(s.createdAt) >= monthAgo);
    }
    setFilteredSales(filtered);
  };

  const handleExport = () => {
    try {
      const headers = ["Invoice ID", "Date", "Time", "Items", "Total", "Payment Method"];
      const rows = filteredSales.map(s => [
        `INV-${s.id}`,
        s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-",
        s.createdAt ? new Date(s.createdAt).toLocaleTimeString() : "-",
        s.items?.length || 0,
        s.total || 0,
        s.paymentMethod || "cash"
      ]);
      const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Sales report exported successfully!");
    } catch (err) {
      toast.error("Failed to export report");
    }
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

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
              <Button
                variant={dateFilter === "today" ? "primary" : "secondary"}
                onClick={() => applyDateFilter("today")}
              >
                <Calendar className="w-4 h-4 mr-2" /> Today
              </Button>
              <Button
                variant={dateFilter === "week" ? "primary" : "secondary"}
                onClick={() => applyDateFilter("week")}
              >
                This Week
              </Button>
              <Button
                variant={dateFilter === "month" ? "primary" : "secondary"}
                onClick={() => applyDateFilter("month")}
              >
                This Month
              </Button>
              {dateFilter !== "all" && (
                <Button variant="secondary" onClick={() => applyDateFilter("all")}>
                  <X className="w-4 h-4 mr-1" /> Clear Filter
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export Report
            </Button>
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
              <h3 className="font-bold text-xl text-gray-900">
                Transactions {dateFilter !== "all" && <span className="text-sm text-[#E60012] ml-2">({filteredSales.length} results)</span>}
              </h3>
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
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">No transactions found for this period.</td>
                    </tr>
                  ) : filteredSales.map((sale) => (
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
                        <button
                          onClick={() => handleViewSale(sale)}
                          className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-[#E60012] hover:text-white transition-colors group"
                          title="View Sale Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600 group-hover:text-white" />
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

      {/* Sale Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Invoice INV-${selectedSale?.id}`} size="md">
        {selectedSale && (
          <div className="space-y-5">
            <div className="flex justify-between items-start p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-bold text-gray-900">
                  {selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleString() : "-"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Payment Method</p>
                <span className="nintendo-badge nintendo-badge-info capitalize">
                  {selectedSale.paymentMethod || "cash"}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Items Purchased</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-semibold text-gray-700">Product</th>
                      <th className="p-3 font-semibold text-gray-700 text-right">Qty</th>
                      <th className="p-3 font-semibold text-gray-700 text-right">Price</th>
                      <th className="p-3 font-semibold text-gray-700 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSale.items?.length > 0 ? selectedSale.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-3 text-gray-900">{item.productName || `Product #${item.productId}`}</td>
                        <td className="p-3 text-right text-gray-600">{item.quantity}</td>
                        <td className="p-3 text-right text-gray-600">LKR {formatCurrency(item.price)}</td>
                        <td className="p-3 text-right font-medium text-gray-900">
                          LKR {formatCurrency(item.quantity * item.price)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">No item details available</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    {selectedSale.discount > 0 && (
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-[#E60012] font-medium">Discount</td>
                        <td className="p-3 text-right text-[#E60012] font-medium">-LKR {formatCurrency(selectedSale.discount)}</td>
                      </tr>
                    )}
                    {selectedSale.tax > 0 && (
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-gray-600 font-medium">Tax</td>
                        <td className="p-3 text-right text-gray-600 font-medium">LKR {formatCurrency(selectedSale.tax)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-bold text-gray-900">Total</td>
                      <td className="p-3 text-right font-extrabold text-[#E60012] text-lg">
                        LKR {formatCurrency(selectedSale.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sales;
