import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Modal, ConfirmDialog } from "../components/Modal";
import { useToast } from "../components/Toast";
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, Filter, Save, Upload } from "lucide-react";
import productService from "../services/productService";
import suppliersService from "../services/suppliersService";

const categories = ["Tools", "Hardware", "Painting", "Adhesives", "Materials"];

export const Products = () => {
  const [suppliers, setSuppliers] = useState(["ForgeCo", "SteelMart", "ColorSync", "Grip&Go", "SmoothCraft"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "Tools",
    price: "",
    costPrice: "",
    stock: "",
    supplier: "ForgeCo"
  });
  const toast = useToast();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getAll();
      if (data && data.length > 0) {
        setSuppliers(data.map(s => s.name));
      }
    } catch (err) {
      console.error("Failed to load suppliers", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK').format(amount);
  };

  const handleAddProduct = async () => {
    if (!formData.sku || !formData.name || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await productService.create({
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        supplier: formData.supplier
      });
      setShowAddModal(false);
      resetForm();
      loadProducts();
      toast.success("Product added successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to add product");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or missing headers");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const productsArray = [];

      for (let i = 1; i < lines.length; i++) {
        const _row = lines[i];
        // simple parsing assuming no commas inside the values for this basic CSV feature
        const cols = _row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        
        const itemObj = {};
        headers.forEach((header, index) => {
          // Map standard formats to our schema
          if (header.includes('sku')) itemObj.sku = cols[index];
          else if (header.includes('name') || header.includes('product')) itemObj.name = cols[index];
          else if (header.includes('category')) itemObj.category = cols[index] || "Hardware";
          else if (header.includes('price') && !header.includes('cost')) itemObj.price = cols[index];
          else if (header.includes('cost') || header.includes('costprice')) itemObj.costPrice = cols[index];
          else if (header.includes('stock') || header.includes('qty')) itemObj.stock = cols[index];
          else if (header.includes('supplier')) itemObj.supplier = cols[index];
        });

        if (itemObj.sku && itemObj.name && itemObj.price !== undefined) {
           productsArray.push(itemObj);
        }
      }

      if (productsArray.length === 0) {
        toast.error("Could not parse any valid products from the CSV. Make sure you have at least SKU, Name, and Price columns.");
        return;
      }

      const res = await productService.createBulk(productsArray);
      
      if (res.results && res.results.failed > 0) {
        toast.error(`Import finished with issues: ${res.results.successful} imported, ${res.results.failed} failed.`);
      } else {
        toast.success(`Successfully imported ${productsArray.length} products!`);
      }
      
      loadProducts();
    } catch (err) {
      toast.error(err.message || "Failed to parse or upload CSV file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset input
      }
    }
  };

  const handleEditProduct = async () => {
    if (!formData.sku || !formData.name || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await productService.update(selectedProduct.id, {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        supplier: formData.supplier
      });
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
      toast.success("Product updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await productService.delete(selectedProduct.id);
      setSelectedProduct(null);
      setShowDeleteDialog(false);
      loadProducts();
      toast.success("Product deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      costPrice: (product.costPrice || 0).toString(),
      stock: product.stock.toString(),
      supplier: product.supplier || "ForgeCo"
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      category: "Tools",
      price: "",
      costPrice: "",
      stock: "",
      supplier: "ForgeCo"
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 10).length,
    lowStock: products.filter(p => p.stock <= 10 && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar />
      <main className="flex-1">
        <Navbar title="Products & Inventory" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="nintendo-input pl-12 w-80"
                />
              </div>
              <Button variant="secondary" onClick={() => setShowFilterModal(true)}>
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
              <select
                className="nintendo-input w-48"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileUpload} 
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Bulk Import
              </Button>
              <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="nintendo-stat-card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#0AB5CD]/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#0AB5CD]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500 font-medium">Total Products</p>
                </div>
              </div>
            </div>
            <div className="nintendo-stat-card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#7AC143]/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#7AC143]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.inStock}</p>
                  <p className="text-sm text-gray-500 font-medium">In Stock</p>
                </div>
              </div>
            </div>
            <div className="nintendo-stat-card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F5A623]/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.lowStock}</p>
                  <p className="text-sm text-gray-500 font-medium">Low Stock</p>
                </div>
              </div>
            </div>
            <div className="nintendo-stat-card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#E60012]/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#E60012]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.outOfStock}</p>
                  <p className="text-sm text-gray-500 font-medium">Out of Stock</p>
                </div>
              </div>
            </div>
          </div>

          <div className="nintendo-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading products...</div>
            ) : (
              <table className="nintendo-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Margin</th>
                    <th>Stock</th>
                    <th>Supplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={product.stock <= 10 ? 'bg-[#E60012]/5' : ''}
                    >
                      <td className="font-mono font-bold text-gray-600">{product.sku}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">🔧</div>
                          <span className="font-bold text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="nintendo-badge nintendo-badge-info">{product.category}</span>
                      </td>
                      <td className="font-bold text-gray-900">LKR {formatCurrency(product.price)}</td>
                      <td className="font-bold">
                        {product.price > 0 ? (
                          <span className={((product.price - (product.costPrice || 0)) / product.price) * 100 > 0 ? "text-[#7AC143]" : "text-[#E60012]"}>
                            {(((product.price - (product.costPrice || 0)) / product.price) * 100).toFixed(1)}%
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td>
                        <span className={`font-bold ${product.stock <= 10 ? 'text-[#E60012]' : 'text-gray-900'}`}>
                          {product.stock}
                          {product.stock <= 10 && <AlertTriangle className="w-4 h-4 inline ml-2 text-[#E60012]" />}
                        </span>
                      </td>
                      <td className="text-gray-600">{product.supplier || "-"}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(product)} className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button onClick={() => openDeleteDialog(product)} className="w-9 h-9 bg-[#E60012]/10 rounded-lg flex items-center justify-center hover:bg-[#E60012]/20 transition-colors">
                            <Trash2 className="w-4 h-4 text-[#E60012]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4">
            <span className="text-sm text-gray-600 font-medium">Showing {filteredProducts.length} of {products.length} products</span>
          </div>
        </div>

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Product" size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">SKU *</label>
                <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g., HAM-16" className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Hammer 16oz" className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="nintendo-input">
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Supplier</label>
                <select value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="nintendo-input">
                  {suppliers.map(sup => (<option key={sup} value={sup}>{sup}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price (LKR) *</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cost Price (LKR)</label>
                <input type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} placeholder="0.00" className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Initial Stock</label>
                <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" className="nintendo-input" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddProduct}><Save className="w-4 h-4 mr-2" /> Add Product</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Product" size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">SKU *</label>
                <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="nintendo-input">
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Supplier</label>
                <select value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="nintendo-input">
                  {suppliers.map(sup => (<option key={sup} value={sup}>{sup}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price (LKR) *</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cost Price (LKR)</label>
                <input type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} className="nintendo-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Stock</label>
                <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="nintendo-input" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleEditProduct}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteProduct}
          title="Delete Product"
          message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />

        <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter Products">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="nintendo-input w-full">
                <option value="All">All Categories</option>
                {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowFilterModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Products;
