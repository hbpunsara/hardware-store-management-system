import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { Search, Minus, Plus, Trash2, CreditCard, Banknote, Smartphone, Receipt, ShoppingCart, RefreshCw, Barcode, Check, Printer, Users } from "lucide-react";
import productService from "../services/productService";
import salesService from "../services/salesService";

export const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCashierPanel, setShowCashierPanel] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  const categories = ["All", "Tools", "Hardware", "Painting", "Adhesives", "Materials"];

  useEffect(() => {
    const load = async () => {
      setProductsLoading(true);
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        toast.error("Failed to load products");
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
    toast.info("Item removed from cart");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.09;
  const total = subtotal + tax;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePayment = (method) => {
    setPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }
    
    if (paymentMethod === "cash" && parseFloat(cashReceived) < total) {
      toast.error("Insufficient cash received!");
      return;
    }

    setProcessing(true);
    try {
      const sale = await salesService.create({
        items: cart.map(item => ({ productId: item.id, productName: item.name, quantity: item.quantity, price: item.price })),
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod,
        cashierId: user?.id,
      });
      setInvoiceNumber(`INV-${sale.id}`);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      toast.success("Payment processed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  const completeTransaction = () => {
    setCart([]);
    setCashReceived("");
    setShowReceiptModal(false);
    toast.success("Transaction completed!");
  };

  const handleScanBarcode = () => {
    toast.info("Barcode scanner ready...");
  };

  const handleSync = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
      toast.success("Products synced!");
    } catch {
      toast.error("Sync failed");
    }
  };

  const change = paymentMethod === "cash" ? Math.max(0, parseFloat(cashReceived || 0) - total) : 0;

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Point of Sale" />
        
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-[#E60012] to-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{user?.name || 'Cashier'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Register'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCashierPanel(!showCashierPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Switch Cashier</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#7AC143]/10 rounded-xl">
                <div className="w-2 h-2 bg-[#7AC143] rounded-full animate-pulse" />
                <span className="font-medium text-[#7AC143]">Online</span>
              </div>
              <Button variant="secondary" onClick={handleScanBarcode}>
                <Barcode className="w-4 h-4 mr-2" /> Scan Barcode
              </Button>
              <Button variant="secondary" onClick={handleSync}>
                <RefreshCw className="w-4 h-4 mr-2" /> Sync
              </Button>
            </div>
          </div>

          {showCashierPanel && (
            <div className="nintendo-card p-5">
              <h4 className="font-bold text-lg text-gray-900 mb-4">Current User</h4>
              <p className="text-gray-600">{user?.name || 'Not logged in'} ({user?.role})</p>
            </div>
          )}

          <div className="flex gap-6">
            <div className="flex-1">
              <div className="nintendo-card p-5 mb-5">
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="nintendo-input pl-12"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        selectedCategory === cat
                          ? "bg-[#E60012] text-white shadow-lg"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {productsLoading ? (
                  <div className="col-span-3 p-8 text-center text-gray-500">Loading products...</div>
                ) : (
                filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="nintendo-card p-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 flex items-center justify-center">
                      <span className="text-3xl">🔧</span>
                    </div>
                    <p className="font-bold text-gray-900 mb-1">{product.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    <p className="text-lg font-extrabold text-[#E60012]">LKR {product.price?.toFixed(2)}</p>
                  </div>
                ))
                )}
              </div>
            </div>

            <div className="w-96">
              <div className="nintendo-card p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-gray-900">Cart</h3>
                  <span className="nintendo-badge nintendo-badge-info">{cart.length} items</span>
                </div>
                
                <div className="space-y-3 mb-4 max-h-80 overflow-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Cart is empty</p>
                      <p className="text-sm text-gray-400">Click products to add them</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-lg">
                          🔧
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-900">{item.name}</p>
                          <p className="text-sm text-[#E60012] font-semibold">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} 
                            className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-bold">{item.quantity}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} 
                            className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} 
                            className="w-8 h-8 bg-[#E60012]/10 text-[#E60012] rounded-lg flex items-center justify-center hover:bg-[#E60012]/20 transition-colors ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t-2 border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Tax (9%)</span>
                    <span className="font-bold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl pt-2 border-t-2 border-gray-100">
                    <span className="font-bold">Total</span>
                    <span className="font-extrabold text-[#E60012]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handlePayment("cash")}
                    className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Banknote className="w-5 h-5 text-[#7AC143]" />
                    <span className="text-xs font-bold text-gray-700">Cash</span>
                  </button>
                  <button 
                    onClick={() => handlePayment("card")}
                    className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <CreditCard className="w-5 h-5 text-[#0AB5CD]" />
                    <span className="text-xs font-bold text-gray-700">Card</span>
                  </button>
                  <button 
                    onClick={() => handlePayment("mobile")}
                    className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Smartphone className="w-5 h-5 text-[#9B59B6]" />
                    <span className="text-xs font-bold text-gray-700">Mobile</span>
                  </button>
                </div>

                <Button className="w-full mt-4" size="lg" onClick={() => handlePayment("cash")}>
                  <Receipt className="w-5 h-5 mr-2" />
                  Generate Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Process Payment" size="md">
          <div className="space-y-5">
            <div className="flex gap-3">
              {[
                { id: "cash", icon: Banknote, label: "Cash", color: "text-[#7AC143]" },
                { id: "card", icon: CreditCard, label: "Card", color: "text-[#0AB5CD]" },
                { id: "mobile", icon: Smartphone, label: "Mobile", color: "text-[#9B59B6]" },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id 
                        ? "border-[#E60012] bg-[#E60012]/5" 
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${method.color}`} />
                    <span className="font-bold text-gray-900">{method.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (9%)</span>
                <span className="font-bold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-[#E60012]">${total.toFixed(2)}</span>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cash Received</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Enter amount"
                  className="nintendo-input text-xl font-bold"
                />
                {cashReceived && parseFloat(cashReceived) >= total && (
                  <div className="mt-2 p-3 bg-[#7AC143]/10 rounded-xl flex justify-between">
                    <span className="font-medium text-[#7AC143]">Change</span>
                    <span className="font-extrabold text-[#7AC143]">${change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="p-4 bg-[#0AB5CD]/10 rounded-xl text-center">
                <CreditCard className="w-12 h-12 text-[#0AB5CD] mx-auto mb-2" />
                <p className="font-bold text-gray-900">Insert or Tap Card</p>
                <p className="text-sm text-gray-500">Waiting for card reader...</p>
              </div>
            )}

            {paymentMethod === "mobile" && (
              <div className="p-4 bg-[#9B59B6]/10 rounded-xl text-center">
                <Smartphone className="w-12 h-12 text-[#9B59B6] mx-auto mb-2" />
                <p className="font-bold text-gray-900">Scan QR Code</p>
                <p className="text-sm text-gray-500">Display QR for customer to scan</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={processPayment} disabled={processing}>
                <Check className="w-4 h-4 mr-2" /> {processing ? "Processing..." : "Complete Payment"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Receipt" size="md">
          <div className="space-y-5">
            <div className="text-center border-b border-gray-100 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">Hardware Pro Store</h3>
              <p className="text-gray-500">123 Main Street, Colombo</p>
              <p className="text-sm text-gray-400 mt-2">{new Date().toLocaleString()}</p>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Invoice #</span>
              <span className="font-bold text-[#E60012]">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cashier</span>
              <span className="font-bold">{user?.name || 'Cashier'}</span>
            </div>

            <div className="border-t border-b border-gray-100 py-4 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (9%)</span>
                <span className="font-bold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-[#E60012]">${total.toFixed(2)}</span>
              </div>
              {paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cash Received</span>
                    <span className="font-bold">${parseFloat(cashReceived).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Change</span>
                    <span className="font-bold text-[#7AC143]">${change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>Thank you for shopping with us!</p>
              <p>Visit again soon</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { toast.success("Printing receipt..."); }}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button className="flex-1" onClick={completeTransaction}>
                <Check className="w-4 h-4 mr-2" /> Done
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default POS;
