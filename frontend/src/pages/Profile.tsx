import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { User, ClipboardList, Phone, MapPin, Edit } from 'lucide-react';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  Product?: {
    name: string;
    image: string;
  };
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: string;
  phone: string;
  createdAt: string;
  OrderItems: OrderItem[];
}

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Edit Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [editMode, setEditMode] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Order History
  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await API.get('/orders/my-orders');
        if (res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error('Error fetching order history:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchMyOrders();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await updateProfile({ name, phone, address });
      if (res.success) {
        setFeedback({ type: 'success', message: 'Profile details updated successfully!' });
        setEditMode(false);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Profile update failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'An error occurred during updating.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Toast Alert Feedback */}
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
        <h1 className="text-3xl font-extrabold text-white">Your Account Dashboard</h1>
        <p className="text-slate-400 text-sm">Manage your profile details and monitor bike parts orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Column */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6 h-fit">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <h3 className="text-white font-bold text-sm flex items-center space-x-1.5">
              <User className="w-4.5 h-4.5 text-amber-500" />
              <span>Personal Details</span>
            </h3>
            <button
              onClick={() => {
                setEditMode(!editMode);
                setName(user?.name || '');
                setPhone(user?.phone || '');
                setAddress(user?.address || '');
              }}
              className="text-amber-500 hover:text-amber-400 font-bold text-xs flex items-center space-x-1"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{editMode ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          {editMode ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Delivery Address</label>
                <textarea
                  value={address}
                  rows={3}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm hover:bg-amber-400 transition-smooth"
              >
                Save Profile Updates
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-xxs uppercase font-semibold">User Name</span>
                <p className="text-white font-extrabold text-base">{user?.name}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-xxs uppercase font-semibold">Email Account</span>
                <p className="text-slate-350">{user?.email}</p>
              </div>
              <div className="space-y-1 border-t border-slate-850 pt-3 flex items-start space-x-2.5">
                <Phone className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xxs uppercase font-semibold block">Phone Number</span>
                  <span className="text-white">{user?.phone || 'Not provided'}</span>
                </div>
              </div>
              <div className="space-y-1 border-t border-slate-850 pt-3 flex items-start space-x-2.5">
                <MapPin className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xxs uppercase font-semibold block">Default Address</span>
                  <span className="text-slate-300 leading-normal block">{user?.address || 'Not configured'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order History Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-850 pb-2">
            <ClipboardList className="w-4.5 h-4.5 text-amber-500" />
            <span>Order History</span>
          </h3>

          {loadingOrders ? (
            <div className="text-center py-10 text-slate-500">Querying your transactional logs...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/20 border border-slate-800/60 rounded-2xl">
              <p className="text-slate-400 mb-0 text-sm">You have not completed any parts checkouts yet.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800/60 space-y-4 hover:border-slate-700 transition-smooth"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-850 pb-3">
                    <div>
                      <span className="text-white font-bold text-sm block">Order #{ord.id}</span>
                      <span className="text-slate-500 text-xxs font-mono">
                        Date: {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                          ord.paymentStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        Payment: {ord.paymentStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : ord.status === 'shipped'
                            ? 'bg-blue-500 text-slate-950 font-black'
                            : 'bg-amber-500 text-slate-950 font-black'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* Order items nested listing */}
                  <div className="space-y-2">
                    {ord.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium">
                          {item.product ? item.product.name : 'Spare Part'} (x{item.quantity})
                        </span>
                        <span className="text-white font-mono font-semibold">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-850" />

                  <div className="flex justify-between items-center text-sm font-extrabold">
                    <span className="text-slate-400">Total Paid</span>
                    <span className="text-amber-500 font-mono">Rs. {ord.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
