import { useState, useEffect, createContext, useContext } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message) => addToast(message, "success"),
    error: (message) => addToast(message, "error"),
    warning: (message) => addToast(message, "warning"),
    info: (message) => addToast(message, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-[#7AC143] text-white",
    error: "bg-[#E60012] text-white",
    warning: "bg-[#F5A623] text-white",
    info: "bg-[#0AB5CD] text-white",
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl ${colors[type]} min-w-[300px]`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastProvider;
