import { Search, Bell, ChevronDown } from "lucide-react";

export const Navbar = ({ title, showSearch = false }) => {
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
