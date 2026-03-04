import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { FileText, Search, Eye, CheckCircle, XCircle, Download } from "lucide-react";
import quotesService from "../services/quotesService";

export const Quotes = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const toast = useToast();

    const loadQuotes = async () => {
        try {
            setLoading(true);
            const data = await quotesService.getAll();
            setQuotes(data);
        } catch (error) {
            toast.error("Failed to load quotes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuotes();
    }, []);

    const handleOpenModal = async (id) => {
        try {
            const data = await quotesService.getById(id);
            setSelectedQuote(data);
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Failed to load quote details");
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await quotesService.updateStatus(id, status);
            toast.success(`Quote marked as ${status}`);
            setIsModalOpen(false);
            loadQuotes();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredQuotes = quotes.filter(q =>
        q.id.toString().includes(searchTerm) ||
        (q.customer?.name && q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
            <Sidebar />
            <main className="flex-1">
                <Navbar title="Quotes & Estimates" />

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by ID or Customer Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-[#E60012] focus:bg-white rounded-lg outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-bold text-gray-700">Quote ID</th>
                                    <th className="p-4 font-bold text-gray-700">Date</th>
                                    <th className="p-4 font-bold text-gray-700">Customer</th>
                                    <th className="p-4 font-bold text-gray-700">Total</th>
                                    <th className="p-4 font-bold text-gray-700">Status</th>
                                    <th className="p-4 font-bold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading quotes...</td></tr>
                                ) : filteredQuotes.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No quotes found.</td></tr>
                                ) : (
                                    filteredQuotes.map((quote) => (
                                        <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-medium text-gray-900">#Q-{quote.id.toString().padStart(4, '0')}</td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(quote.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-gray-900">{quote.customer ? quote.customer.name : 'Walk-in'}</p>
                                            </td>
                                            <td className="p-4 font-bold text-[#E60012]">
                                                LKR {Number(quote.total).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${quote.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    quote.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                        quote.status === 'Converted' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {quote.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenModal(quote.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* View Quote Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Quote Details" size="lg">
                    {selectedQuote && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900">Quote #Q-{selectedQuote.id.toString().padStart(4, '0')}</h2>
                                    <p className="text-sm text-gray-500">{new Date(selectedQuote.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${selectedQuote.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    selectedQuote.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                        selectedQuote.status === 'Converted' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {selectedQuote.status}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-2">Customer Info</h3>
                                {selectedQuote.customer ? (
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedQuote.customer.name}</p>
                                        <p className="text-sm text-gray-500">{selectedQuote.customer.phone || 'No phone'}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Walk-in Customer</p>
                                )}
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Items</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-gray-700">Item</th>
                                                <th className="p-3 font-semibold text-gray-700 text-right">Qty</th>
                                                <th className="p-3 font-semibold text-gray-700 text-right">Price</th>
                                                <th className="p-3 font-semibold text-gray-700 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedQuote.items.map((item, i) => (
                                                <tr key={i}>
                                                    <td className="p-3 text-gray-900">{item.productName}</td>
                                                    <td className="p-3 text-right text-gray-600">{item.quantity}</td>
                                                    <td className="p-3 text-right text-gray-600">LKR {Number(item.price).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-medium text-gray-900">
                                                        LKR {(item.quantity * Number(item.price)).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                                            <tr>
                                                <td colSpan="3" className="p-3 text-right text-gray-700">Subtotal</td>
                                                <td className="p-3 text-right text-gray-900">LKR {Number(selectedQuote.subtotal).toLocaleString()}</td>
                                            </tr>
                                            {Number(selectedQuote.discount) > 0 && (
                                                <tr>
                                                    <td colSpan="3" className="p-3 text-right text-[#E60012]">Discount</td>
                                                    <td className="p-3 text-right text-[#E60012]">-LKR {Number(selectedQuote.discount).toLocaleString()}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan="3" className="p-3 text-right text-gray-900">Total</td>
                                                <td className="p-3 text-right text-[#E60012] text-lg">LKR {Number(selectedQuote.total).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {selectedQuote.status === 'Pending' && (
                                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-4">
                                    <Button variant="secondary" onClick={() => handleUpdateStatus(selectedQuote.id, 'Expired')}>
                                        <XCircle className="w-4 h-4 mr-2" /> Mark Expired
                                    </Button>
                                    <Button onClick={() => handleUpdateStatus(selectedQuote.id, 'Approved')}>
                                        <CheckCircle className="w-4 h-4 mr-2" /> Approve Quote
                                    </Button>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-4">
                                <Button variant="secondary" onClick={() => window.open(`/api/quotes/${selectedQuote.id}/pdf`, '_blank')}>
                                    <Download className="w-4 h-4 mr-2" /> Download PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

            </main>
        </div>
    );
};
