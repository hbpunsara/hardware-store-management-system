import { useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Package, Truck, Layers, Hash } from "lucide-react";

import { ProductsTab } from "./ProductsTab";
import { SuppliersTab } from "./SuppliersTab";
import { PurchaseOrdersTab } from "./PurchaseOrdersTab";
import { StockAdjustmentsTab } from "./StockAdjustmentsTab";

export const Inventory = () => {
    const [activeTab, setActiveTab] = useState("products");

    const tabs = [
        { id: "products", label: "Product Listing", icon: Package },
        { id: "suppliers", label: "Suppliers", icon: Truck },
        { id: "pos", label: "Purchase Orders", icon: Layers },
        { id: "adjustments", label: "Stock Adjustments", icon: Hash },
    ];

    return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
            <Sidebar />
            <main className="flex-1 overflow-hidden flex flex-col">
                <Navbar title="Inventory Management" />

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6 border-b border-gray-200">
                        <div className="flex gap-8">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 pb-4 px-2 font-bold transition-all relative ${isActive ? 'text-[#0AB5CD]' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {tab.label}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0AB5CD] rounded-t-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === "products" && <ProductsTab />}
                        {activeTab === "suppliers" && <SuppliersTab />}
                        {activeTab === "pos" && <PurchaseOrdersTab />}
                        {activeTab === "adjustments" && <StockAdjustmentsTab />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Inventory;
