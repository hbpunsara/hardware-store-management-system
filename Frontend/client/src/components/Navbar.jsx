import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, Cloud, CloudOff, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Navbar = ({ title, showSearch = false }) => {
  const [syncStatus, setSyncStatus] = useState({ online: true, pendingItems: 0 });

  // Mock notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Low Stock Alert', message: 'Hammer 16oz is running low (5 left)', time: '10 mins ago', type: 'warning' },
    { id: 2, title: 'System Update', message: 'Application updated to v1.2 successfully', time: '1 hour ago', type: 'success' },
    { id: 3, title: 'New Order', message: 'Large order #1024 received', time: '2 hours ago', type: 'info' }
  ]);

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
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

          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60012] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm py-8">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 relative group">
                      <div className="mt-0.5">
                        {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Close notification"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

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
