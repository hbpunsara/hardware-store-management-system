import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import {
  User,
  Store,
  Printer,
  Database,
  Cloud,
  Shield,
  Bell,
  Save,
  RefreshCw,
  Check,
  X,
  Plus,
  Lock
} from "lucide-react";
import { storeService } from "../services/storeService";
import { userService } from "../services/userService";
import { pricingTiersService } from "../services/pricingTiersService";
import { systemService } from "../services/systemService";

const settingsSections = [
  { id: "store", label: "Store Profile", icon: Store },
  { id: "users", label: "User Management", icon: User },
  { id: "pos", label: "POS Settings", icon: Printer },
  { id: "database", label: "Database & Backup", icon: Database },
  { id: "pricing", label: "Pricing Tiers", icon: Store },
  { id: "cloud", label: "Cloud Sync", icon: Cloud },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const roles = ["Administrator", "Cashier", "Inventory Manager", "Supervisor", "Accountant"];

export const Settings = () => {
  const [activeSection, setActiveSection] = useState("store");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "Cashier",
    password: ""
  });
  const [editUserFormData, setEditUserFormData] = useState({
    name: "",
    email: "",
    role: "Cashier"
  });
  const [storeData, setStoreData] = useState({
    logo: null,
    name: "Hardware Pro Store",
    address: "123 Main Street, Colombo",
    phone: "+94 11 234 5678",
    email: "info@hardwarepro.lk",
    taxId: "TAX-12345-LK",
    currency: "LKR",
    receiptHeader: "Hardware Pro Store - Your Trusted Partner",
    receiptFooter: "Thank you for shopping with us!",
    receiptPrintLogo: true,
    taxRate: "9",
    taxShowBreakdown: true,
    taxInclusive: false,
    printerDefault: "Thermal Receipt Printer (USB)",
    printerPaperSize: "80mm (Standard Receipt)",
    syncSales: true,
    syncInventory: true,
    syncEmployees: true,
    syncFinance: false,
    syncOfflineFallback: true,
    securitySessionTimeout: "30 minutes",
    securityPasswordPolicy: "Strong",
    notifyLowStock: true,
    notifyDailySales: true,
    notifyEmployeeLogin: false,
    notifyUpdates: true,
    notifyPayroll: true,
    databaseBackupFrequency: "Daily",
    databaseKeepBackups: "30 days",
  });
  const [storeLoading, setStoreLoading] = useState(true);

  const [pricingTiers, setPricingTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [tierValues, setTierValues] = useState({});
  const [syncStatus, setSyncStatus] = useState({ online: null, pendingSyncItems: 0, loading: true });
  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const toast = useToast();

  const fetchStoreSettings = async () => {
    try {
      setStoreLoading(true);
      const data = await storeService.getAll();
      setStoreData({
        logo: data.store_logo || null,
        name: data.store_name || "Hardware Pro Store",
        address: data.store_address || "123 Main Street, Colombo",
        phone: data.store_phone || "+94 11 234 5678",
        email: data.store_email || "info@hardwarepro.lk",
        taxId: data.store_tax_id || "TAX-12345-LK",
        currency: data.store_currency || "LKR",
        receiptHeader: data.receipt_header || "Hardware Pro Store - Your Trusted Partner",
        receiptFooter: data.receipt_footer || "Thank you for shopping with us!",
        receiptPrintLogo: data.receipt_print_logo !== "false",
        taxRate: data.tax_rate || "9",
        taxShowBreakdown: data.tax_show_breakdown !== "false",
        taxInclusive: data.tax_inclusive === "true",
        printerDefault: data.printer_default || "Thermal Receipt Printer (USB)",
        printerPaperSize: data.printer_paper_size || "80mm (Standard Receipt)",
        syncSales: data.sync_sales !== "false",
        syncInventory: data.sync_inventory !== "false",
        syncEmployees: data.sync_employees !== "false",
        syncFinance: data.sync_finance === "true",
        syncOfflineFallback: data.sync_offline_fallback !== "false",
        securitySessionTimeout: data.security_session_timeout || "30 minutes",
        securityPasswordPolicy: data.security_password_policy || "Strong",
        notifyLowStock: data.notify_low_stock !== "false",
        notifyDailySales: data.notify_daily_sales !== "false",
        notifyEmployeeLogin: data.notify_employee_login === "true",
        notifyUpdates: data.notify_updates !== "false",
        notifyPayroll: data.notify_payroll !== "false",
        databaseBackupFrequency: data.database_backup_frequency || "Daily",
        databaseKeepBackups: data.database_keep_backups || "30 days",
      });
    } catch (err) {
      toast.error("Failed to load store settings");
    } finally {
      setStoreLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchPricingTiers = async () => {
    try {
      setTiersLoading(true);
      const data = await pricingTiersService.getAll();
      setPricingTiers(data);
      const initialVals = {};
      data.forEach(t => initialVals[t.tierName] = t.multiplier);
      setTierValues(initialVals);
    } catch (err) {
      toast.error("Failed to load pricing tiers");
    } finally {
      setTiersLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    setSyncStatus(prev => ({ ...prev, loading: true }));
    try {
      const data = await systemService.getStatus();
      setSyncStatus({ online: data.online, pendingSyncItems: data.pendingSyncItems ?? 0, loading: false });
    } catch {
      setSyncStatus({ online: false, pendingSyncItems: 0, loading: false });
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      toast.info("Uploading logo...");
      const response = await fetch("/api/system/upload-logo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");
      setStoreData(prev => ({ ...prev, logo: data.logoUrl }));
      toast.success("Logo uploaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to upload logo");
    }
  };

  const fetchBackups = async () => {
    try {
      setBackupsLoading(true);
      const data = await systemService.getBackups();
      setBackups(data);
    } catch (err) {
      toast.error("Failed to load backups");
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      toast.info("Starting backup...");
      await systemService.createBackup("Manual");
      toast.success("Backup created successfully!");
      fetchBackups();
    } catch (err) {
      toast.error(err.message || "Failed to create backup");
    }
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
    } else if (activeSection === "pricing") {
      fetchPricingTiers();
    } else if (activeSection === "cloud" || activeSection === "database") {
      fetchSyncStatus();
      if (activeSection === "database") {
        fetchBackups();
      }
    }
  }, [activeSection]);

  const handleSaveStore = async () => {
    try {
      await storeService.update({
        store_name: storeData.name,
        store_address: storeData.address,
        store_phone: storeData.phone,
        store_email: storeData.email,
        store_tax_id: storeData.taxId,
        store_currency: storeData.currency,
        receipt_header: storeData.receiptHeader,
        receipt_footer: storeData.receiptFooter,
        receipt_print_logo: String(storeData.receiptPrintLogo),
        tax_rate: storeData.taxRate,
        tax_show_breakdown: String(storeData.taxShowBreakdown),
        tax_inclusive: String(storeData.taxInclusive),
        printer_default: storeData.printerDefault,
        printer_paper_size: storeData.printerPaperSize,
        sync_sales: String(storeData.syncSales),
        sync_inventory: String(storeData.syncInventory),
        sync_employees: String(storeData.syncEmployees),
        sync_finance: String(storeData.syncFinance),
        sync_offline_fallback: String(storeData.syncOfflineFallback),
        security_session_timeout: storeData.securitySessionTimeout,
        security_password_policy: storeData.securityPasswordPolicy,
        notify_low_stock: String(storeData.notifyLowStock),
        notify_daily_sales: String(storeData.notifyDailySales),
        notify_employee_login: String(storeData.notifyEmployeeLogin),
        notify_updates: String(storeData.notifyUpdates),
        notify_payroll: String(storeData.notifyPayroll),
        database_backup_frequency: storeData.databaseBackupFrequency,
        database_keep_backups: storeData.databaseKeepBackups,
      });
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  const handleResetStore = async () => {
    await fetchStoreSettings();
    toast.info("Store profile reset to saved values");
  };

  const handleAddUser = async () => {
    if (!userFormData.name || !userFormData.email || !userFormData.password) {
      toast.error("Please fill in all required fields (name, email, password)");
      return;
    }
    try {
      await userService.create({
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        password: userFormData.password
      });
      await fetchUsers();
      setShowAddUserModal(false);
      setUserFormData({ name: "", email: "", role: "Cashier", password: "" });
      toast.success("User added successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to add user");
    }
  };

  const handleEditUserClick = (user) => {
    setSelectedUser(user);
    setEditUserFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowEditUserModal(true);
  };

  const handleEditUserSave = async () => {
    try {
      await userService.update(selectedUser.id, editUserFormData);
      await fetchUsers();
      setShowEditUserModal(false);
      setSelectedUser(null);
      toast.success("User updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update user");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    try {
      await userService.update(selectedUser.id, { password: newPassword });
      toast.success(`Password reset for ${selectedUser?.name}.`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    }
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      await userService.update(user.id, { status: newStatus });
      toast.success(`${user.name} is now ${newStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update user status");
    }
  };


  const renderStoreProfile = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 flex items-center gap-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          {storeData.logo ? (
            <img src={`${storeData.logo}`} alt="Store Logo" className="w-24 h-24 object-contain rounded-xl bg-gray-50 border border-gray-200" />
          ) : (
            <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-xl border border-gray-200">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Store Logo</h4>
            <p className="text-sm text-gray-500 mb-3">Upload your company logo for receipts and reports. Recommended size: 256x256px.</p>
            <div className="flex gap-3">
              <Button onClick={() => document.getElementById("logo-upload").click()}>Upload Logo</Button>
              {storeData.logo && (
                <Button variant="secondary" onClick={() => toast.info("Logo removal not implemented yet")}>Remove</Button>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoUpload} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
          <input
            type="text"
            value={storeData.name}
            onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={storeData.email}
            onChange={(e) => setStoreData({ ...storeData, email: e.target.value })}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={storeData.phone}
            onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tax ID</label>
          <input
            type="text"
            value={storeData.taxId}
            onChange={(e) => setStoreData({ ...storeData, taxId: e.target.value })}
            className="nintendo-input"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
          <textarea
            value={storeData.address}
            onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
            rows={3}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
          <select
            value={storeData.currency}
            onChange={(e) => setStoreData({ ...storeData, currency: e.target.value })}
            className="nintendo-input"
          >
            <option value="LKR">LKR - Sri Lankan Rupee</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleSaveStore}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
        <Button variant="secondary" onClick={handleResetStore}><RefreshCw className="w-4 h-4 mr-2" /> Reset</Button>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">Manage cashiers and staff with role-based access control</p>
        <Button onClick={() => setShowAddUserModal(true)}><User className="w-4 h-4 mr-2" /> Add New User</Button>
      </div>
      <div className="nintendo-card overflow-hidden">
        <table className="nintendo-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Email</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No users yet. Add one to get started.</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#E60012] to-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-bold text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td>
                  <span className={`nintendo-badge ${user.role === "Administrator" ? "bg-[#9B59B6]/20 text-[#9B59B6]" :
                    user.role === "Cashier" ? "nintendo-badge-info" :
                      "nintendo-badge-warning"
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="text-gray-600">{user.email}</td>
                <td>
                  <button onClick={() => toggleUserStatus(user)}>
                    <span className={`nintendo-badge cursor-pointer ${user.status === "Active" ? "nintendo-badge-success" : "nintendo-badge-danger"}`}>
                      {user.status}
                    </span>
                  </button>
                </td>
                <td className="text-gray-600 text-sm">{user.lastLogin}</td>
                <td>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEditUserClick(user)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setNewPassword(""); setShowPasswordModal(true); }}>Reset Password</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPOSSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Receipt Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Receipt Header</label>
              <textarea className="nintendo-input" rows={2} value={storeData.receiptHeader} onChange={e => setStoreData({...storeData, receiptHeader: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Receipt Footer</label>
              <textarea className="nintendo-input" rows={2} value={storeData.receiptFooter} onChange={e => setStoreData({...storeData, receiptFooter: e.target.value})} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={storeData.receiptPrintLogo} onChange={e => setStoreData({...storeData, receiptPrintLogo: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Print logo on receipt</span>
            </label>
          </div>
        </div>
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Tax Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Tax Rate (%)</label>
              <input type="number" className="nintendo-input" value={storeData.taxRate} onChange={e => setStoreData({...storeData, taxRate: e.target.value})} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={storeData.taxShowBreakdown} onChange={e => setStoreData({...storeData, taxShowBreakdown: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Show tax breakdown on receipt</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={storeData.taxInclusive} onChange={e => setStoreData({...storeData, taxInclusive: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Tax inclusive pricing</span>
            </label>
          </div>
        </div>
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Barcode Scanner</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#7AC143]/10 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-[#7AC143]" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Scanner Connected</p>
                  <p className="text-sm text-gray-500">USB Barcode Scanner - Port COM3</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast.success("Scanner test successful!")}>Test</Button>
            </div>
          </div>
        </div>
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Printer Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Printer</label>
              <select className="nintendo-input" value={storeData.printerDefault} onChange={e => setStoreData({...storeData, printerDefault: e.target.value})}>
                <option>Thermal Receipt Printer (USB)</option>
                <option>Office Printer (Network)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Paper Size</label>
              <select className="nintendo-input" value={storeData.printerPaperSize} onChange={e => setStoreData({...storeData, printerPaperSize: e.target.value})}>
                <option>80mm (Standard Receipt)</option>
                <option>58mm (Compact Receipt)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <Button onClick={handleSaveStore}><Save className="w-4 h-4 mr-2" /> Save POS Settings</Button>
    </div>
  );

  const renderDatabaseBackup = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Local Database</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Database Status</p>
                <p className="text-sm text-gray-500">
                  {syncStatus.loading
                    ? "Checking connection…"
                    : syncStatus.online
                    ? "PostgreSQL (Remote) — Connected"
                    : "SQLite (Local) — Offline Mode"}
                </p>
              </div>
              <span className={`nintendo-badge ${
                syncStatus.loading ? "bg-gray-100 text-gray-400"
                : syncStatus.online ? "nintendo-badge-success"
                : "nintendo-badge-warning"
              }`}>
                {syncStatus.loading ? "…" : syncStatus.online ? "Connected" : "Offline"}
              </span>
            </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Last Backup</p>
                <p className="text-sm text-gray-500">{backups.length > 0 ? new Date(backups[0].date).toLocaleString() : "Never"}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCreateBackup}>Backup Now</Button>
            </div>
          </div>
        </div>
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Backup Schedule</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Auto Backup Frequency</label>
              <select className="nintendo-input" value={storeData.databaseBackupFrequency} onChange={e => {
                setStoreData({...storeData, databaseBackupFrequency: e.target.value});
                handleSaveStore();
              }}>
                <option>Every 6 hours</option>
                <option>Every 12 hours</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Keep Backups For</label>
              <select className="nintendo-input" value={storeData.databaseKeepBackups} onChange={e => {
                setStoreData({...storeData, databaseKeepBackups: e.target.value});
                handleSaveStore();
              }}>
                <option>7 days</option>
                <option>14 days</option>
                <option>30 days</option>
                <option>90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="nintendo-card p-6">
        <h4 className="font-bold text-lg text-gray-900 mb-4">Recent Backups</h4>
        <div className="space-y-3">
          {backupsLoading ? (
            <div className="text-center py-4 text-gray-500">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No backups found</div>
          ) : backups.map((backup, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#0AB5CD]" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{new Date(backup.date).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{backup.size} - {backup.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast.success("Downloading backup...")}>Download</Button>
                <Button variant="outline" size="sm" onClick={() => toast.warning("Restore initiated...")}>Restore</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCloudSync = () => {
    const { online, pendingSyncItems, loading } = syncStatus;

    const handleSyncNow = async () => {
      try {
        await fetchSyncStatus();
        toast.success("Sync status refreshed!");
      } catch {
        toast.error("Failed to reach server.");
      }
    };

    return (
      <div className="space-y-6">
        <div className="nintendo-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                loading ? "bg-gray-100" : online ? "bg-[#7AC143]/10" : "bg-[#E60012]/10"
              }`}>
                <Cloud className={`w-7 h-7 ${
                  loading ? "text-gray-400" : online ? "text-[#7AC143]" : "text-[#E60012]"
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-xl text-gray-900">Cloud Sync</h4>
                  {loading ? (
                    <span className="nintendo-badge bg-gray-100 text-gray-400">Checking...</span>
                  ) : online ? (
                    <span className="nintendo-badge nintendo-badge-success">● Online</span>
                  ) : (
                    <span className="nintendo-badge nintendo-badge-danger">● Offline</span>
                  )}
                </div>
                {!loading && pendingSyncItems > 0 && (
                  <p className="text-amber-600 text-sm font-semibold">
                    ⚠ {pendingSyncItems} item{pendingSyncItems !== 1 ? "s" : ""} pending sync
                  </p>
                )}
                {!loading && pendingSyncItems === 0 && online && (
                  <p className="text-gray-500 text-sm">All data synced — nothing pending</p>
                )}
                {!loading && !online && (
                  <p className="text-gray-500 text-sm">Operating in offline mode — data queued locally</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleSyncNow} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Checking..." : "Sync Now"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Sales Data", synced: true, count: "Synced" },
              { label: "Inventory", synced: true, count: "Synced" },
              { label: "Employees", synced: true, count: "Synced" },
              { label: "Finance", synced: storeData.syncFinance, count: storeData.syncFinance ? "Synced" : "Disabled" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  {item.synced ? (
                    <Check className="w-5 h-5 text-[#7AC143]" />
                  ) : (
                    <X className="w-5 h-5 text-[#E60012]" />
                  )}
                  <span className="font-bold text-gray-900">{item.label}</span>
                </div>
                <p className="text-sm text-gray-500">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Sync Preferences</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={storeData.syncSales} onChange={e => setStoreData({...storeData, syncSales: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Sync sales data in real-time</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={storeData.syncInventory} onChange={e => setStoreData({...storeData, syncInventory: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Sync inventory changes</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={storeData.syncEmployees} onChange={e => setStoreData({...storeData, syncEmployees: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Sync employee attendance</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={storeData.syncFinance} onChange={e => setStoreData({...storeData, syncFinance: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Sync financial records</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={storeData.syncOfflineFallback} onChange={e => setStoreData({...storeData, syncOfflineFallback: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Enable offline mode fallback</span>
            </label>
          </div>
          <Button className="mt-4" onClick={handleSaveStore}><Save className="w-4 h-4 mr-2" /> Save Preferences</Button>
        </div>
      </div>
    );
  };

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="nintendo-card p-6">
        <h4 className="font-bold text-xl text-gray-900 mb-4">Security Settings</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-bold text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.info("2FA setup coming soon!")}>Enable</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-bold text-gray-900">Session Timeout</p>
              <p className="text-sm text-gray-500">Auto logout after inactivity</p>
            </div>
            <select className="nintendo-input w-32" value={storeData.securitySessionTimeout} onChange={e => {
              setStoreData({...storeData, securitySessionTimeout: e.target.value});
              handleSaveStore();
            }}>
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>Never</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-bold text-gray-900">Password Policy</p>
              <p className="text-sm text-gray-500">Minimum requirements for passwords</p>
            </div>
            <select className="nintendo-input w-40" value={storeData.securityPasswordPolicy} onChange={e => {
              setStoreData({...storeData, securityPasswordPolicy: e.target.value});
              handleSaveStore();
            }}>
              <option>Standard</option>
              <option>Strong</option>
              <option>Very Strong</option>
            </select>
          </div>
        </div>
      </div>
      <div className="nintendo-card p-6">
        <h4 className="font-bold text-lg text-gray-900 mb-4">Recent Activity Log</h4>
        <div className="space-y-3">
          {[
            { action: "Login", user: "Admin User", time: "10 minutes ago", ip: "192.168.1.1" },
            { action: "Settings Changed", user: "Admin User", time: "2 hours ago", ip: "192.168.1.1" },
            { action: "Login", user: "John Cashier", time: "3 hours ago", ip: "192.168.1.5" },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500">{log.user} • {log.ip}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="nintendo-card p-6">
        <h4 className="font-bold text-xl text-gray-900 mb-4">Notification Preferences</h4>
        <div className="space-y-3">
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={storeData.notifyLowStock} onChange={e => setStoreData({...storeData, notifyLowStock: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012] mt-0.5" />
            <div>
              <span className="font-medium text-gray-900">Low stock alerts</span>
              <p className="text-sm text-gray-500">Get notified when products are running low</p>
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={storeData.notifyDailySales} onChange={e => setStoreData({...storeData, notifyDailySales: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012] mt-0.5" />
            <div>
              <span className="font-medium text-gray-900">Daily sales summary</span>
              <p className="text-sm text-gray-500">Receive end-of-day sales reports</p>
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={storeData.notifyEmployeeLogin} onChange={e => setStoreData({...storeData, notifyEmployeeLogin: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012] mt-0.5" />
            <div>
              <span className="font-medium text-gray-900">New employee login</span>
              <p className="text-sm text-gray-500">Alert when staff logs in</p>
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={storeData.notifyUpdates} onChange={e => setStoreData({...storeData, notifyUpdates: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012] mt-0.5" />
            <div>
              <span className="font-medium text-gray-900">System updates</span>
              <p className="text-sm text-gray-500">Get notified about system updates</p>
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={storeData.notifyPayroll} onChange={e => setStoreData({...storeData, notifyPayroll: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#E60012] mt-0.5" />
            <div>
              <span className="font-medium text-gray-900">Payroll reminders</span>
              <p className="text-sm text-gray-500">Remind before payroll due dates</p>
            </div>
          </label>
        </div>
        <Button className="mt-4" onClick={handleSaveStore}><Save className="w-4 h-4 mr-2" /> Save Preferences</Button>
      </div>
    </div>
  );

  const handleUpdateTier = async (tierName, multiplier) => {
    try {
      await pricingTiersService.update({ tierName, multiplier });
      toast.success(`Updated ${tierName} tier multiplier successfully!`);
      fetchPricingTiers();
    } catch (err) {
      toast.error(err.message || "Failed to update pricing tier");
    }
  };

  const renderPricingTiers = () => (
    <div className="space-y-6">
      <div className="nintendo-card p-6">
        <h4 className="font-bold text-xl text-gray-900 mb-4">Customer Pricing Tiers</h4>
        <p className="text-sm text-gray-500 mb-6">Set multiplier rates for different customer types. E.g., a 0.9 multiplier gives a 10% discount across all products.</p>
        <div className="space-y-4">
          <table className="nintendo-table w-full text-left">
            <thead>
              <tr>
                <th className="font-bold p-3">Tier Name</th>
                <th className="font-bold p-3">Multiplier (e.g. 1.0 = Base Price)</th>
                <th className="font-bold p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {["Regular", "Contractor", "Wholesale", "VIP"].map((tierName) => {
                const val = tierValues[tierName] !== undefined ? tierValues[tierName] : 1.0;

                return (
                  <tr key={tierName} className="border-t border-gray-100">
                    <td className="p-3 font-medium text-gray-900">{tierName}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={val}
                        onChange={(e) => setTierValues({ ...tierValues, [tierName]: e.target.value })}
                        className="nintendo-input w-24"
                      />
                    </td>
                    <td className="p-3">
                      <Button variant="secondary" size="sm" onClick={() => handleUpdateTier(tierName, Number(val))}>Save</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "store": return renderStoreProfile();
      case "users": return renderUserManagement();
      case "pos": return renderPOSSettings();
      case "database": return renderDatabaseBackup();
      case "pricing": return renderPricingTiers();
      case "cloud": return renderCloudSync();
      case "security": return renderSecurity();
      case "notifications": return renderNotifications();
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Settings" />

        <div className="p-6">
          <div className="flex gap-6">
            <div className="w-64 space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeSection === section.id
                      ? "bg-[#E60012] text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1">
              <div className="mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900">
                  {settingsSections.find(s => s.id === activeSection)?.label}
                </h3>
              </div>
              {renderSection()}
            </div>
          </div>
        </div>

        <Modal isOpen={showAddUserModal} onClose={() => setShowAddUserModal(false)} title="Add New User">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="e.g., John Perera"
                className="nintendo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="john@store.com"
                className="nintendo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                className="nintendo-input"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Initial Password</label>
              <input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="••••••••"
                className="nintendo-input"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>
                <Plus className="w-4 h-4 mr-2" /> Add User
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showEditUserModal} onClose={() => setShowEditUserModal(false)} title="Edit User">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={editUserFormData.name}
                onChange={(e) => setEditUserFormData({ ...editUserFormData, name: e.target.value })}
                className="nintendo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={editUserFormData.email}
                onChange={(e) => setEditUserFormData({ ...editUserFormData, email: e.target.value })}
                className="nintendo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
              <select
                value={editUserFormData.role}
                onChange={(e) => setEditUserFormData({ ...editUserFormData, role: e.target.value })}
                className="nintendo-input"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowEditUserModal(false)}>Cancel</Button>
              <Button onClick={handleEditUserSave}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password">
          <div className="space-y-5">
            <div className="text-center p-6 bg-gray-50 rounded-xl mb-4">
              <Lock className="w-12 h-12 text-[#E60012] mx-auto mb-3" />
              <p className="font-bold text-gray-900">Reset password for {selectedUser?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="nintendo-input"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
              <Button onClick={handleResetPassword}>
                <RefreshCw className="w-4 h-4 mr-2" /> Reset Password
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Settings;
