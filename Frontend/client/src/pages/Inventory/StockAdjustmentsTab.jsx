import { useState, useEffect } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { Plus, ArrowDown, ArrowUp, Hash } from "lucide-react";
import inventoryService from "../../services/inventoryService";
import productService from "../../services/productService";

const REASONS = ["Shrinkage", "Damage", "Found Stock", "Cycle Count Correction", "Return (No Receipt)", "Other"];

export const StockAdjustmentsTab = () => {
    const [logs, setLogs] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState({
        productId: "",
        adjustmentType: "decrease", // increase or decrease
        qty: "",
        reason: "Shrinkage"
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [logData, prodData] = await Promise.all([
                inventoryService.getAdjustments(),
                productService.getAll()
            ]);
            setLogs(logData);
            setProducts(prodData);
        } catch (err) {
            toast.error("Failed to load adjustments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.productId || !formData.qty || !formData.reason) {
            toast.error("All fields are required");
            return;
        }

        const val = parseInt(formData.qty, 10);
        const quantityAdjusted = formData.adjustmentType === 'decrease' ? -val : val;

        if (quantityAdjusted === 0) {
            toast.error("Adjustment cannot be zero");
            return;
        }

        try {
            await inventoryService.createAdjustment({
                productId: parseInt(formData.productId),
                quantityAdjusted,
                reason: formData.reason
            });
            setShowModal(false);
            resetForm();
            loadData();
            toast.success("Inventory adjusted successfully!");
        } catch (err) {
            toast.error("Failed to post adjustment");
        }
    };

    const resetForm = () => setFormData({ productId: "", adjustmentType: "decrease", qty: "", reason: "Shrinkage" });

    const getProductName = (id) => {
        const p = products.find(prod => prod.id === id);
        return p ? p.name : "Unknown Item";
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Stock Adjustment Logs</h2>
                <Button onClick={() => setShowModal(true)} variant="secondary">
                    <Plus className="w-4 h-4 mr-2" /> Log Adjustment
                </Button>
            </div>

            <div className="nintendo-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading logs...</div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Hash className="w-12 h-12 text-gray-300 mb-4" />
                        <p>No stock adjustments found.</p>
                    </div>
                ) : (
                    <table className="nintendo-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Delta</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="text-gray-500">{new Date(log.date).toLocaleString()}</td>
                                    <td className="font-bold">{log.product ? log.product.name : getProductName(log.productId)}</td>
                                    <td>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-md font-bold text-sm ${log.quantityAdjusted < 0 ? 'bg-[#E60012]/10 text-[#E60012]' : 'bg-[#7AC143]/10 text-[#7AC143]'}`}>
                                            {log.quantityAdjusted < 0 ? <ArrowDown className="w-3 h-3 mr-1" /> : <ArrowUp className="w-3 h-3 mr-1" />}
                                            {Math.abs(log.quantityAdjusted)}
                                        </div>
                                    </td>
                                    <td className="font-medium text-gray-700">{log.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Manual Stock Adjustment">
                <div className="space-y-4 pt-2">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Product *</label>
                        <select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} className="nintendo-input w-full">
                            <option value="">Select Item...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.stock})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Direction</label>
                            <select value={formData.adjustmentType} onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })} className="nintendo-input w-full">
                                <option value="decrease">Decrease Stock (-)</option>
                                <option value="increase">Increase Stock (+)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
                            <input type="number" min="1" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} className="nintendo-input w-full" placeholder="e.g. 5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Reason Code *</label>
                        <select value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="nintendo-input w-full">
                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmit}>Submit Adjustment</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
