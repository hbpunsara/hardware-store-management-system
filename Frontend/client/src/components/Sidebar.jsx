import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Wrench,
  Users,
  Wallet,
  CreditCard,
  UserCheck,
  FileText,
  RotateCcw,
  Tag,
  Clock,
  Play,
  Square
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { shiftService } from "../services/shiftService";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["admin", "inventory_manager"] },
  { icon: ShoppingCart, label: "POS", path: "/pos", roles: ["admin", "cashier"] },
  { icon: RotateCcw, label: "Returns", path: "/returns", roles: ["admin", "cashier"] },
  { icon: Package, label: "Inventory", path: "/products", roles: ["admin", "inventory_manager"] },
  { icon: CreditCard, label: "Sales", path: "/sales", roles: ["admin", "cashier"] },
  { icon: UserCheck, label: "Customers", path: "/customers", roles: ["admin", "cashier"] },
  { icon: FileText, label: "Quotes", path: "/quotes", roles: ["admin", "cashier"] },
];

const managementNavItems = [
  { icon: Wallet, label: "Finance", path: "/finance", roles: ["admin"] },
  { icon: Users, label: "Employees", path: "/employees", roles: ["admin"] },
  { icon: DollarSign, label: "Payroll", path: "/payroll", roles: ["admin"] },
  { icon: Tag, label: "Promotions", path: "/promotions", roles: ["admin"] },
  { icon: BarChart3, label: "Analytics", path: "/reports", roles: ["admin"] },
];

export const Sidebar = () => {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftAmount, setShiftAmount] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (user && ["admin", "cashier"].includes(user.role)) {
      shiftService.getActiveShift().then(setActiveShift).catch(() => { });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const handleShiftAction = async () => {
    try {
      if (activeShift) {
        const actualCash = parseFloat(shiftAmount) || 0;
        await shiftService.endShift(actualCash, activeShift.startingFloat);
        setActiveShift(null);
        toast.success("Shift ended successfully!");
      } else {
        const float = parseFloat(shiftAmount) || 0;
        const newShift = await shiftService.startShift(float);
        setActiveShift(newShift);
        toast.success("Shift started successfully!");
      }
      setShowShiftModal(false);
      setShiftAmount("");
    } catch (err) {
      toast.error(err.message || "Failed to process shift");
    }
  };

  const NavItem = ({ item }) => {
    const isActive = location === item.path;
    const Icon = item.icon;

    return (
      <Link href={item.path}>
        <button
          className={`nintendo-nav-item w-full ${isActive ? 'active' : ''}`}
        >
          <Icon className="w-5 h-5" />
          <span>{item.label}</span>
        </button>
      </Link>
    );
  };

  return (
    <aside className="nintendo-sidebar flex flex-col w-[280px] min-h-screen">
      <div className="flex items-center gap-3 p-6 border-b border-white/10">
        <div className="w-12 h-12 bg-[#E60012] rounded-xl flex items-center justify-center shadow-lg">
          <Wrench className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white">Hardware POS</h1>
          <p className="text-xs text-gray-400 font-medium">Hybrid Management System</p>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 px-4">Main Menu</p>
        <div className="flex flex-col gap-1 mb-6">
          {mainNavItems.filter(i => i.roles.includes(user?.role)).map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {managementNavItems.filter(i => i.roles.includes(user?.role)).length > 0 && (
          <>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 px-4">Management</p>
            <div className="flex flex-col gap-1 mb-6">
              {managementNavItems.filter(i => i.roles.includes(user?.role)).map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 px-4">System</p>
            <Link href="/settings">
              <button className={`nintendo-nav-item w-full ${location === '/settings' ? 'active' : ''}`}>
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-white/5 rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E60012] to-[#FF6B6B] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{user?.name || 'Guest'}</p>
            <p className="text-gray-400 text-xs">{user?.role || '—'}</p>
          </div>
        </div>

        {user && ["admin", "cashier"].includes(user.role) && (
          <button
            onClick={() => setShowShiftModal(true)}
            className={`nintendo-nav-item w-full mb-2 ${activeShift ? 'text-[#7AC143] hover:bg-white/10' : 'text-[#F5A623] hover:bg-white/10'}`}
          >
            <Clock className="w-5 h-5" />
            <span>{activeShift ? "End Shift" : "Start Shift"}</span>
          </button>
        )}

        <button onClick={handleLogout} className="nintendo-nav-item w-full text-gray-400 hover:text-white">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
      <Modal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title={activeShift ? "End Current Shift" : "Start New Shift"}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {activeShift
              ? "Please count the cash drawer and enter the actual total amount."
              : "Enter the starting cash float for this register."}
          </p>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Amount (LKR)</label>
            <input
              type="number"
              className="nintendo-input w-full text-lg font-bold"
              value={shiftAmount}
              onChange={e => setShiftAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl" onClick={() => setShowShiftModal(false)}>Cancel</button>
            <button
              className={`px-4 py-2 text-white font-bold rounded-xl flex items-center gap-2 ${activeShift ? 'bg-[#E60012] hover:bg-red-700' : 'bg-[#7AC143] hover:bg-green-600'}`}
              onClick={handleShiftAction}
            >
              {activeShift ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {activeShift ? "Close Register" : "Open Register"}
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
};

export default Sidebar;
