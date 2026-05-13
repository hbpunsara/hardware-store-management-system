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
  Check,
  Edit,
  Save,
  Settings,
  RefreshCw
} from "lucide-react";
import payrollService from "../services/payrollService";
import { storeService } from "../services/storeService";
import { PayrollSetupWizard } from "../components/PayrollSetupWizard";



// Generate last 12 months dynamically
const getMonthOptions = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  }
  return months;
};

export const Payroll = () => {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [payrollData, setPayrollData] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSalaryConfigModal, setShowSalaryConfigModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [salaryConfig, setSalaryConfig] = useState(null);
  const [newComp, setNewComp] = useState({ name: '', type: 'Allowance', amountType: 'Fixed', value: 0 });
  const [editData, setEditData] = useState({
    baseSalary: 0,
    overtimeHours: 0,
    allowances: 0,
    otherDeductions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [setupComplete, setSetupComplete] = useState(null);
  const toast = useToast();

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      // First check if setup is complete
      const settings = await storeService.getAll();
      if (settings.payroll_setup_complete !== "true") {
        setSetupComplete(false);
        setLoading(false);
        return;
      }
      
      setSetupComplete(true);
      const data = await payrollService.getAll(selectedMonth);
      setPayrollData(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
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

  const handleProcessAll = async () => {
    try {
      await payrollService.processAll(selectedMonth);
      await loadPayrolls();
      toast.success("All payrolls processed successfully!");
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

  const handleEditClick = (emp) => {
    setSelectedPayroll(emp);
    setEditData({
      baseSalary: emp.baseSalary || 0,
      overtimeHours: 0,
      allowances: emp.allowances || 0,
      otherDeductions: emp.deductions || 0,
    });
    setShowEditModal(true);
  };

  const handleOpenSalaryConfig = async (emp) => {
    try {
      const config = await payrollService.getSalaryConfig(emp.employeeId);
      setSalaryConfig(config);
      setSelectedEmployee(emp);
      setShowSalaryConfigModal(true);
    } catch (err) {
      toast.error("Failed to load salary config");
    }
  };

  const handleSaveSalaryInfo = async () => {
    try {
      await payrollService.updateSalaryInfo(selectedEmployee.employeeId, {
        basicSalary: salaryConfig.basicSalary,
        bankName: salaryConfig.bankName,
        accountNumber: salaryConfig.accountNumber,
        nic: salaryConfig.nic,
      });
      toast.success("Salary info saved");
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  const handleAddComponent = async () => {
    if (!newComp.name || !newComp.value) return toast.error("Fill name & value");
    try {
      const comp = await payrollService.addSalaryComponent(selectedEmployee.employeeId, newComp);
      setSalaryConfig(prev => ({ ...prev, components: [...prev.components, comp] }));
      setNewComp({ name: '', type: 'Allowance', amountType: 'Fixed', value: 0 });
      toast.success("Component added");
    } catch (err) {
      toast.error("Failed to add");
    }
  };

  const handleDeleteComponent = async (compId) => {
    try {
      await payrollService.deleteSalaryComponent(compId);
      setSalaryConfig(prev => ({ ...prev, components: prev.components.filter(c => c.id !== compId) }));
      toast.success("Removed");
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  const handleRecalculate = async () => {
    try {
      await payrollService.deleteMonth(selectedMonth);
      await payrollService.calculateAll(selectedMonth);
      await loadPayrolls();
      toast.success("Payroll recalculated!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await payrollService.update(selectedPayroll.id, {
        baseSalary: editData.baseSalary,
        overtimeHours: editData.overtimeHours,
        allowances: editData.allowances,
        otherDeductions: editData.otherDeductions,
        status: selectedPayroll.status
      });
      toast.success("Payroll updated");
      setShowEditModal(false);
      await loadPayrolls();
    } catch (err) {
      toast.error(err.message || "Failed to update payroll");
    }
  };

  const handlePrintPayslip = (employee) => {
    const url = payrollService.getPayslipUrl(employee.id);
    window.open(url, '_blank');
    toast.success(`Opening payslip for ${employee.name}...`);
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

  const pCount = payrollData.filter(e => e.status === "Processed").length;
  const pendCount = payrollData.filter(e => e.status === "Pending").length;
  const pPct = payrollData.length > 0 ? Math.round(pCount / payrollData.length * 100) : 0;
  const pendPct = payrollData.length > 0 ? Math.round(pendCount / payrollData.length * 100) : 0;

  const payrollStats = [
    { label: "Total Payroll", value: `LKR ${formatCurrency(payrollData.reduce((sum, e) => sum + e.netSalary, 0))}`, change: `${payrollData.length} staff`, icon: DollarSign, color: "bg-[#E60012]" },
    { label: "Total Employees", value: payrollData.length.toString(), icon: Users, color: "bg-[#0AB5CD]" },
    { label: "Processed", value: pCount.toString(), change: `${pPct}%`, icon: FileText, color: "bg-[#7AC143]" },
    { label: "Pending", value: pendCount.toString(), change: `${pendPct}%`, icon: Clock, color: "bg-[#F5A623]" },
  ];

  const totalBaseSalary = payrollData.reduce((sum, e) => sum + e.baseSalary, 0);
  const totalOvertime = payrollData.reduce((sum, e) => sum + e.overtime, 0);
  const totalAllowances = payrollData.reduce((sum, e) => sum + e.allowances, 0);
  const totalDeductions = payrollData.reduce((sum, e) => sum + e.deductions, 0);
  const totalNetPayroll = payrollData.reduce((sum, e) => sum + e.netSalary, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      <Sidebar />
      
      {setupComplete === false ? (
        <PayrollSetupWizard onComplete={loadPayrolls} />
      ) : (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <Navbar title="Payroll Management" />

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="nintendo-input py-2.5 font-bold pr-10"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Status</span>
                <span className="text-xs font-extrabold text-[#7AC143]">Live Sync Active</span>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-xs text-gray-400 font-medium mr-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <Button variant="secondary" onClick={handleRecalculate}>
                <RefreshCw className="w-4 h-4 mr-2" /> Recalculate
              </Button>
              <Button variant="secondary" onClick={handleCalculateAll}>
                <Calculator className="w-4 h-4 mr-2" /> Calculate All
              </Button>
              <Button onClick={handleProcessAll}>
                <Check className="w-4 h-4 mr-2" /> Process All
              </Button>
              <Button variant="secondary" onClick={() => {
                try {
                  const headers = ["Name", "Role", "Days Worked", "Base Salary", "Overtime", "Allowances", "Deductions", "Net Salary", "Status"];
                  const rows = payrollData.map(e => [e.name, e.role, e.daysWorked, e.baseSalary, e.overtime, e.allowances, e.deductions, e.netSalary, e.status]);
                  const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `payroll-${selectedMonth.replace(/ /g, "-")}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Payroll data exported!");
                } catch (err) {
                  toast.error("Failed to export");
                }
              }}>
                <Download className="w-4 h-4 mr-2" /> Export
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
                      <div className="flex gap-1.5">
                        <button onClick={() => handleOpenSalaryConfig(emp)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors" title="Configure Salary">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditClick(emp)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors" title="Edit">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => handleViewPayslip(emp)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors" title="View">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => handlePrintPayslip(emp)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors" title="Print">
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
              <h4 className="font-bold text-lg text-gray-900 mb-4">Deduction Breakdown</h4>
              <div className="space-y-3">
                {(() => {
                  const allComponents = payrollData.flatMap(p => p.components || []);
                  const grouped = {};
                  allComponents.forEach(c => {
                    if (!grouped[c.name]) grouped[c.name] = 0;
                    grouped[c.name] += c.amount;
                  });
                  const entries = Object.entries(grouped);
                  const colors = ["bg-[#E60012]", "bg-[#F5A623]", "bg-[#9B59B6]", "bg-[#0AB5CD]", "bg-[#7AC143]", "bg-gray-400"];
                  return entries.length > 0 ? entries.map(([name, amount], i) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                      <span className="flex-1 text-gray-600">{name}</span>
                      <span className="font-bold text-gray-900">LKR {formatCurrency(amount)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400">No component data yet. Calculate payroll first.</p>
                  );
                })()}
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

        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Payroll Record">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Base Salary (LKR)</label>
                <input type="number" value={editData.baseSalary} onChange={(e) => setEditData({ ...editData, baseSalary: Number(e.target.value) })} className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Overtime Hours</label>
                <input type="number" value={editData.overtimeHours} onChange={(e) => setEditData({ ...editData, overtimeHours: Number(e.target.value) })} className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Allowances (LKR)</label>
                <input type="number" value={editData.allowances} onChange={(e) => setEditData({ ...editData, allowances: Number(e.target.value) })} className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Other Deductions (LKR)</label>
                <input type="number" value={editData.otherDeductions} onChange={(e) => setEditData({ ...editData, otherDeductions: Number(e.target.value) })} className="nintendo-input" />
              </div>
            </div>
            {/* Live Preview */}
            {editData.baseSalary > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <h4 className="font-bold text-gray-700 text-xs uppercase mb-2">Live Preview</h4>
                <div className="flex justify-between"><span className="text-gray-500">EPF (8%)</span><span className="font-bold text-[#E60012]">- LKR {formatCurrency(Math.round(editData.baseSalary * 0.08))}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Overtime Pay</span><span className="font-bold text-[#7AC143]">+ LKR {formatCurrency(Math.round((editData.baseSalary / 200) * 1.5 * editData.overtimeHours))}</span></div>
                <div className="border-t pt-2 flex justify-between"><span className="font-bold text-gray-900">Est. Net</span><span className="font-extrabold text-[#E60012]">LKR {formatCurrency(Math.round(editData.baseSalary + editData.allowances + ((editData.baseSalary / 200) * 1.5 * editData.overtimeHours) - (editData.baseSalary * 0.08) - editData.otherDeductions))}</span></div>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
            </div>
          </div>
        </Modal>

        {/* Salary Config Modal */}
        <Modal isOpen={showSalaryConfigModal} onClose={() => setShowSalaryConfigModal(false)} title={`Salary Config — ${selectedEmployee?.name || ''}`} size="lg">
          {salaryConfig && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Basic Salary (LKR)</label>
                  <input type="number" value={salaryConfig.basicSalary} onChange={(e) => setSalaryConfig({ ...salaryConfig, basicSalary: Number(e.target.value) })} className="nintendo-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">NIC</label>
                  <input type="text" value={salaryConfig.nic || ''} onChange={(e) => setSalaryConfig({ ...salaryConfig, nic: e.target.value })} className="nintendo-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bank Name</label>
                  <input type="text" value={salaryConfig.bankName || ''} onChange={(e) => setSalaryConfig({ ...salaryConfig, bankName: e.target.value })} className="nintendo-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Account Number</label>
                  <input type="text" value={salaryConfig.accountNumber || ''} onChange={(e) => setSalaryConfig({ ...salaryConfig, accountNumber: e.target.value })} className="nintendo-input" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={handleSaveSalaryInfo}><Save className="w-4 h-4 mr-2" /> Save Info</Button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Recurring Components</h4>
                {salaryConfig.components.length === 0 ? (
                  <p className="text-sm text-gray-400">No recurring allowances or deductions configured.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {salaryConfig.components.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.type === 'Allowance' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.type}</span>
                        <span className="flex-1 font-medium text-gray-900">{c.name}</span>
                        <span className="font-bold text-gray-700">{c.amountType === 'Percentage' ? `${c.value}%` : `LKR ${formatCurrency(c.value)}`}</span>
                        <button onClick={() => handleDeleteComponent(c.id)} className="w-7 h-7 bg-red-50 text-[#E60012] rounded-lg flex items-center justify-center hover:bg-red-100"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4">
                  <h5 className="font-bold text-sm text-gray-700 mb-3">Add Component</h5>
                  <div className="grid grid-cols-4 gap-2">
                    <input type="text" placeholder="Name" value={newComp.name} onChange={(e) => setNewComp({ ...newComp, name: e.target.value })} className="nintendo-input text-sm" />
                    <select value={newComp.type} onChange={(e) => setNewComp({ ...newComp, type: e.target.value })} className="nintendo-input text-sm">
                      <option value="Allowance">Allowance</option>
                      <option value="Deduction">Deduction</option>
                    </select>
                    <select value={newComp.amountType} onChange={(e) => setNewComp({ ...newComp, amountType: e.target.value })} className="nintendo-input text-sm">
                      <option value="Fixed">Fixed (LKR)</option>
                      <option value="Percentage">% of Base</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Value" value={newComp.value || ''} onChange={(e) => setNewComp({ ...newComp, value: Number(e.target.value) })} className="nintendo-input text-sm flex-1" />
                      <Button onClick={handleAddComponent} size="sm"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
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
      )}
    </div>
  );
};

export default Payroll;
