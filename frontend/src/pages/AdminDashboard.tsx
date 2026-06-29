import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, ListCollapse, ShoppingBag, ShieldAlert, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image: string;
  Category?: { name: string };
}

interface Category {
  id: number;
  name: string;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: string;
  phone: string;
  createdAt: string;
  User?: { name: string; email: string };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Redirect or protect if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-white font-extrabold text-2xl">Access Denied</h2>
        <p className="text-slate-400">You must be logged in as an administrator to access the store management dashboard.</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'parts' | 'orders'>('parts');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Product Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [specsText, setSpecsText] = useState('{"Material": "Alloy", "Compatibility": "Universal"}');

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, ordRes] = await Promise.all([
        API.get('/products/categories'),
        API.get('/products'),
        API.get('/orders/all-orders')
      ]);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (ordRes.data.success) setOrders(ordRes.data.orders);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price || !categoryId) {
      setFeedback({ type: 'error', message: 'Name, SKU, Price, and Category are required.' });
      return;
    }
    setFeedback(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('price', price);
    formData.append('stock', stock || '0');
    formData.append('categoryId', categoryId);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      let parsedSpecs = {};
      try {
        parsedSpecs = JSON.parse(specsText);
      } catch (err) {
        parsedSpecs = { Details: specsText };
      }
      formData.append('specifications', JSON.stringify(parsedSpecs));

      const res = await API.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Product added successfully!' });
        setName('');
        setSku('');
        setPrice('');
        setStock('');
        setCategoryId('');
        setImageFile(null);
        setSpecsText('{"Material": "Alloy", "Compatibility": "Universal"}');
        fetchDashboardData(); // Refresh list
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error occurred while saving product.'
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this spare part?')) return;
    try {
      const res = await API.delete(`/products/${id}`);
      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Product removed successfully.' });
        fetchDashboardData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete product.' });
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      const res = await API.put('/orders/status', { orderId, status });
      if (res.data.success) {
        setFeedback({ type: 'success', message: `Order status updated to ${status}.` });
        fetchDashboardData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update order status.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Alert Notifications */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg animate-slideIn ${
            feedback.type === 'success' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-red-500 text-white'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-extrabold text-white">Admin Control Panel</h1>
        <p className="text-slate-400 text-sm">Manage inventory parts and check client transactions.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-850 pb-2">
        <button
          onClick={() => setActiveTab('parts')}
          className={`px-4 py-2 font-bold text-sm transition-smooth border-b-2 focus:outline-none flex items-center space-x-1.5 ${
            activeTab === 'parts' ? 'border-amber-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <ListCollapse className="w-4.5 h-4.5" />
          <span>Spare Parts Inventory</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-bold text-sm transition-smooth border-b-2 focus:outline-none flex items-center space-x-1.5 ${
            activeTab === 'orders' ? 'border-amber-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShoppingBag className="w-4.5 h-4.5" />
          <span>Customer Orders ({orders.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading store dashboard details...</div>
      ) : activeTab === 'parts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Column */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6 h-fit">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-850 pb-2">
              <Plus className="w-4.5 h-4.5 text-amber-500" />
              <span>Add New Spare Part</span>
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Part Name</label>
                <input
                  type="text"
                  placeholder="Ceramic Brake Pads"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Part SKU</label>
                <input
                  type="text"
                  placeholder="BRK-PAD-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">Price (Rs.)</label>
                  <input
                    type="number"
                    placeholder="499"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Product Image</label>
                <input
                  type="file"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-slate-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 file:cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Specifications (JSON format)</label>
                <textarea
                  value={specsText}
                  rows={3}
                  onChange={(e) => setSpecsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm hover:bg-amber-400 transition-smooth"
              >
                Add Spare Part
              </button>
            </form>
          </div>

          {/* List Products Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-850">
                <thead>
                  <tr className="text-left text-xxs text-slate-450 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-2">SKU</th>
                    <th className="pb-3 px-2">Name</th>
                    <th className="pb-3 px-2">Price</th>
                    <th className="pb-3 px-2 text-center">Stock</th>
                    <th className="pb-3 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td className="py-3 pr-2 font-mono text-xs text-amber-500">{prod.sku}</td>
                      <td className="py-3 px-2 font-semibold text-white truncate max-w-[140px]" title={prod.name}>
                        {prod.name}
                      </td>
                      <td className="py-3 px-2">Rs. {prod.price}</td>
                      <td className={`py-3 px-2 text-center ${prod.stock === 0 ? 'text-red-500 font-bold' : ''}`}>
                        {prod.stock}
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 transition-smooth"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Orders Listing Tab */
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-850">
            <thead>
              <tr className="text-left text-xxs text-slate-450 font-bold uppercase tracking-wider">
                <th className="pb-3 pr-2">ID</th>
                <th className="pb-3 px-2">Customer</th>
                <th className="pb-3 px-2">Total</th>
                <th className="pb-3 px-2">Payment</th>
                <th className="pb-3 px-2">Delivery Status</th>
                <th className="pb-3 pl-2">Ordered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm text-slate-350">
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td className="py-3 pr-2 font-mono font-bold text-white">#{ord.id}</td>
                  <td className="py-3 px-2">
                    <p className="font-semibold text-white text-xs mb-0.5">{ord.User?.name}</p>
                    <p className="text-slate-550 text-xxs mb-0">{ord.User?.email}</p>
                  </td>
                  <td className="py-3 px-2 text-amber-500 font-bold">Rs. {ord.totalAmount}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                        ord.paymentStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {ord.paymentStatus === 'success' ? 'SUCCESS' : ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 pl-2 text-xs text-slate-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
