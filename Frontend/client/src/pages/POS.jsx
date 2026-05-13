import { useState, useEffect, useRef, useMemo } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { Search, Minus, Plus, Trash2, CreditCard, Banknote, Smartphone, Receipt, ShoppingCart, RefreshCw, Barcode, Check, Printer, Users, UserPlus, Save, Inbox, Tag, UploadCloud, DownloadCloud, Edit3, Wrench, Package, LayoutDashboard } from "lucide-react";
import productService from "../services/productService";
import salesService from "../services/salesService";
import customersService from "../services/customersService";
import quotesService from "../services/quotesService";
import { pricingTiersService } from "../services/pricingTiersService";
import { redeemPoints } from "../services/loyaltyService";
import { storeService } from "../services/storeService";
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
  const [storeSettings, setStoreSettings] = useState({});
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

  const [showTaxSettingsModal, setShowTaxSettingsModal] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState("");
  const [editingTaxEnabled, setEditingTaxEnabled] = useState(true);

  const categories = ["Tools", "Hardware", "Painting", "Adhesives", "Materials"];


  useEffect(() => {
    const load = async () => {
      setProductsLoading(true);
      try {
        const [prodData, custData, tiersData, promosData, settingsData] = await Promise.all([
          productService.getAll(),
          customersService.getAll(),
          pricingTiersService.getAll(),
          promotionsService.getActive(),
          storeService.getAll()
        ]);
        setProducts(Array.isArray(prodData) ? prodData : []);
        setCustomers(Array.isArray(custData) ? custData : []);
        setPricingTiers(Array.isArray(tiersData) ? tiersData : []);
        setActivePromos(Array.isArray(promosData) ? promosData : []);
        setStoreSettings(settingsData || {});
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

  const handleUpdateTaxSettings = async () => {
    try {
      const updated = await storeService.update({
        tax_rate: editingTaxRate,
        tax_enabled: String(editingTaxEnabled)
      });
      setStoreSettings(updated);
      setShowTaxSettingsModal(false);
      toast.success("Tax settings updated permanently");
    } catch (err) {
      toast.error("Failed to update tax settings");
    }
  };

  const openTaxSettings = () => {
    setEditingTaxRate(storeSettings?.tax_rate || "9");
    setEditingTaxEnabled(storeSettings?.tax_enabled !== "false");
    setShowTaxSettingsModal(true);
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
      id: "custom-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      name: customItem.name,
      price: parseFloat(customItem.price) || 0,
      quantity: parseInt(customItem.quantity) || 1
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
    if (!selectedCustomer || !Array.isArray(pricingTiers)) return 1.0;
    const tier = pricingTiers.find(t => t && t.tierName === selectedCustomer.tier);
    return tier ? tier.multiplier : 1.0;
  };

  const getItemPromo = (item) => {
    if (!item?.category || !Array.isArray(activePromos)) return null;
    return activePromos.find(p => {
      if (!p || !p.applicableCategories) return true; // Storewide if empty
      const cats = String(p.applicableCategories).split(',').map(c => c.trim().toLowerCase());
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
    cart.forEach(item => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      const itemTotal = price * qty;
      baseSubtotal += itemTotal;
    });


    const tierMultiplier = getTierMultiplier();
    const tierDiscountAmount = baseSubtotal * (1 - tierMultiplier);
    const subtotalAfterTier = Math.max(0, baseSubtotal - tierDiscountAmount);

    const promoDiscount = discountType === "%" ? subtotalAfterTier * (Number(discountValue) / 100) : Number(discountValue);
    const pointsDiscount = pointsRedeemed * POINTS_VALUE_RATE;

    const calcDiscountTotal = tierDiscountAmount + promoDiscount + pointsDiscount;
    const discountedSubtotal = Math.max(0, baseSubtotal - calcDiscountTotal);

    const currentTaxRate = parseFloat(storeSettings?.tax_rate || "9") / 100;
    const isTaxGloballyEnabled = storeSettings?.tax_enabled !== "false";
    const calcTax = (isTaxExempt || !isTaxGloballyEnabled) ? 0 : discountedSubtotal * currentTaxRate;
    const calcTotal = discountedSubtotal + calcTax;

    const finalSubtotal = Math.round(baseSubtotal * 100) / 100;
    const finalTax = Math.round(calcTax * 100) / 100;
    const finalTotal = Math.round(calcTotal * 100) / 100;
    const finalDiscountTotal = Math.round(calcDiscountTotal * 100) / 100;

    return {
      subtotal: finalSubtotal || 0,
      tax: finalTax || 0,
      total: finalTotal || 0,
      discountTotal: finalDiscountTotal || 0
    };

  }, [cart, manualTaxExempt, discountType, discountValue, pointsRedeemed, selectedCustomer, pricingTiers, activePromos, storeSettings]);

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

    // Trader validation: Must have a customer selected
    if (["Trade", "Trader"].includes(tenderMethod) && !selectedCustomer) {
      toast.error("Please assign a customer for Trader Account payments");
      setShowCustomerModal(true);
      return;
    }

    const newTenders = [...tenders, { method: tenderMethod, amount: amt }];
    setTenders(newTenders);
    setTenderAmountInput("");
    
    // Auto-complete removed as per user request to allow multiple manual tenders
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

    // Final validation before processing
    const hasTraderTender = tendersToProcess.some(t => ["Trade", "Trader"].includes(t.method));
    if (hasTraderTender && !selectedCustomer) {
      toast.error("A customer must be assigned for Trader payments");
      setShowCustomerModal(true);
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

  const handlePayment = (method = "Cash") => {
    setTenderMethod(method);
    setTenders([]);
    setTenderAmountInput(total.toFixed(2));
    setShowPaymentModal(true);
  };

  const handleQuickPay = async (method) => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    if ((method === "Trade" || method === "Trader") && !selectedCustomer) {
      toast.error("Please assign a customer for Trade Account payments");
      setShowCustomerModal(true);
      return;
    }
    
    // Auto-process with the full amount for this method
    const tendersToProcess = [{ method, amount: total }];
    await processPaymentWithTenders(tendersToProcess);
  };



  // Consolidated Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if modifying with Ctrl/Cmd/Alt EXCEPT for our specific combos
      if ((e.ctrlKey || e.metaKey || e.altKey) && !(e.ctrlKey && e.altKey && e.key === 'c')) return;

      if (['F1', 'F2', 'F4', 'F5', 'F7', 'F8', 'F9', 'F10', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'F1':
          searchInputRef.current?.focus();
          break;
        case 'F2':
          setShowCustomerModal(true);
          break;
        case 'F4':
          if (cart.length > 0) setShowParkModal(true);
          break;
        case 'F5':
          openRecallModal();
          break;
        case 'F7':
          setShowCustomItemModal(true);
          break;
        case 'F8':
          if (cart.length > 0) handleSaveQuote();
          break;
        case 'F9':
          if (cart.length > 0) handlePayment("Cash");
          break;
        case 'F10':
          if (showPaymentModal && totalTendered >= total) {
            processPayment();
          } else {
            handleSync();
          }
          break;
        case 'Escape':
          setShowCustomerModal(false);
          setShowPaymentModal(false);
          setShowReceiptModal(false);
          setShowParkModal(false);
          setShowRecallModal(false);
          setShowCustomItemModal(false);
          setShowTaxSettingsModal(false);
          break;
        case 'c':
          if (e.ctrlKey && e.altKey) {
            if (confirm("Clear entire cart?")) setCart([]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showPaymentModal, totalTendered, total]);

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



  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar title="Point of Sale" />

        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
          <div className="flex items-center justify-between shrink-0 mb-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E60012] to-[#FF6B6B] rounded-lg flex items-center justify-center text-white font-black text-xs shadow">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{user?.name || 'Cashier'}</p>
                  <p className="text-[10px] text-gray-500">{user?.role || 'Register'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1.5 bg-[#7AC143]/10 rounded-lg">
                <div className="w-1.5 h-1.5 bg-[#7AC143] rounded-full animate-pulse" />
                <span className="font-medium text-[#7AC143] text-xs">Online</span>
              </div>

            </div>
            
            {/* Utility Buttons aligned to the right */}
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" className="h-8 text-[10px] px-2" onClick={() => setShowParkModal(true)} disabled={cart.length === 0}>
                <Save className="w-3 h-3 mr-1" /> Park
              </Button>
              <Button variant="secondary" size="sm" className="h-8 text-[10px] px-2" onClick={openRecallModal}>
                <DownloadCloud className="w-3 h-3 mr-1" /> Recall
              </Button>
              <Button variant="secondary" size="sm" className="h-8 text-[10px] px-2" onClick={handleScanBarcode}>
                <Barcode className="w-3 h-3 mr-1" /> Scan
              </Button>
              <Button variant="secondary" size="sm" className="h-8 text-[10px] px-2" onClick={handleSync}>
                <RefreshCw className="w-3 h-3 mr-1" /> Sync
              </Button>
            </div>
          </div>



          <div className="flex gap-3 flex-1 overflow-hidden min-h-0">
            {/* ─── Products Panel ─── */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Search + Categories — compact single bar */}
              <div className="nintendo-card p-3 mb-2 shrink-0">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="nintendo-input pl-10 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-1 no-print">
                    {["All", ...categories].map((cat) => {
                      const Icon = cat === 'Tools' ? Wrench : cat === 'Hardware' ? Package : cat === 'Painting' ? Tag : LayoutDashboard;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 whitespace-nowrap ${selectedCategory === cat
                            ? "bg-[#E60012] text-white shadow"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                            }`}
                        >
                          {cat !== 'All' && <Icon className="w-3.5 h-3.5" />}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Grid — scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {productsLoading ? (
                    <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200 font-medium">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" />
                      Loading products...
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="nintendo-card p-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-[#E60012] text-white p-1 rounded-md shadow">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-base shadow-inner group-hover:bg-[#E60012]/5 transition-colors shrink-0">
                            {product.category === 'Tools' ? '🛠️' : product.category === 'Hardware' ? '🔩' : product.category === 'Painting' ? '🎨' : '📦'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm leading-tight group-hover:text-[#E60012] transition-colors truncate">{product.name}</p>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">{product.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs font-extrabold text-[#E60012]">LKR {product.price?.toLocaleString()}</p>
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${product.stock > 10 ? 'bg-green-50 text-green-600' : product.stock > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                            {product.stock > 0 ? `${product.stock} left` : 'Out'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ─── Cart Panel ─── */}
            <div className="w-[420px] shrink-0 flex flex-col overflow-hidden min-h-0">
              <div className="nintendo-card p-4 flex flex-col flex-1 overflow-hidden min-h-0">

                {/* Customer Section */}
                {/* Customer + Cart header — compact */}
                <div className="mb-2 pb-2 border-b border-dashed border-gray-100 flex items-center justify-between shrink-0">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-[10px] uppercase tracking-wider">Customer</h3>
                    {selectedCustomer ? (
                      <div>
                        <p className="font-extrabold text-[#E60012] text-sm leading-tight truncate">{selectedCustomer.name}</p>
                        <p className="text-[10px] text-gray-500">{selectedCustomer.tier} · Pts: {selectedCustomer.loyaltyPoints}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 font-medium">Walk-in</p>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowCustomerModal(true)}>
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    {selectedCustomer ? 'Change' : 'Assign'}
                  </Button>
                </div>

                <div className="flex items-center justify-between mb-2 shrink-0 gap-1.5">
                  <h3 className="font-bold text-sm text-gray-900 uppercase tracking-tighter">Current Cart</h3>
                  <div className="flex items-center gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => setShowCustomItemModal(true)}>
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> Custom
                    </Button>
                    <span className="nintendo-badge nintendo-badge-info text-[10px]">{cart.length}</span>
                  </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <ShoppingCart className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium text-sm">Cart is empty</p>
                      <p className="text-xs text-gray-400">Click products to add</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-1.5 p-2 bg-white border border-gray-100 rounded-xl hover:border-[#E60012]/30 transition-all group">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs leading-tight group-hover:text-[#E60012] transition-colors truncate">
                            {item.name}
                            {getItemPromo(item) && (
                              <span className="inline-flex items-center ml-1 bg-yellow-100 text-yellow-800 text-[8px] uppercase font-black px-1 py-0.5 rounded">
                                <Tag className="w-2 h-2 mr-0.5" /> Promo
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] font-extrabold text-[#E60012]">LKR {(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-md border border-gray-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                            className="w-6 h-6 bg-white border-r border-gray-200 rounded-l-md flex items-center justify-center hover:bg-[#E60012] hover:text-white transition-all active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-black text-gray-900 text-[11px]">{item.quantity}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                            className="w-6 h-6 bg-white border-l border-gray-200 rounded-r-md flex items-center justify-center hover:bg-[#7AC143] hover:text-white transition-all active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePriceOverride(item.id); }}
                          className="w-6 h-6 bg-orange-50 text-orange-600 rounded-md flex items-center justify-center hover:bg-orange-100 transition-colors"
                          title="Price Override"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="w-6 h-6 bg-red-50 text-[#E60012] rounded-md flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t-2 border-gray-100 pt-2 space-y-1.5 shrink-0">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900">LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600 font-medium flex gap-2">
                      Discount
                      <select className="border border-gray-200 rounded text-xs px-1 bg-white outline-none" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                        <option value="%">%</option>
                        <option value="flat">LKR</option>
                      </select>
                    </span>
                    <input type="number" className="w-24 border border-gray-200 rounded text-right px-2 py-1 text-sm font-bold outline-none focus:border-[#E60012]" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-sm items-center text-[#E60012] bg-[#E60012]/5 p-2 rounded-lg mt-1">
                      <span className="font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> Discount</span>
                      <span className="font-bold">-LKR {discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                      Tax ({storeSettings?.tax_rate || "9"}%)
                      {isTaxExempt && <span className="bg-[#7AC143] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">EXEMPT</span>}
                      <button onClick={toggleTaxExempt} className="text-[#0AB5CD] text-[10px] bg-[#0AB5CD]/10 px-1.5 py-0.5 rounded hover:bg-[#0AB5CD]/20 transition-colors" title="Temporary Exemption">
                        {isTaxExempt ? "Restore" : "Remove"}
                      </button>
                      <button onClick={openTaxSettings} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors" title="Permanent Tax Settings">
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-bold text-gray-500">LKR {tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>


                  <div className="flex justify-between text-lg pt-2 border-t-4 border-double border-gray-100 items-center">
                    <span className="font-extrabold text-gray-900 uppercase tracking-tighter">Total</span>
                    <span className="font-black text-[#E60012]">LKR {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                </div>

                <div className="mt-2 grid grid-cols-3 gap-1.5 shrink-0">
                  <button
                    onClick={() => handleQuickPay("Cash")}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-[#7AC143]/20 rounded-xl hover:bg-[#7AC143]/10 hover:border-[#7AC143] transition-all group active:scale-95"
                    title="Quick Pay with Cash"
                  >
                    <Banknote className="w-5 h-5 text-[#7AC143] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-700">Cash</span>
                  </button>
                  <button
                    onClick={() => handleQuickPay("Card")}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-[#0AB5CD]/20 rounded-xl hover:bg-[#0AB5CD]/10 hover:border-[#0AB5CD] transition-all group active:scale-95"
                    title="Quick Pay with Card"
                  >
                    <CreditCard className="w-5 h-5 text-[#0AB5CD] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-700">Card</span>
                  </button>
                  <button
                    onClick={() => handleQuickPay("Mobile")}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-[#9B59B6]/20 rounded-xl hover:bg-[#9B59B6]/10 hover:border-[#9B59B6] transition-all group active:scale-95"
                    title="Quick Pay with Mobile"
                  >
                    <Smartphone className="w-5 h-5 text-[#9B59B6] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-700">Mobile</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 shrink-0">
                  <Button variant="secondary" onClick={() => handleSaveQuote()} disabled={cart.length === 0 || processing}>
                    <Save className="w-4 h-4 mr-2" /> Quote
                  </Button>
                  <Button onClick={() => handlePayment("Cash")} disabled={cart.length === 0}>
                    <Receipt className="w-4 h-4 mr-2" /> Pay
                  </Button>
                </div>
              </div>

              {/* ML Recommendations — inline compact strip */}
              {recommendations.length > 0 && (
                <div className="mt-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✨</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Suggested</span>
                    <div className="flex-1 flex gap-1.5 overflow-x-auto">
                      {recommendations.slice(0, 3).map(product => (
                        <button
                          key={`rec-${product.id}`}
                          onClick={() => addToCart(product, true)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg text-xs font-bold text-gray-900 hover:shadow transition-all whitespace-nowrap border border-yellow-200"
                        >
                          <span>🎯</span>
                          <span className="truncate max-w-[80px]">{product.name}</span>
                          <Plus className="w-3 h-3 text-[#E60012] shrink-0" />
                        </button>
                      ))}
                    </div>
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
                <span className="font-bold text-gray-900">LKR {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tendered</span>
                <span className="font-bold text-[#7AC143]">LKR {totalTendered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Remaining</span>
                <span className="font-extrabold text-[#E60012]">LKR {remainingBalance.toFixed(2)}</span>
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
                  <option value="Trader">Trader</option>
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
                <span className="font-extrabold text-[#7AC143]">LKR {change.toLocaleString()}</span>
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

            <div className="bg-gray-50 rounded-2xl p-6 space-y-3 border-2 border-dashed border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest">Subtotal</span>
                <span className="font-bold text-gray-900">LKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest">Tax (9%)</span>
                <span className="font-bold text-gray-900">LKR {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-2xl pt-3 border-t-2 border-gray-200">
                <span className="font-black text-gray-900 uppercase tracking-tighter">Total</span>
                <span className="font-black text-[#E60012]">LKR {total.toLocaleString()}</span>
              </div>
              {tenders.length > 0 && (
                <div className="pt-3 border-t-2 border-gray-200 mt-2 space-y-2">
                  {tenders.map((t, i) => (
                    <div key={i} className="flex justify-between text-xs font-bold text-gray-500">
                      <span className="uppercase tracking-widest">{t.method}</span>
                      <span className="text-gray-900">LKR {t.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {change > 0 && (
                    <div className="flex justify-between text-sm pt-2 bg-[#7AC143]/10 p-2 rounded-lg">
                      <span className="font-bold text-[#7AC143] uppercase tracking-widest">Change Due</span>
                      <span className="font-black text-[#7AC143]">LKR {change.toLocaleString()}</span>
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
                    LKR {sale.total.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>

        {/* Permanent Tax Settings Modal */}
        <Modal isOpen={showTaxSettingsModal} onClose={() => setShowTaxSettingsModal(false)} title="Global Tax Settings" size="md">
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700 flex gap-2">
                <Tag className="w-4 h-4 mt-0.5 shrink-0" />
                These changes will be saved permanently to the store configuration and will affect all future transactions.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">Tax Enabled</h4>
                  <p className="text-xs text-gray-500">Enable or disable tax calculation globally.</p>
                </div>
                <button 
                  onClick={() => setEditingTaxEnabled(!editingTaxEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${editingTaxEnabled ? 'bg-[#7AC143]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${editingTaxEnabled ? 'right-1' : 'left-1'} shadow-sm`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex justify-between">
                  Tax Rate (%)
                  <span className="text-[#E60012] font-black">{editingTaxRate}%</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    className="nintendo-input w-full pr-12"
                    value={editingTaxRate}
                    onChange={(e) => setEditingTaxRate(e.target.value)}
                    placeholder="e.g. 9.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-gray-400">Common rates: 9% (Sales), 18% (VAT), 0% (Tax-Free)</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="secondary" onClick={() => setShowTaxSettingsModal(false)}>Cancel</Button>
              <Button onClick={handleUpdateTaxSettings} disabled={processing}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default POS;
