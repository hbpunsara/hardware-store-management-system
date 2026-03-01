import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider, useAuth } from "@/context/AuthContext";

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

const ProtectedComponent = ({ component: Component, allowedRoles, params }: any) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Redirect to="/login" />;

  const userRole = user?.role || "cashier";
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === "cashier") return <Redirect to="/pos" />;
    if (userRole === "inventory_manager") return <Redirect to="/products" />;
    return <Redirect to="/" />;
  }

  return <Component {...params} />;
};

const ProtectedRoute = ({ component, allowedRoles, path }: any) => {
  return (
    <Route path={path}>
      {(params) => <ProtectedComponent component={component} allowedRoles={allowedRoles} params={params} />}
    </Route>
  );
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} allowedRoles={["admin", "inventory_manager"]} />
      <ProtectedRoute path="/pos" component={POS} allowedRoles={["admin", "cashier"]} />
      <ProtectedRoute path="/products" component={Products} allowedRoles={["admin", "inventory_manager"]} />
      <ProtectedRoute path="/sales" component={Sales} allowedRoles={["admin", "cashier"]} />
      <ProtectedRoute path="/finance" component={Finance} allowedRoles={["admin"]} />
      <ProtectedRoute path="/employees" component={Employees} allowedRoles={["admin"]} />
      <ProtectedRoute path="/payroll" component={Payroll} allowedRoles={["admin"]} />
      <ProtectedRoute path="/reports" component={Reports} allowedRoles={["admin"]} />
      <ProtectedRoute path="/settings" component={Settings} allowedRoles={["admin"]} />
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
