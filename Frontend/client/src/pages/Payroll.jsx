import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import {
  DollarSign,
  Users,
  Calendar,
  FileText,
  Download,
  Send,
  Calculator,
  TrendingUp,
  Clock,
  Plus,
  Minus,
  Eye,
  Printer,
  X,
  Check
} from "lucide-react";
import payrollService from "../services/payrollService";



export const Payroll = () => {
  const [selectedMonth, setSelectedMonth] = useState("January 2024");
  const [payrollData, setPayrollData] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getAll(selectedMonth);
      setPayrollData(data);
    } catch (err) {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrolls();
  }, [selectedMonth]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK').format(amount);
  };

  const handleProcessPayroll = async () => {
    try {
      await payrollService.processAll(selectedMonth);
      await loadPayrolls();
      toast.success("Payroll processed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to process payroll");
    }
  };

  const handleCalculateAll = async () => {
    try {
      toast.success("Calculating all salaries...");
      await payrollService.calculateAll(selectedMonth);
      await loadPayrolls();
      toast.info("All salaries calculated!");
    } catch (err) {
      toast.error(err.message || "Failed to calculate payrolls");
    }
  };

  const handleViewPayslip = (employee) => {
    setSelectedEmployee(employee);
    setShowPayslipModal(true);
  };

  const handlePrintPayslip = (employee) => {
    toast.success(`Printing payslip for ${employee.name}...`);
  };

  const handleGenerateSalarySlips = () => {
    toast.success("Generating salary slips for all employees...");
  };

  const handleDownloadBankFile = () => {
    toast.success("Downloading bank transfer file...");
  };

  const handleEmailPayslips = () => {
    toast.success("Sending payslips to all employees via email...");
  };

  const payrollStats = [
    { label: "Total Payroll", value: `LKR ${formatCurrency(payrollData.reduce((sum, e) => sum + e.netSalary, 0))}`, change: "+5.2%", icon: DollarSign, color: "bg-[#E60012]" },
    { label: "Total Employees", value: payrollData.length.toString(), change: "+2", icon: Users, color: "bg-[#0AB5CD]" },
    { label: "Processed", value: payrollData.filter(e => e.status === "Processed").length.toString(), change: `${Math.round(payrollData.filter(e => e.status === "Processed").length / payrollData.length * 100)}%`, icon: FileText, color: "bg-[#7AC143]" },
    { label: "Pending", value: payrollData.filter(e => e.status === "Pending").length.toString(), change: `${Math.round(payrollData.filter(e => e.status === "Pending").length / payrollData.length * 100)}%`, icon: Clock, color: "bg-[#F5A623]" },
  ];

  const totalBaseSalary = payrollData.reduce((sum, e) => sum + e.baseSalary, 0);
  const totalOvertime = payrollData.reduce((sum, e) => sum + e.overtime, 0);
  const totalAllowances = payrollData.reduce((sum, e) => sum + e.allowances, 0);
  const totalDeductions = payrollData.reduce((sum, e) => sum + e.deductions, 0);
  const totalNetPayroll = payrollData.reduce((sum, e) => sum + e.netSalary, 0);

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Payroll Management" />

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3 items-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="nintendo-input w-48 py-2"
              >
                <option>January 2024</option>
                <option>December 2023</option>
                <option>November 2023</option>
              </select>
              <Button variant="secondary" onClick={() => toast.info("Select a custom date range")}>
                <Calendar className="w-4 h-4 mr-2" /> Select Period
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCalculateAll}>
                <Calculator className="w-4 h-4 mr-2" /> Calculate All
              </Button>
              <Button variant="secondary" onClick={() => toast.success("Exporting payroll data...")}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button onClick={handleProcessPayroll}>
                <Send className="w-4 h-4 mr-2" /> Process Payroll
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {payrollStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="nintendo-stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="nintendo-badge nintendo-badge-success flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                  <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                </div>
              );
            })}
          </div>

          <div className="nintendo-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-gray-900">Payroll for {selectedMonth}</h3>
              <div className="flex gap-2">
                <span className="nintendo-badge nintendo-badge-success">{payrollData.filter(e => e.status === "Processed").length} Processed</span>
                <span className="nintendo-badge nintendo-badge-warning">{payrollData.filter(e => e.status === "Pending").length} Pending</span>
              </div>
            </div>
            <table className="nintendo-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Days Worked</th>
                  <th>Base Salary</th>
                  <th>Overtime</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading payroll data...</td></tr>
                ) : payrollData.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">No payroll created for this month yet. Use <span className="font-bold text-[#7AC143]">Calculate All</span> to generate.</td></tr>
                ) : payrollData.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#E60012] to-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-gray-900">{emp.daysWorked} days</td>
                    <td className="text-gray-600">LKR {formatCurrency(emp.baseSalary)}</td>
                    <td>
                      <span className="text-[#7AC143] font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        {formatCurrency(emp.overtime)}
                      </span>
                    </td>
                    <td>
                      <span className="text-[#0AB5CD] font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        {formatCurrency(emp.allowances)}
                      </span>
                    </td>
                    <td>
                      <span className="text-[#E60012] font-medium flex items-center gap-1">
                        <Minus className="w-3 h-3" />
                        {formatCurrency(emp.deductions)}
                      </span>
                    </td>
                    <td className="font-extrabold text-gray-900">LKR {formatCurrency(emp.netSalary)}</td>
                    <td>
                      <span className={`nintendo-badge ${emp.status === "Processed" ? "nintendo-badge-success" : "nintendo-badge-warning"
                        }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewPayslip(emp)}
                          className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handlePrintPayslip(emp)}
                          className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Printer className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="nintendo-card p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-4">Salary Breakdown</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Base Salaries</span>
                  <span className="font-bold text-gray-900">LKR {formatCurrency(totalBaseSalary)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Overtime</span>
                  <span className="font-bold text-[#7AC143]">+ LKR {formatCurrency(totalOvertime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Allowances</span>
                  <span className="font-bold text-[#0AB5CD]">+ LKR {formatCurrency(totalAllowances)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Deductions</span>
                  <span className="font-bold text-[#E60012]">- LKR {formatCurrency(totalDeductions)}</span>
                </div>
                <div className="border-t-2 border-gray-100 pt-4 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Net Payroll</span>
                  <span className="text-2xl font-extrabold text-[#E60012]">LKR {formatCurrency(totalNetPayroll)}</span>
                </div>
              </div>
            </div>

            <div className="nintendo-card p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-4">Deduction Types</h4>
              <div className="space-y-3">
                {[
                  { type: "EPF (8%)", amount: 18000, color: "bg-[#E60012]" },
                  { type: "ETF (3%)", amount: 8500, color: "bg-[#F5A623]" },
                  { type: "Tax", amount: 5500, color: "bg-[#9B59B6]" },
                  { type: "Advances", amount: 3000, color: "bg-[#0AB5CD]" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="flex-1 text-gray-600">{item.type}</span>
                    <span className="font-bold text-gray-900">LKR {formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="nintendo-card p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="secondary" onClick={handleGenerateSalarySlips}>
                  <FileText className="w-5 h-5 mr-3" /> Generate Salary Slips
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={handleDownloadBankFile}>
                  <Download className="w-5 h-5 mr-3" /> Download Bank File
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={() => setShowCalculatorModal(true)}>
                  <Calculator className="w-5 h-5 mr-3" /> Bulk Salary Adjustment
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={handleEmailPayslips}>
                  <Send className="w-5 h-5 mr-3" /> Email Payslips
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={showPayslipModal} onClose={() => setShowPayslipModal(false)} title="Payslip Preview" size="lg">
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="text-center border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-bold text-gray-900">Hardware Pro Store</h3>
                <p className="text-gray-500">Payslip for {selectedMonth}</p>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">{selectedEmployee.name}</p>
                  <p className="text-gray-500">{selectedEmployee.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-bold text-gray-900">EMP-{String(selectedEmployee.id).padStart(4, '0')}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Worked</span>
                  <span className="font-bold">{selectedEmployee.daysWorked} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Salary</span>
                  <span className="font-bold">LKR {formatCurrency(selectedEmployee.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-[#7AC143]">
                  <span>Overtime</span>
                  <span className="font-bold">+ LKR {formatCurrency(selectedEmployee.overtime)}</span>
                </div>
                <div className="flex justify-between text-[#0AB5CD]">
                  <span>Allowances</span>
                  <span className="font-bold">+ LKR {formatCurrency(selectedEmployee.allowances)}</span>
                </div>
                <div className="flex justify-between text-[#E60012]">
                  <span>Deductions</span>
                  <span className="font-bold">- LKR {formatCurrency(selectedEmployee.deductions)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Net Salary</span>
                  <span className="text-xl font-extrabold text-[#E60012]">LKR {formatCurrency(selectedEmployee.netSalary)}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowPayslipModal(false)}>Close</Button>
                <Button onClick={() => { handlePrintPayslip(selectedEmployee); setShowPayslipModal(false); }}>
                  <Printer className="w-4 h-4 mr-2" /> Print Payslip
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={showCalculatorModal} onClose={() => setShowCalculatorModal(false)} title="Bulk Salary Adjustment">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Adjustment Type</label>
              <select className="nintendo-input">
                <option>Increase All Salaries</option>
                <option>Decrease All Salaries</option>
                <option>Add Bonus</option>
                <option>Add Deduction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Amount / Percentage</label>
              <div className="flex gap-3">
                <input type="number" placeholder="Enter value" className="nintendo-input" />
                <select className="nintendo-input w-32">
                  <option>LKR</option>
                  <option>%</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Apply To</label>
              <select className="nintendo-input">
                <option>All Employees</option>
                <option>Cashiers Only</option>
                <option>Supervisors Only</option>
                <option>Custom Selection</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowCalculatorModal(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Adjustment applied!"); setShowCalculatorModal(false); }}>
                <Check className="w-4 h-4 mr-2" /> Apply Adjustment
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Payroll;
