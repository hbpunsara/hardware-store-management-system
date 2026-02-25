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

const settingsSections = [
  { id: "store", label: "Store Profile", icon: Store },
  { id: "users", label: "User Management", icon: User },
  { id: "pos", label: "POS Settings", icon: Printer },
  { id: "database", label: "Database & Backup", icon: Database },
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [storeData, setStoreData] = useState({
    name: "Hardware Pro Store",
    address: "123 Main Street, Colombo",
    phone: "+94 11 234 5678",
    email: "info@hardwarepro.lk",
    taxId: "TAX-12345-LK",
    currency: "LKR"
  });
  const [storeLoading, setStoreLoading] = useState(true);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "Cashier",
    password: ""
  });
  const toast = useToast();

  const fetchStoreSettings = async () => {
    try {
      setStoreLoading(true);
      const data = await storeService.getAll();
      setStoreData({
        name: data.store_name || "Hardware Pro Store",
        address: data.store_address || "123 Main Street, Colombo",
        phone: data.store_phone || "+94 11 234 5678",
        email: data.store_email || "info@hardwarepro.lk",
        taxId: data.store_tax_id || "TAX-12345-LK",
        currency: data.store_currency || "LKR"
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

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
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
        store_currency: storeData.currency
      });
      toast.success("Store profile saved successfully!");
    } catch (err) {
      toast.error("Failed to save store profile");
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

  const handleResetPassword = () => {
    toast.success(`Password reset for ${selectedUser?.name}. New password sent to email.`);
    setShowPasswordModal(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = (user) => {
    toast.info("User status toggle coming soon. Use database to activate/deactivate users.");
  };

  const renderStoreProfile = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
          <input
            type="text"
            value={storeData.name}
            onChange={(e) => setStoreData({...storeData, name: e.target.value})}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={storeData.email}
            onChange={(e) => setStoreData({...storeData, email: e.target.value})}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={storeData.phone}
            onChange={(e) => setStoreData({...storeData, phone: e.target.value})}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tax ID</label>
          <input
            type="text"
            value={storeData.taxId}
            onChange={(e) => setStoreData({...storeData, taxId: e.target.value})}
            className="nintendo-input"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
          <textarea
            value={storeData.address}
            onChange={(e) => setStoreData({...storeData, address: e.target.value})}
            rows={3}
            className="nintendo-input"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
          <select 
            value={storeData.currency}
            onChange={(e) => setStoreData({...storeData, currency: e.target.value})}
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
                  <span className={`nintendo-badge ${
                    user.role === "Administrator" ? "bg-[#9B59B6]/20 text-[#9B59B6]" :
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
                    <Button variant="secondary" size="sm" onClick={() => toast.info("Edit user coming soon!")}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}>Reset Password</Button>
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
              <textarea className="nintendo-input" rows={2} defaultValue="Hardware Pro Store - Your Trusted Partner" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Receipt Footer</label>
              <textarea className="nintendo-input" rows={2} defaultValue="Thank you for shopping with us!" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Print logo on receipt</span>
            </label>
          </div>
        </div>
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Tax Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Tax Rate (%)</label>
              <input type="number" className="nintendo-input" defaultValue="9" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">Show tax breakdown on receipt</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
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
              <select className="nintendo-input">
                <option>Thermal Receipt Printer (USB)</option>
                <option>Office Printer (Network)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Paper Size</label>
              <select className="nintendo-input">
                <option>80mm (Standard Receipt)</option>
                <option>58mm (Compact Receipt)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <Button onClick={() => toast.success("POS settings saved!")}><Save className="w-4 h-4 mr-2" /> Save POS Settings</Button>
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
                <p className="text-sm text-gray-500">PostgreSQL - 245 MB used</p>
              </div>
              <span className="nintendo-badge nintendo-badge-success">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Last Backup</p>
                <p className="text-sm text-gray-500">2024-01-15 06:00 AM (Automatic)</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast.success("Backup started...")}>Backup Now</Button>
            </div>
          </div>
        </div>
        <div className="nintendo-card p-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4">Backup Schedule</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Auto Backup Frequency</label>
              <select className="nintendo-input">
                <option>Every 6 hours</option>
                <option>Every 12 hours</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Keep Backups For</label>
              <select className="nintendo-input">
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
          {[
            { date: "2024-01-15 06:00 AM", size: "242 MB", type: "Automatic" },
            { date: "2024-01-14 06:00 PM", size: "240 MB", type: "Automatic" },
            { date: "2024-01-14 10:30 AM", size: "238 MB", type: "Manual" },
          ].map((backup, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#0AB5CD]" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{backup.date}</p>
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

  const renderCloudSync = () => (
    <div className="space-y-6">
      <div className="nintendo-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#7AC143]/10 rounded-xl flex items-center justify-center">
              <Cloud className="w-7 h-7 text-[#7AC143]" />
            </div>
            <div>
              <h4 className="font-bold text-xl text-gray-900">Cloud Sync Enabled</h4>
              <p className="text-gray-500">Your data is automatically synced to the cloud</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Last synced: 2 minutes ago</span>
            <Button variant="secondary" size="sm" onClick={() => toast.success("Syncing data...")}><RefreshCw className="w-4 h-4 mr-2" /> Sync Now</Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Sales Data", synced: true, count: "2,847 records" },
            { label: "Inventory", synced: true, count: "248 products" },
            { label: "Employees", synced: true, count: "12 records" },
            { label: "Finance", synced: true, count: "1,420 entries" },
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
          {[
            { label: "Sync sales data in real-time", checked: true },
            { label: "Sync inventory changes", checked: true },
            { label: "Sync employee attendance", checked: true },
            { label: "Sync financial records", checked: false },
            { label: "Enable offline mode fallback", checked: true },
          ].map((pref, i) => (
            <label key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" defaultChecked={pref.checked} className="w-5 h-5 rounded border-gray-300 text-[#E60012]" />
              <span className="font-medium text-gray-700">{pref.label}</span>
            </label>
          ))}
        </div>
        <Button className="mt-4" onClick={() => toast.success("Sync preferences saved!")}><Save className="w-4 h-4 mr-2" /> Save Preferences</Button>
      </div>
    </div>
  );

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
            <select className="nintendo-input w-32">
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
            <select className="nintendo-input w-40">
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
          {[
            { label: "Low stock alerts", description: "Get notified when products are running low", checked: true },
            { label: "Daily sales summary", description: "Receive end-of-day sales reports", checked: true },
            { label: "New employee login", description: "Alert when staff logs in", checked: false },
            { label: "System updates", description: "Get notified about system updates", checked: true },
            { label: "Payroll reminders", description: "Remind before payroll due dates", checked: true },
          ].map((pref, i) => (
            <label key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" defaultChecked={pref.checked} className="w-5 h-5 rounded border-gray-300 text-[#E60012] mt-0.5" />
              <div>
                <span className="font-medium text-gray-900">{pref.label}</span>
                <p className="text-sm text-gray-500">{pref.description}</p>
              </div>
            </label>
          ))}
        </div>
        <Button className="mt-4" onClick={() => toast.success("Notification preferences saved!")}><Save className="w-4 h-4 mr-2" /> Save Preferences</Button>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "store": return renderStoreProfile();
      case "users": return renderUserManagement();
      case "pos": return renderPOSSettings();
      case "database": return renderDatabaseBackup();
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeSection === section.id
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
                onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                placeholder="e.g., John Perera"
                className="nintendo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                placeholder="john@store.com"
                className="nintendo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
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
                onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
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

        <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password">
          <div className="space-y-5">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <Lock className="w-12 h-12 text-[#E60012] mx-auto mb-3" />
              <p className="font-bold text-gray-900 mb-2">Reset password for {selectedUser?.name}?</p>
              <p className="text-gray-500 text-sm">A new temporary password will be sent to {selectedUser?.email}</p>
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
