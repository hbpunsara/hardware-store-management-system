import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { Plus, Search, Tag, Edit2, Trash2, Calendar, Clock, Percent } from "lucide-react";
import { promotionsService } from "../services/promotionsService";

export const Promotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const toast = useToast();

    const [formData, setFormData] = useState({
        code: "",
        type: "PERCENTAGE", // PERCENTAGE, FLAT
        value: "",
        minQty: "0",
        startDate: "",
        endDate: "",
        applicableCategories: "",
        status: "Active"
    });

    const loadPromotions = async () => {
        try {
            setLoading(true);
            const data = await promotionsService.getAll();
            setPromotions(data);
        } catch (error) {
            toast.error("Failed to load promotions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPromotions();
    }, []);

    const handleOpenModal = (promo = null) => {
        if (promo) {
            setFormData({
                code: promo.code || "",
                type: promo.type || "PERCENTAGE",
                value: String(promo.value || ""),
                minQty: String(promo.minQty || "0"),
                startDate: promo.startDate ? promo.startDate.substring(0, 10) : "", // Format for date input
                endDate: promo.endDate ? promo.endDate.substring(0, 10) : "",
                applicableCategories: promo.applicableCategories || "",
                status: promo.status || "Active"
            });
            setSelectedPromo(promo);
        } else {
            setFormData({
                code: "",
                type: "PERCENTAGE",
                value: "",
                minQty: "0",
                startDate: "",
                endDate: "",
                applicableCategories: "",
                status: "Active"
            });
            setSelectedPromo(null);
        }
        setIsModalOpen(true);
    };

    const handleSavePromo = async (e) => {
        e.preventDefault();
        try {
            if (!formData.code || formData.value === "") {
                toast.error("Code and Value are required");
                return;
            }

            const payload = {
                ...formData,
                value: Number(formData.value),
                minQty: Number(formData.minQty)
            };

            // Convert empty date strings to null to avoid backend parse errors if any, or keep as string
            if (!payload.startDate) payload.startDate = null;
            if (!payload.endDate) payload.endDate = null;

            if (selectedPromo) {
                await promotionsService.update(selectedPromo.id, payload);
                toast.success("Promotion updated successfully");
            } else {
                await promotionsService.create(payload);
                toast.success("Promotion created successfully");
            }
            setIsModalOpen(false);
            loadPromotions();
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Failed to save promotion");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this promotion?")) {
            try {
                await promotionsService.delete(id);
                toast.success("Promotion deleted");
                loadPromotions();
            } catch (error) {
                toast.error("Failed to delete promotion");
            }
        }
    };

    const filteredPromotions = promotions.filter(p =>
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
            <Sidebar />
            <main className="flex-1">
                <Navbar title="Marketing & Promotions" />

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by code or type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-[#E60012] focus:bg-white rounded-lg outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={() => handleOpenModal()}>
                                <Plus className="w-5 h-5 mr-2" /> New Promotion
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-bold text-gray-700">Promo Code</th>
                                    <th className="p-4 font-bold text-gray-700">Type & Value</th>
                                    <th className="p-4 font-bold text-gray-700">Valid Dates</th>
                                    <th className="p-4 font-bold text-gray-700">Applicable Categories</th>
                                    <th className="p-4 font-bold text-gray-700">Status</th>
                                    <th className="p-4 font-bold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading promotions...</td></tr>
                                ) : filteredPromotions.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No promotions found.</td></tr>
                                ) : (
                                    filteredPromotions.map((promo) => (
                                        <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold font-mono text-lg text-gray-900 border border-gray-200 bg-gray-100 px-2 py-1 rounded inline-block w-fit tracking-wider">
                                                        {promo.code}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                                                        {promo.type === 'PERCENTAGE' ? <Percent className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{promo.type}</p>
                                                        <p className="text-sm font-bold text-[#E60012]">
                                                            {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `$${promo.value}`} off
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    {promo.startDate && promo.endDate ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="flex items-center gap-1 text-green-700 font-medium"><Calendar className="w-3 h-3" /> Starts: {new Date(promo.startDate).toLocaleDateString()}</span>
                                                            <span className="flex items-center gap-1 text-orange-700 font-medium"><Clock className="w-3 h-3" /> Ends: {new Date(promo.endDate).toLocaleDateString()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic flex items-center gap-1"><Calendar className="w-3 h-3" /> Runs Indefinitely</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {promo.applicableCategories || <span className="text-gray-400 italic">Storewide</span>}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${promo.status === 'Active' ? 'bg-[#7AC143]/10 text-[#7AC143]' : 'bg-gray-100 text-gray-500'}`}>
                                                    {promo.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(promo)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(promo.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPromo ? "Edit Promotion" : "New Promotion"} size="md">
                    <form onSubmit={handleSavePromo} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Promo Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                    className="nintendo-input uppercase font-mono tracking-wider font-bold"
                                    placeholder="e.g. SUMMER10"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">No spaces allowed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="nintendo-input"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Disabled">Disabled</option>
                                    <option value="Expired">Expired</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Discount Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="nintendo-input font-bold"
                                >
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FLAT">Flat Amount ($)</option>
                                    <option value="BOGO">BOGO (Not Supported)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Value Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                                        {formData.type === 'PERCENTAGE' ? '%' : '$'}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
                                        required
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        className="nintendo-input pl-8 font-bold"
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[#0AB5CD]/10 border border-[#0AB5CD]/20 rounded-xl space-y-4">
                            <h4 className="font-bold text-[#0AB5CD] text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Seasonal Valid Dates
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Start Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="nintendo-input text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="nintendo-input text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Applicable Categories</label>
                            <input
                                type="text"
                                value={formData.applicableCategories}
                                onChange={e => setFormData({ ...formData, applicableCategories: e.target.value })}
                                className="nintendo-input"
                                placeholder="e.g. Tools, Hardware"
                            />
                            <p className="text-xs text-gray-500 mt-1">Comma-separated category names. Leave blank to apply store-wide.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {selectedPromo ? "Save Changes" : "Create Promotion"}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </main>
        </div>
    );
};
