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
  Square,
  X,
  Settings as SettingsIcon,
} from "lucide-react";



import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
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

const NavItem = ({ item, location }) => {
  const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
  const Icon = item.icon;

  return (
    <Link href={item.path}>
      <button
        className={`group relative flex items-center h-12 rounded-xl transition-all duration-300 gap-4 px-4 w-full ${isActive ? 'bg-[#E60012] text-white shadow-[0_0_20px_rgba(230,0,18,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Icon className={`shrink-0 transition-all duration-300 w-5 h-5 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-bold text-sm truncate">
          {item.label}
        </span>
      </button>
    </Link>
  );
};

export const Sidebar = () => {

  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftAmount, setShiftAmount] = useState("");
  const toast = useToast();


  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    document.addEventListener('toggleSidebar', handleToggle);
    return () => document.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  useEffect(() => {
    // Close sidebar on route change in mobile
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    if (user && ["admin", "cashier"].includes(user.role)) {
      shiftService.getActiveShift()
        .then(shift => {
          setActiveShift(shift);
          // Auto-prompt cashier to start shift if none active
          if (!shift && user.role === 'cashier') {
            setShowShiftModal(true);
          }
        })
        .catch(() => { });
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




  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        className={`nintendo-sidebar flex flex-col h-screen fixed md:relative z-50 border-r border-white/5 bg-[#121212] w-[240px] ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center h-20 px-4 justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 bg-[#E60012] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(230,0,18,0.4)] shrink-0">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col justify-center"
            >
              <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase">PRO<span className="text-[#E60012]">HARDWARE</span></h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em] mt-0.5">System v2.0</p>
            </motion.div>
          </div>
        </div>


        <nav className="flex-1 py-4 overflow-y-auto no-scrollbar scroll-smooth px-4">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-[10px] text-white font-black uppercase tracking-[0.2em] mb-4 px-4"
          >
            Navigation
          </motion.p>
          <div className="space-y-1 mb-8">
            {mainNavItems.filter(i => user?.role && i.roles.includes(user.role)).map((item) => (
              <NavItem key={item.path} item={item} location={location} />
            ))}
          </div>


          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-[10px] text-white font-black uppercase tracking-[0.2em] mb-4 px-4"
          >
            Management
          </motion.p>
          <div className="space-y-1 mb-8">
            {managementNavItems.filter(i => user?.role && i.roles.includes(user.role)).map((item) => (
              <NavItem key={item.path} item={item} location={location} />
            ))}
            
            {user?.role === "admin" && (
              <Link href="/settings">
                <button 
                  className={`group relative flex items-center h-12 rounded-xl transition-all duration-300 gap-4 px-4 w-full ${location === '/settings' ? 'bg-[#E60012] text-white shadow-[0_0_20px_rgba(230,0,18,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <SettingsIcon className={`shrink-0 transition-all duration-300 w-5 h-5 ${location === '/settings' ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-bold text-sm truncate">Settings</span>
                </button>
              </Link>
            )}

          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4 rounded-2xl transition-all p-2">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 rounded-xl flex items-center justify-center shrink-0 shadow-xl overflow-hidden relative group">
              <span className="text-white font-black text-xs relative z-10">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
              </span>
              <div className="absolute inset-0 bg-[#E60012] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="min-w-0">
              {user ? (
                <>
                  <p className="text-white font-bold text-sm truncate leading-tight">{user.name || 'Guest'}</p>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">{user.role || '—'}</p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="w-20 h-3 bg-white/10 rounded animate-pulse" />
                  <div className="w-12 h-2 bg-white/5 rounded animate-pulse" />
                </div>
              )}
            </div>

          </div>

          <div className="space-y-1">
            {user && ["admin", "cashier"].includes(user.role) && (
              <button
                onClick={() => setShowShiftModal(true)}
                className={`group flex items-center h-11 rounded-xl transition-all w-full gap-4 px-4 ${activeShift ? 'text-[#7AC143] bg-[#7AC143]/5' : 'text-[#F5A623] bg-[#F5A623]/5'} hover:scale-[1.02] active:scale-95`}
              >
                <Clock className="shrink-0 w-5 h-5" />
                <span className="font-bold text-xs truncate">{activeShift ? "End Shift" : "Start Shift"}</span>
              </button>
            )}

            <button 
              onClick={handleLogout} 
              className="group flex items-center h-11 rounded-xl transition-all w-full text-gray-500 hover:text-white hover:bg-white/5 gap-4 px-4 active:scale-95"
            >
              <LogOut className="shrink-0 w-5 h-5" />
              <span className="font-bold text-xs truncate">Logout</span>
            </button>
          </div>
        </div>

      </motion.aside>



      <Modal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title={activeShift ? "End Current Shift" : "Start New Shift"}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {activeShift
              ? "Please count the cash drawer and enter the actual total amount."
              : "Welcome! To start your work day, please enter the starting cash float for this register."}
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
    </>
  );
};

export default Sidebar;
