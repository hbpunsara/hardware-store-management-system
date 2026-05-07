import { Switch, Route, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Wrench } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { Dashboard } from "@/pages/Dashboard";
import { POS } from "@/pages/POS";
import { Returns } from "@/pages/Returns";
import { Inventory as Products } from "@/pages/Inventory";
import { Sales } from "@/pages/Sales";
import { Finance } from "@/pages/Finance";
import { Employees } from "@/pages/Employees";
import { Customers } from "@/pages/Customers";
import { Quotes } from "@/pages/Quotes";
import { Payroll } from "@/pages/Payroll";
import { Settings } from "@/pages/Settings";
import { Promotions } from "@/pages/Promotions";
import { Reports } from "@/pages/Reports";
import { Login } from "@/pages/Login";

const ProtectedComponent = ({ component: Component, allowedRoles, params }: any) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Redirect to="/login" />;

  const userRole = (user as any)?.role || "cashier";
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
      <ProtectedRoute path="/returns" component={Returns} allowedRoles={["admin", "cashier"]} />
      <ProtectedRoute path="/products" component={Products} allowedRoles={["admin", "inventory_manager"]} />
      <ProtectedRoute path="/sales" component={Sales} allowedRoles={["admin", "cashier"]} />
      <ProtectedRoute path="/customers" component={Customers} allowedRoles={["admin", "cashier"]} />
      <ProtectedRoute path="/quotes" component={Quotes} allowedRoles={["admin", "cashier"]} />
      <ProtectedRoute path="/finance" component={Finance} allowedRoles={["admin"]} />
      <ProtectedRoute path="/employees" component={Employees} allowedRoles={["admin"]} />
      <ProtectedRoute path="/payroll" component={Payroll} allowedRoles={["admin"]} />
      <ProtectedRoute path="/reports" component={Reports} allowedRoles={["admin"]} />
      <ProtectedRoute path="/promotions" component={Promotions} allowedRoles={["admin"]} />
      <ProtectedRoute path="/settings" component={Settings} allowedRoles={["admin"]} />
      <Route path="/login" component={Login} />
      <Route>
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4">
          <div className="nintendo-card max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-[#E60012]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wrench className="w-8 h-8 text-[#E60012]" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">404</h1>
            <p className="text-gray-600 mb-8 font-medium">Page not found</p>
            <Link href="/">
              <span className="w-full cursor-pointer bg-[#E60012] hover:bg-[#CC0010] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg">
                Go to Dashboard
              </span>
            </Link>
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
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </ToastProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
