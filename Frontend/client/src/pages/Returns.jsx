import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { useToast } from "../components/Toast";
import { Search, History, RefreshCcw, Lock, Info, CheckCircle2, Ticket } from "lucide-react";
import salesService from "../services/salesService";
import returnsService from "../services/returnsService";
import { Modal } from "../components/Modal";

export const Returns = () => {
    const [searchId, setSearchId] = useState("");
    const [loading, setLoading] = useState(false);
    const [sale, setSale] = useState(null);
    const [returns, setReturns] = useState([]);

    const [returnItems, setReturnItems] = useState([]);
    const [returnReason, setReturnReason] = useState("Customer Return");
    const [issueStoreCredit, setIssueStoreCredit] = useState(false);

    const [showVoidModal, setShowVoidModal] = useState(false);
    const [managerPin, setManagerPin] = useState("");
    const [voiding, setVoiding] = useState(false);

    const toast = useToast();

    const searchSale = async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            const data = await salesService.getById(searchId.replace(/\D/g, ''));
            setSale(data);
            if (data) {
                setReturnItems(data.items.map(i => ({ ...i, returnQty: 0, restockFee: 0 })));
                const pastReturns = await returnsService.getBySaleId(data.id);
                setReturns(pastReturns);
            }
        } catch (err) {
            toast.error(err.message || "Sale not found");
            setSale(null);
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (itemId, qty) => {
        setReturnItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const val = Math.max(0, Math.min(qty, item.quantity));
                return { ...item, returnQty: val };
            }
            return item;
        }));
    };

    const getTotalRefund = () => {
        return returnItems.reduce((sum, item) => sum + (item.price * item.returnQty) - item.restockFee, 0);
    };

    const processReturn = async () => {
        const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
        if (itemsToReturn.length === 0) {
            toast.error("Select at least 1 item to return");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                saleId: sale.id,
                customerId: sale.customerId,
                reason: returnReason,
                issueStoreCredit,
                items: itemsToReturn.map(i => ({
                    productId: i.productId,
                    quantity: i.returnQty,
                    restockFee: i.restockFee,
                    refundAmount: (i.price * i.returnQty) - i.restockFee
                }))
            };

            await returnsService.create(payload);
            toast.success(issueStoreCredit ? "Return processed with Store Credit" : "Return processed successfully");
            searchSale(); // Refresh sale data
        } catch (err) {
            toast.error(err.message || "Failed to process return");
        } finally {
            setLoading(false);
        }
    };

    const processVoid = async () => {
        if (!managerPin) {
            toast.error("Manager PIN is required");
            return;
        }
        setVoiding(true);
        try {
            await salesService.voidSale(sale.id, managerPin);
            toast.success("Sale voided successfully");
            setShowVoidModal(false);
            searchSale();
        } catch (err) {
            toast.error(err.message || "Invalid PIN or failed to void");
        } finally {
            setVoiding(false);
            setManagerPin("");
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
            <Sidebar />
            <main className="flex-1 ml-[0px]">
                <Navbar title="Returns & Exchanges" />

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    <div className="nintendo-card p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Search className="w-6 h-6 text-[#E60012]" />
                            Lookup Receipt
                        </h2>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Scan Barcode or enter Invoice ID (e.g. INV-1024)"
                                className="flex-1 nintendo-input text-lg font-bold tracking-wide"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchSale()}
                            />
                            <Button onClick={searchSale} disabled={loading || !searchId}>
                                {loading ? "Searching..." : "Lookup"}
                            </Button>
                        </div>
                    </div>

                    {sale && (
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 space-y-6">
                                <div className="nintendo-card p-6">
                                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 leading-tight">Invoice #{sale.id}</h3>
                                            <p className="text-sm text-gray-500">{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "Date not available"}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${sale.status === 'Voided' ? 'bg-red-100 text-red-700' :
                                                sale.status === 'Refunded' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {sale.status?.toUpperCase() || "COMPLETED"}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Total: ${Number(sale.total).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <History className="w-5 h-5 text-gray-400" />
                                        Eligible Items for Return
                                    </h3>

                                    <div className="space-y-3">
                                        {returnItems.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900">{item.productName}</p>
                                                    <p className="text-sm text-gray-500">${Number(item.price).toFixed(2)} each (Qty on Receipt: {item.quantity})</p>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Return Qty</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            value={item.returnQty}
                                                            disabled={sale.status === 'Voided'}
                                                            onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                                                            className="w-16 nintendo-input font-bold text-center py-1"
                                                        />
                                                    </div>
                                                    <div className="text-right min-w-[80px]">
                                                        <p className="font-extrabold text-[#E60012]">${(item.price * item.returnQty).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {returns.length > 0 && (
                                    <div className="nintendo-card p-6 bg-orange-50 border-orange-100">
                                        <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                                            <Info className="w-5 h-5 text-orange-500" />
                                            Past Returns on this Receipt
                                        </h3>
                                        <div className="space-y-3">
                                            {returns.map(ret => (
                                                <div key={ret.id} className="p-3 bg-white rounded-lg border border-orange-200">
                                                    <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                                                        <span>Return #{ret.id} • {ret.timestamp ? new Date(ret.timestamp).toLocaleDateString() : "N/A"}</span>
                                                        <span className="text-[#E60012]">Refunded: ${Number(ret.totalRefunded).toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">Reason: {ret.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="nintendo-card p-6 sticky top-6">
                                    <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Return Options</h3>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Reason for Return</label>
                                            <select
                                                className="nintendo-input w-full"
                                                value={returnReason}
                                                onChange={(e) => setReturnReason(e.target.value)}
                                                disabled={sale.status === 'Voided'}
                                            >
                                                <option>Customer Return</option>
                                                <option>Defective / Damaged</option>
                                                <option>Wrong Item Error</option>
                                                <option>Manager Adjustment</option>
                                            </select>
                                        </div>

                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                            <Ticket className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900">
                                                    <input
                                                        type="checkbox"
                                                        checked={issueStoreCredit}
                                                        onChange={(e) => setIssueStoreCredit(e.target.checked)}
                                                        disabled={!sale.customerId || sale.status === 'Voided'}
                                                        className="w-4 h-4 rounded text-blue-600 border-gray-300"
                                                    />
                                                    Issue Store Credit
                                                </label>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    {!sale.customerId ? "Customer account required to issue Store Credit" : "Funds will be deposited into the attached customer account."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-dashed border-gray-200 pt-4 mb-6">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Refund Due</span>
                                            <span className="text-3xl font-extrabold text-[#E60012]">${getTotalRefund().toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mb-3"
                                        size="lg"
                                        onClick={processReturn}
                                        disabled={getTotalRefund() <= 0 || loading || sale.status === 'Voided'}
                                    >
                                        <RefreshCcw className="w-5 h-5 mr-2" /> Process Return
                                    </Button>

                                    <button
                                        onClick={() => setShowVoidModal(true)}
                                        disabled={sale.status === 'Voided'}
                                        className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 bg-white border-2 border-red-100 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Lock className="w-4 h-4" /> Void Entire Sale
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Modal isOpen={showVoidModal} onClose={() => setShowVoidModal(false)} title="Void Transaction">
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
                            <p className="font-bold flex items-center gap-2 mb-1">
                                <Lock className="w-5 h-5" /> Manager Authorization Required
                            </p>
                            <p className="text-sm">Voiding this sale will reverse all items, taxes, and customer balances. It cannot be undone.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Manager PIN</label>
                            <input
                                type="password"
                                className="nintendo-input text-2xl font-black text-center tracking-widest"
                                placeholder="****"
                                maxLength={4}
                                value={managerPin}
                                onChange={(e) => setManagerPin(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowVoidModal(false)}>Cancel</Button>
                            <button
                                onClick={processVoid}
                                disabled={voiding || managerPin.length < 4}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-sm disabled:opacity-50 transition-colors"
                            >
                                {voiding ? "Voiding..." : "Confirm Void"}
                            </button>
                        </div>
                    </div>
                </Modal>

            </main>
        </div>
    );
};
