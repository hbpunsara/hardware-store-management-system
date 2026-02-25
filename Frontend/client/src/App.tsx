import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";

import { Dashboard } from "@/pages/Dashboard";
import { POS } from "@/pages/POS";
import { Products } from "@/pages/Products";
import { Sales } from "@/pages/Sales";
import { Finance } from "@/pages/Finance";
import { Employees } from "@/pages/Employees";
import { Payroll } from "@/pages/Payroll";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pos" component={POS} />
      <Route path="/products" component={Products} />
      <Route path="/sales" component={Sales} />
      <Route path="/finance" component={Finance} />
      <Route path="/employees" component={Employees} />
      <Route path="/payroll" component={Payroll} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/login" component={Login} />
      <Route>
        <div className="flex items-center justify-center min-h-screen bg-[#F5F5F5]">
          <div className="nintendo-card p-12 text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">404</h1>
            <p className="text-gray-500 font-medium">Page not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ToastProvider>
            <Toaster />
            <Router />
          </ToastProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
