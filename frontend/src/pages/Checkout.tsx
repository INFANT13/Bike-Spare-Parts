import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, CreditCard, ShieldCheck, Mail, ClipboardCheck, Play } from 'lucide-react';

interface OrderDetails {
  orderId: number;
  paymentId: string;
  amount: number;
  currency: string;
  key?: string;
  isDemo: boolean;
}

const Checkout: React.FC = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Checkout inputs
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment State
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState<number | null>(null);

  // Load user info as defaults when loaded
  useEffect(() => {
    if (user) {
      if (!shippingAddress) setShippingAddress(user.address || '');
      if (!phone) setPhone(user.phone || '');
    }
  }, [user]);

  // Load Razorpay Script Helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim() || !phone.trim()) {
      setError('Please provide shipping address and phone number.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await API.post('/orders/checkout', { shippingAddress, phone });
      if (res.data.success) {
        const data: OrderDetails = res.data;
        setOrderDetails(data);

        // If it is real Razorpay configuration, load payment gateway
        if (!data.isDemo) {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            setError('Failed to load payment gateway script. Try again.');
            setLoading(false);
            return;
          }

          const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: 'Bike Spare Parts Store',
            description: `Order Payment for #${data.orderId}`,
            order_id: data.paymentId,
            handler: async (response: any) => {
              // On payment success callback
              try {
                setLoading(true);
                const verifyRes = await API.post('/orders/verify-payment', {
                  orderId: data.orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  isDemo: false
                });
                if (verifyRes.data.success) {
                  setIsPaid(true);
                  setFinalOrderId(data.orderId);
                  await clearCart();
                } else {
                  setError('Payment signature verification failed.');
                }
              } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || 'Verification failed');
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: phone
            },
            theme: {
              color: '#fbbf24'
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', (response: any) => {
            setError(`Payment Failed: ${response.error.description}`);
            setLoading(false);
          });
          rzp.open();
        } else {
          setLoading(false);
        }
      } else {
        setError(res.data.message || 'Checkout creation failed.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred during checkout.');
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (success: boolean) => {
    if (!orderDetails) return;
    setLoading(true);
    setError(null);

    try {
      if (success) {
        const verifyRes = await API.post('/orders/verify-payment', {
          orderId: orderDetails.orderId,
          razorpay_payment_id: `demo_pay_id_${Date.now()}`,
          isDemo: true
        });

        if (verifyRes.data.success) {
          setIsPaid(true);
          setFinalOrderId(orderDetails.orderId);
          await clearCart();
        } else {
          setError('Demo verification failed.');
        }
      } else {
        setError('Billing simulation failed. Payment cancelled by user.');
        setOrderDetails(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error verifying demo transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !isPaid) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-white font-extrabold text-2xl">Checkout Inactive</h2>
        <p className="text-slate-400">There are no items in your cart to proceed with checkout.</p>
        <Link to="/catalog" className="text-amber-500 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Payment Success Screen
  if (isPaid) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/20 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">Order Confirmed!</h1>
            <p className="text-emerald-500 font-mono text-sm">Payment Received Successfully</p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-left text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Order ID:</span>
              <span className="text-white font-bold font-mono">#{finalOrderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Delivery:</span>
              <span className="text-white font-semibold">3-5 Business Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Shipping To:</span>
              <span className="text-white font-medium text-right max-w-[240px] truncate">{shippingAddress}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/30 rounded-xl flex items-center space-x-2.5 text-slate-400 text-xs text-left">
            <Mail className="w-5 h-5 text-amber-500 shrink-0" />
            <span>We have sent a detailed order confirmation invoice to <b>{user?.email}</b>.</span>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalog"
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs text-decoration-none hover:bg-amber-400 transition-smooth"
            >
              Continue Shopping
            </Link>
            <Link
              to="/profile"
              className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs text-decoration-none hover:bg-slate-800 transition-smooth"
            >
              View Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link
          to="/cart"
          className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs font-semibold text-decoration-none transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cart</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <ClipboardCheck className="w-5 h-5 text-amber-500" />
              <span>Shipping Information</span>
            </h2>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Shipping Address</label>
                <textarea
                  placeholder="Detailed street address, city, state, pincode"
                  value={shippingAddress}
                  rows={4}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Only show checkout submit if payment details are not created */}
              {!orderDetails && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 hover:bg-amber-400 transition-smooth shadow-lg shadow-amber-500/10"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{loading ? 'Processing Checkout...' : 'Generate Bill & Pay'}</span>
                </button>
              )}
            </form>
          </div>

          {/* Billing Simulator Panel for Demo Mode */}
          {orderDetails && orderDetails.isDemo && (
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-950/5 space-y-6">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-amber-500" />
                <h3 className="text-white font-bold text-base">Billing & Payment Simulator</h3>
              </div>
              <p className="text-slate-400 text-xs">
                Since no Razorpay Credentials exist in the system, you can verify the complete checkout, stock reduction, and receipt dispatch workflow below:
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Order ID:</span>
                  <span className="text-white font-mono font-bold">#{orderDetails.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="text-white font-mono text-xs">{orderDetails.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Price:</span>
                  <span className="text-amber-500 font-bold font-mono">Rs. {orderDetails.amount}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSimulatePayment(true)}
                  disabled={loading}
                  className="py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-smooth"
                >
                  {loading ? 'Syncing...' : 'Simulate Success'}
                </button>
                <button
                  onClick={() => handleSimulatePayment(false)}
                  disabled={loading}
                  className="py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs hover:bg-slate-850 transition-smooth"
                >
                  Simulate Failure
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Items List */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-slate-850 pb-2">Order Items</h3>
            <div className="divide-y divide-slate-850 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block">{item.Product?.name}</span>
                    <span className="text-slate-500">Qty: {item.quantity} x Rs. {item.Product?.price}</span>
                  </div>
                  <span className="text-slate-300 font-mono font-medium self-center">
                    Rs. {(item.Product ? parseFloat(item.Product.price as any) : 0) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-slate-850" />

            <div className="flex justify-between text-sm font-extrabold">
              <span className="text-white">Total Bill</span>
              <span className="text-amber-500 font-mono">Rs. {cartTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
