import { useState, useEffect } from "react";
import { Button } from "../../components/Button";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { Search, Plus, Edit, Trash2, Save, Building } from "lucide-react";
import suppliersService from "../../services/suppliersService";

export const SuppliersTab = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: ""
    });
    const toast = useToast();

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const data = await suppliersService.getAll();
            setSuppliers(data);
        } catch (err) {
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleCreate = async () => {
        if (!formData.name) {
            toast.error("Supplier Name is required");
            return;
        }
        try {
            await suppliersService.create(formData);
            setShowAddModal(false);
            resetForm();
            loadSuppliers();
            toast.success("Supplier created successfully!");
        } catch (err) {
            toast.error("Failed to create supplier");
        }
    };

    const handleEdit = async () => {
        if (!formData.name) {
            toast.error("Supplier Name is required");
            return;
        }
        try {
            await suppliersService.update(selectedSupplier.id, formData);
            setShowEditModal(false);
            setSelectedSupplier(null);
            resetForm();
            loadSuppliers();
            toast.success("Supplier updated successfully!");
        } catch (err) {
            toast.error("Failed to update supplier");
        }
    };

    const handleDelete = async () => {
        try {
            await suppliersService.delete(selectedSupplier.id);
            setSelectedSupplier(null);
            setShowDeleteDialog(false);
            loadSuppliers();
            toast.success("Supplier deleted successfully!");
        } catch (err) {
            toast.error("Failed to delete supplier");
        }
    };

    const openEditModal = (sup) => {
        setSelectedSupplier(sup);
        setFormData({
            name: sup.name,
            contactName: sup.contactName || "",
            email: sup.email || "",
            phone: sup.phone || "",
            address: sup.address || ""
        });
        setShowEditModal(true);
    };

    const openDeleteDialog = (sup) => {
        setSelectedSupplier(sup);
        setShowDeleteDialog(true);
    };

    const resetForm = () => {
        setFormData({ name: "", contactName: "", email: "", phone: "", address: "" });
    };

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="nintendo-input pl-12 w-80"
                    />
                </div>
                <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Supplier
                </Button>
            </div>

            <div className="nintendo-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading suppliers...</div>
                ) : (
                    <table className="nintendo-table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Contact</th>
                                <th>Contact Info</th>
                                <th>Address</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((sup) => (
                                <tr key={sup.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Building className="w-5 h-5 text-gray-500" /></div>
                                            <span className="font-bold text-gray-900">{sup.name}</span>
                                        </div>
                                    </td>
                                    <td className="font-medium text-gray-700">{sup.contactName || "-"}</td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-500">{sup.phone || "No phone"}</span>
                                            <span className="text-sm text-gray-500">{sup.email || "No email"}</span>
                                        </div>
                                    </td>
                                    <td className="text-sm text-gray-600 max-w-[200px] truncate">{sup.address || "-"}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(sup)} className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                                                <Edit className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <button onClick={() => openDeleteDialog(sup)} className="w-9 h-9 bg-[#E60012]/10 rounded-lg flex items-center justify-center hover:bg-[#E60012]/20">
                                                <Trash2 className="w-4 h-4 text-[#E60012]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">No suppliers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Supplier" size="lg">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Company Name *</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="nintendo-input w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact Name</label>
                            <input type="text" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} className="nintendo-input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="nintendo-input w-full" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="nintendo-input w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                        <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="nintendo-input w-full h-24" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleCreate}><Save className="w-4 h-4 mr-2" /> Save Supplier</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Supplier" size="lg">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Company Name *</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="nintendo-input w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact Name</label>
                            <input type="text" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} className="nintendo-input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="nintendo-input w-full" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="nintendo-input w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                        <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="nintendo-input w-full h-24" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleEdit}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                message={`Delete ${selectedSupplier?.name}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};
