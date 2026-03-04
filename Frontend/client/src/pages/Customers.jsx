import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { Plus, Search, User, Edit2, Trash2, Building, DollarSign, List, FileText } from "lucide-react";
import customersService from "../services/customersService";
import { getCustomerLoyaltyLedger } from "../services/loyaltyService";

export const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [customerLedger, setCustomerLedger] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    const [statementMonth, setStatementMonth] = useState("");
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        address: "",
        creditLimit: "0",
        tier: "Retail", // Retail, Contractor
        taxExempt: false,
    });

    const [payAmount, setPayAmount] = useState("");

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await customersService.getAll();
            setCustomers(data);
        } catch (error) {
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setFormData({
                name: customer.name || "",
                email: customer.email || "",
                phone: customer.phone || "",
                companyName: customer.companyName || "",
                address: customer.address || "",
                creditLimit: String(customer.creditLimit || "0"),
                tier: customer.tier || "Retail",
                taxExempt: customer.taxExempt || false,
            });
            setSelectedCustomer(customer);
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                companyName: "",
                address: "",
                creditLimit: "0",
                tier: "Retail",
                taxExempt: false,
            });
            setSelectedCustomer(null);
        }
        setIsModalOpen(true);
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        try {
            if (!formData.name) {
                toast.error("Name is required");
                return;
            }

            const payload = {
                ...formData,
                creditLimit: Number(formData.creditLimit)
            };

            if (selectedCustomer) {
                await customersService.update(selectedCustomer.id, payload);
                toast.success("Customer updated successfully");
            } else {
                await customersService.create(payload);
                toast.success("Customer added successfully");
            }
            setIsModalOpen(false);
            loadCustomers();
        } catch (error) {
            toast.error(error.message || "Failed to save customer");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            try {
                await customersService.delete(id);
                toast.success("Customer deleted");
                loadCustomers();
            } catch (error) {
                toast.error("Failed to delete customer");
            }
        }
    };

    const handleOpenPayModal = (customer) => {
        setSelectedCustomer(customer);
        setPayAmount("");
        setIsPayModalOpen(true);
    };

    const handlePayAccount = async (e) => {
        e.preventDefault();
        if (!payAmount || Number(payAmount) <= 0) {
            toast.error("Enter a valid payment amount");
            return;
        }
        try {
            await customersService.payAccount(selectedCustomer.id, payAmount, "cash");
            toast.success("Account payment processed");
            setIsPayModalOpen(false);
            loadCustomers();
        } catch (error) {
            toast.error(error.message || "Failed to process payment");
        }
    };

    const handleOpenLedgerModal = async (customer) => {
        setSelectedCustomer(customer);
        setIsLedgerModalOpen(true);
        try {
            const ledger = await getCustomerLoyaltyLedger(customer.id);
            setCustomerLedger(ledger);
        } catch (error) {
            toast.error("Failed to load loyalty ledger");
        }
    };

    const handleOpenStatementModal = (customer) => {
        setSelectedCustomer(customer);
        const today = new Date();
        const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setStatementMonth(monthStr);
        setIsStatementModalOpen(true);
    };

    const handleGenerateStatement = () => {
        if (!statementMonth) {
            toast.error("Please select a valid month");
            return;
        }
        window.open(`/api/customers/${selectedCustomer.id}/statement-pdf?month=${statementMonth}`, '_blank');
        setIsStatementModalOpen(false);
    };



    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
            <Sidebar />
            <main className="flex-1">
                <Navbar title="Customer Management" />

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, company, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-[#E60012] focus:bg-white rounded-lg outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={() => handleOpenModal()}>
                                <Plus className="w-5 h-5 mr-2" /> Add Customer
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-bold text-gray-700">Customer</th>
                                    <th className="p-4 font-bold text-gray-700">Contact</th>
                                    <th className="p-4 font-bold text-gray-700">Tier</th>
                                    <th className="p-4 font-bold text-gray-700">Loyalty Pts</th>
                                    <th className="p-4 font-bold text-gray-700">AR Balance</th>
                                    <th className="p-4 font-bold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading customers...</td></tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No customers found.</td></tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#E60012]/10 text-[#E60012] rounded-full flex items-center justify-center font-bold">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{customer.name}</p>
                                                        {customer.companyName && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Building className="w-3 h-3" /> {customer.companyName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-700">{customer.phone || '—'}</p>
                                                <p className="text-xs text-gray-500">{customer.email || '—'}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${customer.tier === 'Contractor' ? 'bg-[#ff9900]/10 text-[#ff9900]' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {customer.tier}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-blue-600">
                                                {customer.loyaltyPoints.toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className={`font-bold ${customer.accountBalance > 0 ? 'text-[#E60012]' : 'text-gray-900'}`}>
                                                            LKR {customer.accountBalance.toLocaleString()}
                                                        </p>
                                                        {customer.creditLimit > 0 && (
                                                            <p className="text-xs text-gray-500">Limit: LKR {customer.creditLimit.toLocaleString()}</p>
                                                        )}
                                                    </div>
                                                    {customer.accountBalance > 0 && (
                                                        <button
                                                            onClick={() => handleOpenPayModal(customer)}
                                                            className="text-xs bg-[#7AC143]/10 text-[#7AC143] hover:bg-[#7AC143] hover:text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            Pay
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenStatementModal(customer)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Generate Statement"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenLedgerModal(customer)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Points Ledger"
                                                    >
                                                        <List className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(customer)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(customer.id)}
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

                {/* Create / Edit Customer Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCustomer ? "Edit Customer" : "New Customer"} size="md">
                    <form onSubmit={handleSaveCustomer} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="nintendo-input"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Company (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    className="nintendo-input"
                                    placeholder="ACME Corp"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="nintendo-input"
                                    placeholder="077-1234567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="nintendo-input"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="nintendo-input"
                                placeholder="123 Main St, City"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-sm font-bold text-[#E60012] mb-1">Account Tier</label>
                                <select
                                    value={formData.tier}
                                    onChange={e => setFormData({ ...formData, tier: e.target.value })}
                                    className="nintendo-input"
                                >
                                    <option value="Retail">Retail (Standard)</option>
                                    <option value="Contractor">Contractor</option>
                                    <option value="Wholesale">Wholesale</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Credit Limit (LKR)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={formData.creditLimit}
                                    onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                                    className="nintendo-input"
                                    placeholder="e.g. 50000"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-4 bg-[#7AC143]/10 border border-[#7AC143]/30 rounded-xl">
                            <input
                                type="checkbox"
                                id="taxExempt"
                                checked={formData.taxExempt}
                                onChange={e => setFormData({ ...formData, taxExempt: e.target.checked })}
                                className="w-5 h-5 text-[#7AC143] rounded focus:ring-[#7AC143]"
                            />
                            <label htmlFor="taxExempt" className="text-sm font-bold text-gray-900 cursor-pointer select-none">
                                Customer is Tax Exempt
                            </label>
                            <span className="text-xs text-gray-500 ml-auto bg-white px-2 py-1 rounded shadow-sm">No tax will be charged at checkout</span>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {selectedCustomer ? "Save Changes" : "Add Customer"}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Pay Account Balance Modal */}
                <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Receive Account Payment" size="sm">
                    {selectedCustomer && (
                        <form onSubmit={handlePayAccount} className="space-y-5">
                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                                <p className="text-sm text-gray-500 mb-1">Current AR Balance for {selectedCustomer.name}</p>
                                <p className="text-3xl font-extrabold text-[#E60012]">
                                    LKR {selectedCustomer.accountBalance.toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Amount Received</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        required
                                        value={payAmount}
                                        onChange={e => setPayAmount(e.target.value)}
                                        className="nintendo-input pl-10 text-lg font-bold"
                                        placeholder="LKR Amount"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsPayModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-[#7AC143] hover:bg-[#68a832] border-[#7AC143] hover:border-[#68a832]">
                                    Collect Payment
                                </Button>
                            </div>
                        </form>
                    )}
                </Modal>

                {/* Statement Modal */}
                <Modal isOpen={isStatementModalOpen} onClose={() => setIsStatementModalOpen(false)} title="Generate Account Statement" size="sm">
                    {selectedCustomer && (
                        <div className="space-y-5">
                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                                <p className="text-sm text-gray-500 mb-1">Statement for</p>
                                <p className="text-xl font-extrabold text-gray-900">{selectedCustomer.name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Select Month</label>
                                <input
                                    type="month"
                                    value={statementMonth}
                                    onChange={(e) => setStatementMonth(e.target.value)}
                                    className="nintendo-input w-full"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" className="flex-1" onClick={() => setIsStatementModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleGenerateStatement}>
                                    Generate PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Ledger Modal */}
                <Modal isOpen={isLedgerModalOpen} onClose={() => setIsLedgerModalOpen(false)} title="Loyalty Points Ledger" size="md">
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                            <p className="text-sm text-blue-600 font-bold mb-1">{selectedCustomer?.name}</p>
                            <p className="text-3xl font-extrabold text-blue-600">
                                {selectedCustomer?.loyaltyPoints?.toLocaleString()} Pts
                            </p>
                        </div>
                        <div className="max-h-80 overflow-auto border border-gray-100 rounded-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-3 font-bold text-gray-700">Date</th>
                                        <th className="p-3 font-bold text-gray-700 text-right">Points</th>
                                        <th className="p-3 font-bold text-gray-700">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {customerLedger.length === 0 ? (
                                        <tr><td colSpan="3" className="p-4 text-center text-gray-500">No point history found.</td></tr>
                                    ) : (
                                        customerLedger.map(entry => (
                                            <tr key={entry.id}>
                                                <td className="p-3 text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
                                                <td className={`p-3 text-right font-bold ${entry.pointsDelta > 0 ? "text-green-600" : "text-[#E60012]"}`}>
                                                    {entry.pointsDelta > 0 ? "+" : ""}{entry.pointsDelta}
                                                </td>
                                                <td className="p-3 text-gray-700">{entry.reason}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={() => setIsLedgerModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                </Modal>

            </main>
        </div>
    );
};
