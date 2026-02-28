import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, Cloud, CloudOff } from "lucide-react";

export const Navbar = ({ title, showSearch = false }) => {
  const [syncStatus, setSyncStatus] = useState({ online: true, pendingItems: 0 });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/system/status");
        if (res.ok) {
          const data = await res.json();
          setSyncStatus({ online: data.online, pendingItems: data.pendingSyncItems });
        } else {
          setSyncStatus(prev => ({ ...prev, online: false }));
        }
      } catch (err) {
        setSyncStatus(prev => ({ ...prev, online: false }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b-2 border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 font-medium">Welcome back! Here's what's happening today.</p>
        </div>

        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="nintendo-input pl-12 w-72"
              />
            </div>
          )}

          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${syncStatus.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {syncStatus.online ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            <span className="text-sm font-semibold">
              {syncStatus.online ? 'Online' : 'Offline'}
              {syncStatus.pendingItems > 0 && ` (${syncStatus.pendingItems} pending)`}
            </span>
          </div>

          <button className="relative p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60012] rounded-full flex items-center justify-center text-white text-xs font-bold">
              3
            </span>
          </button>

          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
            <span className="text-sm font-semibold text-gray-700">Today</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
