import { useState, useEffect } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { Plus, CheckCircle, PackageSearch, AlertCircle } from "lucide-react";
import purchaseOrdersService from "../../services/purchaseOrdersService";
import suppliersService from "../../services/suppliersService";
import productService from "../../services/productService";

export const PurchaseOrdersTab = () => {
    const [pos, setPos] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState({
        supplierId: "",
        items: []
    });
    const [selectedProduct, setSelectedProduct] = useState("");
    const [orderQty, setOrderQty] = useState("");
    const [unitCost, setUnitCost] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const [poData, supData, prodData] = await Promise.all([
                purchaseOrdersService.getAll(),
                suppliersService.getAll(),
                productService.getAll(),
            ]);
            setPos(poData);
            setSuppliers(supData);
            setProducts(prodData);
        } catch (err) {
            toast.error("Failed to load PO data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatCurrency = (amt) => new Intl.NumberFormat('en-LK').format(amt || 0);

    const handleAddItem = () => {
        if (!selectedProduct || !orderQty || !unitCost) return;
        const prod = products.find(p => p.id === parseInt(selectedProduct));
        if (!prod) return;

        const newItem = {
            productId: prod.id,
            productName: prod.name,
            quantity: parseInt(orderQty),
            costPrice: parseFloat(unitCost)
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        setSelectedProduct("");
        setOrderQty("");
        setUnitCost("");
    };

    const handleCreatePO = async () => {
        if (!formData.supplierId || formData.items.length === 0) {
            toast.error("Supplier and at least one item are required.");
            return;
        }

        const total = formData.items.reduce((sum, i) => sum + (i.quantity * i.costPrice), 0);

        try {
            await purchaseOrdersService.create({
                supplierId: parseInt(formData.supplierId),
                total,
                items: formData.items
            });
            setShowAddModal(false);
            setFormData({ supplierId: "", items: [] });
            loadData();
            toast.success("Draft PO created successfully.");
        } catch (err) {
            toast.error("Failed to create PO");
        }
    };

    const handleReceivePO = async (id) => {
        try {
            await purchaseOrdersService.updateStatus(id, "Received");
            loadData();
            toast.success("PO Received! Inventory has been updated.");
        } catch (err) {
            toast.error("Failed to receive PO.");
        }
    };

    const calculateTotal = () => formData.items.reduce((sum, i) => sum + (i.quantity * i.costPrice), 0);

    const getSupplierName = (id) => {
        const s = suppliers.find(sup => sup.id === id);
        return s ? s.name : "Unknown";
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Purchase Orders</h2>
                <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4 mr-2" /> Draft PO</Button>
            </div>

            <div className="nintendo-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading POs...</div>
                ) : pos.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <PackageSearch className="w-12 h-12 text-gray-300 mb-4" />
                        <p>No purchase orders found.</p>
                    </div>
                ) : (
                    <table className="nintendo-table">
                        <thead>
                            <tr>
                                <th>PO #</th>
                                <th>Supplier</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pos.map(po => (
                                <tr key={po.id}>
                                    <td className="font-mono font-bold">PO-{po.id.toString().padStart(4, '0')}</td>
                                    <td className="font-bold">{getSupplierName(po.supplierId)}</td>
                                    <td>{new Date(po.orderDate).toLocaleDateString()}</td>
                                    <td className="font-bold text-gray-900">LKR {formatCurrency(po.total)}</td>
                                    <td>
                                        {po.status === 'Draft' && <span className="nintendo-badge nintendo-badge-warning">Draft</span>}
                                        {po.status === 'Received' && <span className="nintendo-badge nintendo-badge-success">Received</span>}
                                    </td>
                                    <td>
                                        {po.status === 'Draft' && (
                                            <Button variant="secondary" onClick={() => handleReceivePO(po.id)}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Receive
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Draft Purchase Order" size="lg">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Supplier *</label>
                        <select value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} className="nintendo-input w-full">
                            <option value="">Select Supplier...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <h4 className="font-bold text-sm mb-3 text-gray-700">Add Order Items</h4>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500">Product</label>
                                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="nintendo-input w-full text-sm">
                                    <option value="">Select...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="text-xs font-bold text-gray-500">Qty</label>
                                <input type="number" min="1" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} className="nintendo-input w-full text-sm" />
                            </div>
                            <div className="w-32">
                                <label className="text-xs font-bold text-gray-500">Unit Cost</label>
                                <input type="number" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="nintendo-input w-full text-sm" />
                            </div>
                            <Button onClick={handleAddItem} variant="secondary">Add</Button>
                        </div>
                    </div>

                    {formData.items.length > 0 && (
                        <div className="mt-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500">
                                        <th className="pb-2">Product</th>
                                        <th className="pb-2 text-right">Qty</th>
                                        <th className="pb-2 text-right">Unit Cost</th>
                                        <th className="pb-2 text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {formData.items.map((it, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2 font-medium bg-transparent">{it.productName}</td>
                                            <td className="py-2 text-right bg-transparent">{it.quantity}</td>
                                            <td className="py-2 text-right bg-transparent">{formatCurrency(it.costPrice)}</td>
                                            <td className="py-2 text-right font-bold bg-transparent">{formatCurrency(it.quantity * it.costPrice)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-gray-200">
                                        <td colSpan="3" className="py-3 text-right font-bold bg-transparent">Grand Total:</td>
                                        <td className="py-3 text-right font-extrabold text-[#E60012] bg-transparent">LKR {formatCurrency(calculateTotal())}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                        <span className="text-xs text-gray-400 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Receiving PO will auto-update inventory</span>
                        <Button onClick={handleCreatePO} disabled={formData.items.length === 0 || !formData.supplierId}>Create Draft PO</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
