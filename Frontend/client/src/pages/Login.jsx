import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { Wrench, User, Lock, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        setLocation("/");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D]">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="nintendo-card p-8">
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="w-20 h-20 bg-[#E60012] rounded-2xl flex items-center justify-center shadow-xl animate-bounce-subtle">
                <Wrench className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">Hardware POS</h1>
              <p className="text-gray-500 font-medium">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#E60012]/10 text-[#E60012] rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="nintendo-input pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="nintendo-input pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-[#E60012] to-[#C4000F] p-12">
        <div className="text-center text-white">
          <h2 className="text-4xl font-extrabold mb-4">Welcome Back!</h2>
          <p className="text-xl text-white/80 max-w-md">
            Manage your hardware store with ease. Track sales, inventory, and reports all in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
