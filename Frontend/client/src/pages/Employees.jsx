import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import {
  UserPlus,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  LogIn,
  LogOut,
  Timer,
  TrendingUp,
  Save,
  Trash2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { employeeService } from "../services/employeeService";

const roles = ["Cashier", "Stock Manager", "Supervisor", "Accountant", "Sales Associate"];
const departments = ["Sales", "Inventory", "Management", "Finance"];

export const Employees = () => {
  const [view, setView] = useState("attendance");
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickCheckId, setQuickCheckId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [formData, setFormData] = useState({
    name: "",
    role: "Cashier",
    department: "Sales"
  });
  const toast = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCheckIn = async (employee) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    try {
      await employeeService.update(employee.id, {
        status: "Present",
        checkIn: timeStr,
        hours: "0h 0m"
      });
      await fetchEmployees();
      toast.success(`${employee.name} checked in at ${timeStr}`);
    } catch (err) {
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async (employee) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    try {
      await employeeService.update(employee.id, {
        checkOut: timeStr
      });
      await fetchEmployees();
      toast.success(`${employee.name} checked out at ${timeStr}`);
    } catch (err) {
      toast.error("Failed to check out");
    }
  };

  const handleQuickCheck = (type) => {
    if (!quickCheckId) {
      toast.error("Please enter an employee ID or name");
      return;
    }
    const emp = employees.find(e =>
      String(e.id) === quickCheckId ||
      e.name.toLowerCase().includes(quickCheckId.toLowerCase())
    );
    if (!emp) {
      toast.error("Employee not found");
      return;
    }
    if (type === "in") {
      handleCheckIn(emp);
    } else {
      handleCheckOut(emp);
    }
    setQuickCheckId("");
  };

  const handleAddEmployee = async () => {
    if (!formData.name) {
      toast.error("Please enter employee name");
      return;
    }
    try {
      await employeeService.create({
        name: formData.name,
        role: formData.role,
        department: formData.department
      });
      await fetchEmployees();
      setShowAddModal(false);
      setFormData({ name: "", role: "Cashier", department: "Sales" });
      toast.success("Employee added successfully!");
    } catch (err) {
      toast.error("Failed to add employee");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await employeeService.delete(deleteTarget.id);
      await fetchEmployees();
      toast.success(`${deleteTarget.name} deleted successfully.`);
    } catch {
      toast.error("Failed to delete employee");
    } finally {
      setDeleteTarget(null);
    }
  };

  const attendanceStats = [
    { label: "Present Today", value: employees.filter(e => e.status === "Present").length.toString(), total: employees.length.toString(), icon: CheckCircle, color: "bg-[#7AC143]" },
    { label: "Absent", value: employees.filter(e => e.status === "Absent").length.toString(), total: employees.length.toString(), icon: XCircle, color: "bg-[#E60012]" },
    { label: "On Leave", value: employees.filter(e => e.status === "On Leave").length.toString(), total: employees.length.toString(), icon: Calendar, color: "bg-[#F5A623]" },
    { label: "Late Arrivals", value: employees.filter(e => e.status === "Present" && e.checkIn && e.checkIn > "09:00").length.toString(), total: employees.filter(e => e.status === "Present").length.toString(), icon: Timer, color: "bg-[#0AB5CD]" },
  ];

  const presentCount = employees.filter(e => e.status === "Present").length;
  const attendanceRate = employees.length > 0 ? Math.round((presentCount / employees.length) * 100) : 0;
  const checkedInEmployees = employees.filter(e => e.checkIn && e.checkIn !== "-");
  const avgCheckIn = checkedInEmployees.length > 0 ? checkedInEmployees[0].checkIn : "—";

  const recentActivity = employees
    .filter(e => e.status === "Present" && e.checkIn && e.checkIn !== "-")
    .map(e => ({ name: e.name, action: e.checkOut && e.checkOut !== "-" ? "Checked Out" : "Checked In", time: e.checkIn, type: e.checkOut && e.checkOut !== "-" ? "out" : "in" }))
    .slice(0, 5);

  const filteredEmployees = employees.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && e.status === "Present") ||
      (statusFilter === "Inactive" && (e.status === "Absent" || e.status === "On Leave"));
    return matchesSearch && matchesStatus;
  });

  // Build chart data: parse "Xh Ym" hours string → decimal hours
  const parseHours = (hoursStr) => {
    if (!hoursStr || hoursStr === "-") return 0;
    const hMatch = hoursStr.match(/(\d+)h/);
    const mMatch = hoursStr.match(/(\d+)m/);
    return (hMatch ? parseInt(hMatch[1]) : 0) + (mMatch ? parseInt(mMatch[1]) / 60 : 0);
  };

  const chartData = employees.map(e => ({
    name: e.name.split(" ")[0],
    hours: parseFloat(parseHours(e.hours).toFixed(2)),
    status: e.status,
  }));

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Employee Attendance" />

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => setView("attendance")}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${view === "attendance" ? "bg-[#E60012] text-white shadow-lg" : "bg-white text-gray-700"
                  }`}
              >
                Today's Attendance
              </button>
              <button
                onClick={() => setView("employees")}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${view === "employees" ? "bg-[#E60012] text-white shadow-lg" : "bg-white text-gray-700"
                  }`}
              >
                All Employees
              </button>
              <button
                onClick={() => setView("history")}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${view === "history" ? "bg-[#E60012] text-white shadow-lg" : "bg-white text-gray-700"
                  }`}
              >
                Attendance History
              </button>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => {
                try {
                  const headers = ["ID", "Name", "Role", "Department", "Status", "Check In", "Check Out", "Hours"];
                  const rows = employees.map(e => [e.id, e.name, e.role, e.department, e.status, e.checkIn || "-", e.checkOut || "-", e.hours || "-"]);
                  const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Attendance report exported!");
                } catch (err) {
                  toast.error("Failed to export");
                }
              }}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Add Employee
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {attendanceStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="nintendo-stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">of {stat.total}</span>
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                  <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="nintendo-card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-xl text-gray-900">Employee Status</h3>
                  <div className="flex gap-3 items-center">
                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="nintendo-input py-2 pr-8 text-sm font-semibold"
                    >
                      <option value="All">All</option>
                      <option value="Active">Active (Present)</option>
                      <option value="Inactive">Inactive (Absent/Leave)</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="nintendo-input pl-12 w-56 py-2"
                      />
                    </div>
                  </div>
                </div>
                <table className="nintendo-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Hours</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-500">No employees yet. Add one to get started.</td></tr>
                    ) : filteredEmployees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#E60012] to-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {emp.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{emp.name}</p>
                              <p className="text-xs text-gray-500">{emp.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-gray-600">{emp.role}</td>
                        <td>
                          <span className={`nintendo-badge ${emp.status === "Present" ? "nintendo-badge-success" :
                            emp.status === "Absent" ? "nintendo-badge-danger" :
                              "nintendo-badge-warning"
                            }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="font-medium text-gray-900">{emp.checkIn}</td>
                        <td className="text-gray-600">{emp.checkOut}</td>
                        <td className="font-bold text-gray-900">{emp.hours}</td>
                        <td>
                          <div className="flex gap-2">
                            {emp.status === "Present" && emp.checkOut === "-" ? (
                              <Button variant="secondary" size="sm" onClick={() => handleCheckOut(emp)}>
                                <LogOut className="w-4 h-4 mr-1" /> Check Out
                              </Button>
                            ) : emp.status === "Absent" ? (
                              <Button size="sm" onClick={() => handleCheckIn(emp)}>
                                <LogIn className="w-4 h-4 mr-1" /> Check In
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(emp)}
                              className="text-red-500 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="nintendo-card p-5">
                <h3 className="font-bold text-xl text-gray-900 mb-4">Quick Check-In</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Employee ID / Name</label>
                    <input
                      type="text"
                      placeholder="Enter ID or name..."
                      value={quickCheckId}
                      onChange={(e) => setQuickCheckId(e.target.value)}
                      className="nintendo-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full" onClick={() => handleQuickCheck("in")}>
                      <LogIn className="w-4 h-4 mr-2" /> Check In
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => handleQuickCheck("out")}>
                      <LogOut className="w-4 h-4 mr-2" /> Check Out
                    </Button>
                  </div>
                </div>
              </div>

              <div className="nintendo-card p-5">
                <h3 className="font-bold text-xl text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.type === "in" ? "bg-[#7AC143]/10" : "bg-[#E60012]/10"
                        }`}>
                        {activity.type === "in" ? (
                          <LogIn className="w-5 h-5 text-[#7AC143]" />
                        ) : (
                          <LogOut className="w-5 h-5 text-[#E60012]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{activity.name}</p>
                        <p className="text-xs text-gray-500">{activity.action}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nintendo-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-gray-900">Today's Summary</h3>
                  <TrendingUp className="w-5 h-5 text-[#7AC143]" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">First Check-in</span>
                    <span className="font-bold text-gray-900">{avgCheckIn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Currently Present</span>
                    <span className="font-bold text-gray-900">{presentCount} / {employees.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Attendance Rate</span>
                    <span className={`font-bold ${attendanceRate >= 80 ? "text-[#7AC143]" : "text-[#E60012]"}`}>{attendanceRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Attendance Overview Bar Chart ────────────────────────────── */}
          <div className="nintendo-card p-6">
            <div className="mb-5">
              <h3 className="font-bold text-xl text-gray-900">Attendance Overview</h3>
              <p className="text-sm text-gray-400 mt-0.5">Hours worked today per employee</p>
            </div>
            {employees.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No employee data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: 600, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    label={{ value: "Hours", angle: -90, position: "insideLeft", offset: 8, style: { fontSize: 11, fill: "#9CA3AF" } }}
                  />
                  <Tooltip
                    formatter={(val, _name, props) => [
                      `${val}h`,
                      props.payload.status,
                    ]}
                    labelFormatter={label => `Employee: ${label}`}
                    contentStyle={{ borderRadius: 10, fontSize: 13, border: "1px solid #eee" }}
                  />
                  <Bar dataKey="hours" name="Hours Worked" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.status === "Present" ? "#7AC143"
                          : entry.status === "On Leave" ? "#F5A623"
                          : "#E60012"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center gap-6 mt-3 justify-center">
              {[["#7AC143","Present"],["#F5A623","On Leave"],["#E60012","Absent"]].map(([color, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Perera"
                className="nintendo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="nintendo-input"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="nintendo-input"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddEmployee}>
                <Save className="w-4 h-4 mr-2" /> Add Employee
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete confirmation modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Employee"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-gray-900">{deleteTarget?.name}</span>?{" "}
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Employees;
