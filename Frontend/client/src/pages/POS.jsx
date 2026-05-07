import { useState, useEffect, useRef, useMemo } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { Search, Minus, Plus, Trash2, CreditCard, Banknote, Smartphone, Receipt, ShoppingCart, RefreshCw, Barcode, Check, Printer, Users, UserPlus, Save, Inbox, Tag, UploadCloud, DownloadCloud, Edit3 } from "lucide-react";
import productService from "../services/productService";
import salesService from "../services/salesService";
import customersService from "../services/customersService";
import quotesService from "../services/quotesService";
import { pricingTiersService } from "../services/pricingTiersService";
import { redeemPoints } from "../services/loyaltyService";
import { promotionsService } from "../services/promotionsService";

export const POS = () => {
  const searchInputRef = useRef(null);
  const tenderInputRef = useRef(null);
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCashierPanel, setShowCashierPanel] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [tenders, setTenders] = useState([]);
  const [tenderMethod, setTenderMethod] = useState("Cash");
  const [tenderAmountInput, setTenderAmountInput] = useState("");

  // Focus the tender input exactly when the payment modal is opened
  useEffect(() => {
    if (showPaymentModal) {
      // The Modal conditionally renders its children, so the input might take a tick to mount
      const timer = setTimeout(() => {
        if (tenderInputRef.current) {
          tenderInputRef.current.focus();
          tenderInputRef.current.select(); 
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showPaymentModal]);

  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState("%"); // "%" or "flat"

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [currentSaleId, setCurrentSaleId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [emailingInvoice, setEmailingInvoice] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [shownRecommendations, setShownRecommendations] = useState([]);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const toast = useToast();

  const [showParkModal, setShowParkModal] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [parkSaleName, setParkSaleName] = useState("");
  const [parkedSales, setParkedSales] = useState([]);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [activePromos, setActivePromos] = useState([]);

  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItem, setCustomItem] = useState({ name: "", price: "", quantity: 1 });
  const [manualTaxExempt, setManualTaxExempt] = useState(false);

  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const POINTS_VALUE_RATE = 0.10;

  const categories = ["All", "Tools", "Hardware", "Painting", "Adhesives", "Materials"];

  useEffect(() => {
    const load = async () => {
      setProductsLoading(true);
      try {
        const [prodData, custData, tiersData, promosData] = await Promise.all([
          productService.getAll(),
          customersService.getAll(),
          pricingTiersService.getAll(),
          promotionsService.getActive()
        ]);
        setProducts(prodData);
        setCustomers(custData);
        setPricingTiers(tiersData);
        setActivePromos(promosData);
      } catch (err) {
        toast.error("Failed to load initial data");
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, []);

  // Generate a comma-separated string of unique cart item IDs to track when to re-fetch
  const cartItemIds = useMemo(() => {
    return Array.from(new Set(cart.map(item => item.id))).sort().join(',');
  }, [cart]);

  // Fetch ML recommendations whenever the distinct items in cart changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (cart.length === 0) {
        setRecommendations([]);
        return;
      }
      try {
        // use distinct names for ML query
        const uniqueNames = Array.from(new Set(cart.map(item => item.name)));
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: uniqueNames })
        });
        if (res.ok) {
          const data = await res.json();
          // Map predicted names back to actual product objects from the store inventory
          const recommendedProducts = data.recommendations
            .map(recName => products.find(p => p.name.toUpperCase() === recName.toUpperCase()))
            .filter(Boolean);
          setRecommendations(recommendedProducts);
          setShownRecommendations(recommendedProducts);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      }
    };

    // Only fetch if products are loaded
    if (products.length > 0) {
      fetchRecommendations();
    }
  }, [cartItemIds, products]);

  // Send RL feedback — fire-and-forget (non-blocking)
  const sendRLFeedback = (productName, reward) => {
    fetch("/api/recommendations/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: productName, reward }),
    }).catch(() => {}); // silently ignore errors
  };


  const addToCart = (product, fromRecommendation = false) => {
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
    if (fromRecommendation) {
      // Positive RL reward — user accepted the recommendation
      sendRLFeedback(product.name, 1);
      // Negative reward for the OTHER recommendations that were shown but not picked
      shownRecommendations
        .filter(r => r.id !== product.id)
        .forEach(r => sendRLFeedback(r.name, 0));
    }
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

  const addCustomItem = () => {
    if (!customItem.name || !customItem.price || customItem.quantity <= 0) {
      toast.error("Invalid custom item details");
      return;
    }
    setCart([...cart, {
      id: "custom-" + Date.now(),
      name: customItem.name,
      price: parseFloat(customItem.price),
      quantity: parseInt(customItem.quantity)
    }]);
    setShowCustomItemModal(false);
    setCustomItem({ name: "", price: "", quantity: 1 });
    toast.success("Custom item added");
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch(`/api/promotions/code/${promoCode}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      const data = await res.json();
      setAppliedPromo(data);
      toast.success(`Applied promo: ${data.code}`);

      if (data.type === 'PERCENTAGE') {
        setDiscountType("%");
        setDiscountValue(data.value);
      } else if (data.type === 'FLAT') {
        setDiscountType("flat");
        setDiscountValue(data.value);
      }
      setPromoCode("");
    } catch (err) {
      toast.error(err.message || "Invalid or expired promo code");
    }
  };

  const handleParkSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!parkSaleName.trim()) {
      toast.error("Please enter a name for the parked sale");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/sales/parked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parkSaleName,
          subtotal,
          tax,
          discount: discountType === "%" ? Number(discountValue) : 0,
          discountTotal,
          total,
          customerId: selectedCustomer?.id,
          items: cart.map(item => ({ productId: item.id.toString().startsWith("custom-") ? null : item.id, productName: item.name, quantity: item.quantity, price: item.price }))
        })
      });

      if (!res.ok) throw new Error("Failed to park sale");

      toast.success("Sale parked successfully");
      setCart([]);
      setDiscountValue(0);
      setAppliedPromo(null);
      setSelectedCustomer(null);
      setManualTaxExempt(false);
      setPointsRedeemed(0);
      setShowParkModal(false);
      setParkSaleName("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const openRecallModal = async () => {
    try {
      const res = await fetch("/api/sales/parked");
      if (res.ok) {
        setParkedSales(await res.json());
        setShowRecallModal(true);
      }
    } catch (err) {
      toast.error("Failed to load parked sales");
    }
  };

  const handleRecallSale = async (parked) => {
    const mappedItems = parked.items.map(item => ({
      id: item.productId || "custom-" + Date.now() + Math.random(),
      name: item.productName,
      price: item.price,
      quantity: item.quantity
    }));
    setCart(mappedItems);

    if (parked.customerId) {
      const cust = customers.find(c => c.id === parked.customerId);
      if (cust) setSelectedCustomer(cust);
    }

    await fetch(`/api/sales/parked/${parked.id}`, { method: "DELETE" });

    setShowRecallModal(false);
    toast.success("Sale recalled");
  };

  const handlePriceOverride = (id) => {
    const newPrice = window.prompt("Enter new price:");
    if (!newPrice || isNaN(newPrice)) return;
    const pin = window.prompt("Enter Manager PIN to approve:");
    if (pin !== "1234") {
      toast.error("Invalid Manager PIN");
      return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, price: parseFloat(newPrice) } : item));
    toast.success("Price overridden successfully");
  };

  const isTaxExempt = manualTaxExempt || (selectedCustomer?.taxExempt === true);

  const toggleTaxExempt = () => {
    if (!isTaxExempt) {
      const pin = window.prompt("Enter Manager PIN to waive tax:");
      if (pin !== "1234") {
        toast.error("Invalid Manager PIN");
        return;
      }
      setManualTaxExempt(true);
      toast.success("Tax removed for this transaction");
    } else {
      setManualTaxExempt(false);
      toast.info("Tax calculation restored");
    }
  };

  const getTierMultiplier = () => {
    if (!selectedCustomer) return 1.0;
    const tier = pricingTiers.find(t => t.tierName === selectedCustomer.tier);
    return tier ? tier.multiplier : 1.0;
  };

  const getItemPromo = (item) => {
    if (!item.category) return null;
    return activePromos.find(p => {
      if (!p.applicableCategories) return true; // Storewide if empty
      const cats = p.applicableCategories.split(',').map(c => c.trim().toLowerCase());
      return cats.includes(item.category.toLowerCase());
    });
  };

  const {
    subtotal,
    tax,
    total,
    discountTotal
  } = useMemo(() => {
    let baseSubtotal = 0;
    let seasonalDiscountTotal = 0;

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      baseSubtotal += itemTotal;

      const promo = getItemPromo(item);
      if (promo) {
        const discountPerItem = promo.type === 'PERCENTAGE'
          ? item.price * (promo.value / 100)
          : promo.value;
        seasonalDiscountTotal += discountPerItem * item.quantity;
      }
    });

    const tierMultiplier = getTierMultiplier();
    const tierDiscountAmount = baseSubtotal * (1 - tierMultiplier);
    const subtotalAfterTierAndSeasonal = Math.max(0, baseSubtotal - tierDiscountAmount - seasonalDiscountTotal);

    const promoDiscount = discountType === "%" ? subtotalAfterTierAndSeasonal * (Number(discountValue) / 100) : Number(discountValue);
    const pointsDiscount = pointsRedeemed * POINTS_VALUE_RATE;

    const calcDiscountTotal = tierDiscountAmount + seasonalDiscountTotal + promoDiscount + pointsDiscount;
    const discountedSubtotal = Math.max(0, baseSubtotal - calcDiscountTotal);

    const calcTax = isTaxExempt ? 0 : discountedSubtotal * 0.09;
    const calcTotal = discountedSubtotal + calcTax;

    return {
      subtotal: baseSubtotal,
      tax: calcTax,
      total: calcTotal,
      discountTotal: calcDiscountTotal
    };
  }, [cart, isTaxExempt, discountType, discountValue, pointsRedeemed, selectedCustomer, pricingTiers, activePromos]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleAddTender = () => {
    const amt = parseFloat(tenderAmountInput);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const newTenders = [...tenders, { method: tenderMethod, amount: amt }];
    setTenders(newTenders);
    setTenderAmountInput("");
    
    // Auto-complete if Enter was pressed and total is covered
    const newTotalTendered = newTenders.reduce((sum, t) => sum + t.amount, 0);
    if (Math.round(newTotalTendered * 100) / 100 >= Math.round(total * 100) / 100) {
      // Need a tiny delay for React state (tenders) to update before processPayment reads it
      // Standard practice: we pass the exact tenders to processPayment or let the effect handle it.
      // Easiest is to process payment with the new Tenders directly.
      processPaymentWithTenders(newTenders);
    }
  };

  const processPaymentWithTenders = async (tendersToProcess) => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    const currentTotalTendered = tendersToProcess.reduce((sum, t) => sum + t.amount, 0);
    const currentRemainingBalance = Math.max(0, total - currentTotalTendered);

    if (Math.round(currentTotalTendered * 100) / 100 < Math.round(total * 100) / 100) {
      toast.error(`Insufficient funds. Remaining: LKR ${currentRemainingBalance.toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      const sale = await salesService.create({
        items: cart.map(item => ({ productId: item.id, productName: item.name, quantity: item.quantity, price: item.price })),
        subtotal,
        tax,
        discount: discountType === "%" ? Number(discountValue) : 0,
        discountTotal,
        total,
        paymentMethod: tendersToProcess,
        cashierId: user?.id,
        customerId: selectedCustomer?.id,
      });

      if (pointsRedeemed > 0 && selectedCustomer?.id) {
        await redeemPoints(selectedCustomer.id, pointsRedeemed);
      }

      setInvoiceNumber(`INV-${sale.id}`);
      setCurrentSaleId(sale.id);
      if (selectedCustomer?.email) {
        setCustomerEmail(selectedCustomer.email);
      } else {
        setCustomerEmail("");
      }
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      toast.success("Payment processed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  const processPayment = async () => {
    // If there is an unprocessed valid amount in the input, add it automatically
    let currentTenders = [...tenders];
    const amt = parseFloat(tenderAmountInput);
    if (!isNaN(amt) && amt > 0) {
      currentTenders.push({ method: tenderMethod, amount: amt });
      setTenders(currentTenders);
      setTenderAmountInput("");
    }
    await processPaymentWithTenders(currentTenders);
  };

  const removeTender = (index) => {
    setTenders(tenders.filter((_, i) => i !== index));
  };

  const totalTendered = tenders.reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = Math.max(0, total - totalTendered);
  const change = Math.max(0, totalTendered - total);

  const handlePayment = () => {
    setTenderMethod("Cash");
    setTenders([]);
    setTenderAmountInput(total.toFixed(2));
    setShowPaymentModal(true);
  };

  // processPayment is now defined above

  const handlePrintReceipt = async () => {
    try {
      const receiptData = {
        storeName: storeSettings?.store_name || "Hardware Pro Store",
        items: cart,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      };
      await salesService.printReceipt(receiptData);
      toast.success("Receipt sent to ESC/POS printer successfully!");
    } catch (err) {
      toast.error(err.message + " - Falling back to browser print.");
      window.print();
    }
  };

  const completeTransaction = () => {
    setCart([]);
    setTenders([]);
    setDiscountValue(0);
    setSelectedCustomer(null);
    setManualTaxExempt(false);
    setPointsRedeemed(0);
    setCustomerEmail("");
    setCurrentSaleId(null);
    setShowReceiptModal(false);
    toast.success("Transaction completed!");
  };

  const handleEmailInvoice = async () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!currentSaleId) {
      toast.error("Invalid sale reference");
      return;
    }

    setEmailingInvoice(true);
    try {
      const res = await salesService.emailInvoice(currentSaleId, customerEmail);
      toast.success(res.message || "Invoice sent successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to send invoice email");
    } finally {
      setEmailingInvoice(false);
    }
  };

  const handleSaveQuote = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }
    setProcessing(true);
    try {
      await quotesService.create({
        items: cart.map(item => ({ productId: item.id, productName: item.name, quantity: item.quantity, price: item.price })),
        subtotal,
        tax,
        discount: 0,
        total,
        customerId: selectedCustomer?.id,
      });
      toast.success("Quote generated successfully!");
      setCart([]);
      setSelectedCustomer(null);
      setPointsRedeemed(0);
    } catch (err) {
      toast.error(err.message || "Failed to save quote");
    } finally {
      setProcessing(false);
    }
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if modifying with Ctrl/Cmd/Alt
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "F2":
          e.preventDefault();
          if (searchInputRef.current) searchInputRef.current.focus();
          break;
        case "F4":
          e.preventDefault();
          if (cart.length > 0) setShowParkModal(true);
          break;
        case "F5":
          e.preventDefault();
          openRecallModal();
          break;
        case "F7":
          e.preventDefault();
          setShowCustomItemModal(true);
          break;
        case "F9":
          e.preventDefault();
          if (cart.length > 0) {
            setTenderMethod("Cash");
            handlePayment();
          }
          break;
        case "F10":
          e.preventDefault();
          handleSync();
          break;
        case "Escape":
          setShowPaymentModal(false);
          setShowReceiptModal(false);
          setShowCustomerModal(false);
          setShowParkModal(false);
          setShowRecallModal(false);
          setShowCustomItemModal(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

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
              <Button variant="secondary" onClick={() => setShowParkModal(true)} disabled={cart.length === 0}>
                <Save className="w-4 h-4 mr-2" /> Park
              </Button>
              <Button variant="secondary" onClick={openRecallModal}>
                <DownloadCloud className="w-4 h-4 mr-2" /> Recall
              </Button>
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
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products... (F2)"
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
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat
                        ? "bg-[#E60012] text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {productsLoading ? (
                  <div className="col-span-3 p-8 text-center text-gray-500">Loading products...</div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="nintendo-card p-3 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                      <p className="text-base font-extrabold text-[#E60012]">LKR {product.price?.toFixed(2)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="w-96">
              <div className="nintendo-card p-5 sticky top-6">

                {/* Customer Section */}
                <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-wider">Customer</h3>
                    {selectedCustomer ? (
                      <div>
                        <p className="font-extrabold text-[#E60012]">{selectedCustomer.name}</p>
                        <p className="text-xs text-gray-500">{selectedCustomer.tier} &bull; Bal: LKR {selectedCustomer.accountBalance}</p>
                        <p className="text-xs text-blue-500 font-bold mt-1">Pts: {selectedCustomer.loyaltyPoints} (Value: LKR {(selectedCustomer.loyaltyPoints * POINTS_VALUE_RATE).toFixed(2)})</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 font-medium">Walk-in Customer</p>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowCustomerModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {selectedCustomer ? 'Change' : 'Assign'}
                  </Button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-gray-900">Cart</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowCustomItemModal(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Custom
                    </Button>
                    <span className="nintendo-badge nintendo-badge-info">{cart.length} items</span>
                  </div>
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
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-900 flex items-center gap-2">
                            {item.name}
                            {getItemPromo(item) && (
                              <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                <Tag className="w-3 h-3" /> Promo
                              </span>
                            )}
                          </p>
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
                            onClick={(e) => { e.stopPropagation(); handlePriceOverride(item.id); }}
                            className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center hover:bg-orange-200 transition-colors ml-1"
                            title="Price Override"
                          >
                            <Edit3 className="w-4 h-4" />
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
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600 font-medium flex gap-2">
                      Discount
                      <select className="border border-gray-200 rounded text-xs px-1 bg-white outline-none" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                        <option value="%">%</option>
                        <option value="flat">$</option>
                      </select>
                    </span>
                    <input type="number" className="w-20 border border-gray-200 rounded text-right px-2 py-1 text-sm font-bold outline-none focus:border-[#E60012]" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-sm items-center text-[#E60012]">
                      <span className="font-medium">Discount Amount</span>
                      <span className="font-bold">-${discountTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 text-sm items-center mt-2 pt-2 border-t-2 border-dashed border-gray-100">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      className="flex-1 border border-gray-200 rounded px-2 py-1 outline-none text-xs focus:border-[#E60012]"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button variant="secondary" size="sm" onClick={applyPromoCode}>Apply</Button>
                  </div>
                  {appliedPromo && (
                    <div className="text-xs text-[#7AC143] font-bold mt-1.5 flex justify-between">
                      <span>Promo: {appliedPromo.code}</span>
                      <button onClick={() => { setAppliedPromo(null); setDiscountValue(0); }} className="text-[#E60012]">Remove</button>
                    </div>
                  )}

                  {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                    <div className="flex gap-2 text-sm items-center mt-2 pt-2 border-t-2 border-dashed border-gray-100">
                      <span className="flex-1 text-xs font-bold text-blue-600">
                        Redeem Points (Max {selectedCustomer.loyaltyPoints}):
                      </span>
                      <input
                        type="number"
                        placeholder="Pts"
                        className="w-16 border border-gray-200 rounded px-2 py-1 outline-none text-xs focus:border-blue-500 text-right font-bold"
                        value={pointsRedeemed || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setPointsRedeemed(Math.max(0, Math.min(val, selectedCustomer.loyaltyPoints)));
                        }}
                      />
                    </div>
                  )}

                  <div className="flex justify-between text-sm items-center pt-2">
                    <span className="text-gray-600 font-medium flex items-center gap-2">
                      Tax (9%)
                      {isTaxExempt && <span className="bg-[#7AC143] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">EXEMPT</span>}
                      <button onClick={toggleTaxExempt} className="text-[#0AB5CD] text-[10px] bg-[#0AB5CD]/10 px-1.5 py-0.5 rounded hover:bg-[#0AB5CD]/20 transition-colors" title="Manager Override">
                        {isTaxExempt ? "Restore" : "Remove"}
                      </button>
                    </span>
                    <span className="font-bold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl pt-2 border-t-2 border-gray-100 items-center">
                    <span className="font-bold">Total</span>
                    <span className="font-extrabold text-[#E60012]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setTenderMethod("Cash"); handlePayment(); }}
                    className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Banknote className="w-5 h-5 text-[#7AC143]" />
                    <span className="text-xs font-bold text-gray-700">Cash</span>
                  </button>
                  <button
                    onClick={() => { setTenderMethod("Card"); handlePayment(); }}
                    className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <CreditCard className="w-5 h-5 text-[#0AB5CD]" />
                    <span className="text-xs font-bold text-gray-700">Card</span>
                  </button>
                  <button
                    onClick={() => { setTenderMethod("Mobile"); handlePayment(); }}
                    className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Smartphone className="w-5 h-5 text-[#9B59B6]" />
                    <span className="text-xs font-bold text-gray-700">Mobile</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button variant="secondary" onClick={handleSaveQuote} disabled={cart.length === 0 || processing}>
                    <Save className="w-4 h-4 mr-2" /> Quote
                  </Button>
                  <Button onClick={handlePayment} disabled={cart.length === 0}>
                    <Receipt className="w-4 h-4 mr-2" /> Pay
                  </Button>
                </div>
              </div>

              {/* ML Recommendations Section — RL-powered */}
              {recommendations.length > 0 && (
                <div className="nintendo-card p-5 mt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">✨</span>
                    <h3 className="font-bold text-lg text-gray-900">Suggested Add-ons</h3>
                    <span className="text-xs text-gray-400 font-medium ml-auto">AI-powered</span>
                  </div>
                  <div className="space-y-3">
                    {recommendations.map(product => (
                      <div
                        key={`rec-${product.id}`}
                        onClick={() => addToCart(product, true)}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl cursor-pointer hover:shadow-md transition-all border border-yellow-100"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-sm shadow-sm">
                          🎯
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-900">{product.name}</p>
                          <p className="text-xs text-[#E60012] font-semibold">${product.price.toFixed(2)}</p>
                        </div>
                        <button className="w-8 h-8 bg-white text-[#E60012] rounded-lg flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Process Payment" size="md">
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Due</span>
                <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tendered</span>
                <span className="font-bold text-[#7AC143]">${totalTendered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Remaining</span>
                <span className="font-extrabold text-[#E60012]">${remainingBalance.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-gray-700">Add Tender</h4>
              <div className="flex gap-2">
                <select
                  className="flex-1 nintendo-input"
                  value={tenderMethod}
                  onChange={(e) => setTenderMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile Pay</option>
                  <option value="Check">Check</option>
                  <option value="Store Credit">Store Credit</option>
                  <option value="Financing">Financing</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  ref={tenderInputRef}
                  className="w-32 nintendo-input font-bold"
                  value={tenderAmountInput}
                  onChange={(e) => setTenderAmountInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTender()}
                />
                <Button variant="secondary" onClick={handleAddTender}>Add</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-auto">
              {tenders.map((t, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    {t.method === 'Cash' && <Banknote className="w-4 h-4 text-[#7AC143]" />}
                    {t.method === 'Card' && <CreditCard className="w-4 h-4 text-[#0AB5CD]" />}
                    {t.method === 'Mobile' && <Smartphone className="w-4 h-4 text-[#9B59B6]" />}
                    <span className="font-bold text-gray-700 text-sm">{t.method}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">${t.amount.toFixed(2)}</span>
                    <button onClick={() => removeTender(index)} className="text-[#E60012] hover:bg-[#E60012]/10 p-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {change > 0 && tenders.some(t => t.method === "Cash") && (
              <div className="p-3 bg-[#7AC143]/10 rounded-xl flex justify-between">
                <span className="font-medium text-[#7AC143]">Change Due</span>
                <span className="font-extrabold text-[#7AC143]">${change.toFixed(2)}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="secondary" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={processPayment} disabled={processing || totalTendered < total}>
                <Check className="w-4 h-4 mr-2" /> {processing ? "Processing..." : "Complete"}
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

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Cashier</span>
              <span className="font-medium text-gray-900">{user?.name || 'Cashier'}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Customer</span>
              <span className="font-medium text-gray-900">{selectedCustomer?.name || 'Walk-in Customer'}</span>
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
              {tenders.length > 0 && (
                <div className="pt-2 border-t border-gray-200 mt-2 space-y-1">
                  {tenders.map((t, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.method}</span>
                      <span className="font-bold">${t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {change > 0 && (
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-gray-600">Change Due</span>
                      <span className="font-bold text-[#7AC143]">${change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>Thank you for shopping with us!</p>
              <p>Visit again soon</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="text-sm font-bold text-gray-700 block mb-2">Email Receipt</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="customer@email.com"
                  className="nintendo-input flex-1 text-sm py-2"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={handleEmailInvoice}
                  disabled={emailingInvoice || !customerEmail}
                >
                  {emailingInvoice ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={handlePrintReceipt}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button className="flex-1" onClick={completeTransaction}>
                <Check className="w-4 h-4 mr-2" /> Done
              </Button>
            </div>
          </div>
        </Modal>

        {/* Customer Assignment Modal */}
        <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Assign Customer to Sale" size="md">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:border-[#E60012] focus:bg-white rounded-lg outline-none transition-all"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            <div
              className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center ${!selectedCustomer ? 'border-[#E60012] bg-[#E60012]/5' : 'border-gray-200 hover:bg-gray-50'}`}
              onClick={() => { setSelectedCustomer(null); setShowCustomerModal(false); }}
            >
              <p className="font-bold text-gray-900">Walk-in Customer</p>
              {!selectedCustomer && <Check className="w-5 h-5 text-[#E60012]" />}
            </div>

            {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch))).map(c => (
              <div
                key={c.id}
                className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center ${selectedCustomer?.id === c.id ? 'border-[#E60012] bg-[#E60012]/5' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
              >
                <div>
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.tier} &bull; Bal: LKR {c.accountBalance} &bull; Pts: {c.loyaltyPoints || 0}</p>
                </div>
                {selectedCustomer?.id === c.id && <Check className="w-5 h-5 text-[#E60012]" />}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>Close</Button>
          </div>
        </Modal>

        {/* Custom Item Modal */}
        <Modal isOpen={showCustomItemModal} onClose={() => setShowCustomItemModal(false)} title="Add Custom Item" size="md">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Item Name</label>
              <input type="text" className="nintendo-input w-full" value={customItem.name} onChange={e => setCustomItem({ ...customItem, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Price (LKR)</label>
                <input type="number" className="nintendo-input w-full" value={customItem.price} onChange={e => setCustomItem({ ...customItem, price: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Quantity</label>
                <input type="number" className="nintendo-input w-full" value={customItem.quantity} onChange={e => setCustomItem({ ...customItem, quantity: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={addCustomItem}>Add to Cart</Button>
            </div>
          </div>
        </Modal>

        {/* Park Sale Modal */}
        <Modal isOpen={showParkModal} onClose={() => setShowParkModal(false)} title="Park Sale" size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Suspend this transaction to complete it later.</p>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Reference Name</label>
              <input
                type="text"
                placeholder="e.g. John's Layaway"
                className="nintendo-input w-full"
                value={parkSaleName}
                onChange={e => setParkSaleName(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="secondary" onClick={() => setShowParkModal(false)}>Cancel</Button>
              <Button onClick={handleParkSale} disabled={processing || !parkSaleName.trim()}>Park Sale</Button>
            </div>
          </div>
        </Modal>

        {/* Recall Sale Modal */}
        <Modal isOpen={showRecallModal} onClose={() => setShowRecallModal(false)} title="Recall Parked Sale" size="md">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {parkedSales.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No parked sales found.</p>
            ) : (
              parkedSales.map(sale => (
                <div key={sale.id} className="p-4 border rounded-xl hover:border-[#E60012] transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleRecallSale(sale)}>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{sale.name}</h4>
                    <p className="text-sm text-gray-500">{new Date(sale.createdAt).toLocaleString()} &bull; {sale.items?.length || 0} items</p>
                  </div>
                  <div className="font-extrabold text-[#E60012]">
                    ${sale.total.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default POS;
