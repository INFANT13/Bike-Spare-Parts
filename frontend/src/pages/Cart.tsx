import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingCart, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';

const Cart: React.FC = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const navigate = useNavigate();

  const handleQtyChange = async (productId: number, quantity: number) => {
    if (quantity < 1) return;
    await updateQuantity(productId, quantity);
  };

  const handleRemove = async (productId: number) => {
    await removeFromCart(productId);
  };

  if (loading && cartItems.length === 0) {
    return <div className="text-center py-20 text-slate-400">Loading your shopping cart...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Your Shopping Cart</h1>
        <p className="text-slate-400 text-sm">Review your selected spare parts before checkout.</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/20 border border-slate-800/60 rounded-3xl max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto border border-slate-800">
            <ShoppingCart className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Your cart is currently empty</h3>
            <p className="text-slate-400 text-sm">Browse our parts catalog to find genuine spares for your motorcycle.</p>
          </div>
          <Link
            to="/catalog"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm text-decoration-none inline-flex items-center space-x-2"
          >
            <span>Explore Spare Parts</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
              <div className="divide-y divide-slate-850">
                {cartItems.map((item) => {
                  const prod = item.Product;
                  if (!prod) return null;
                  const itemSubtotal = parseFloat(prod.price as any) * item.quantity;

                  return (
                    <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Product identity */}
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-slate-900 border border-slate-800/60 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          {prod.image.startsWith('/uploads') ? (
                            <ShoppingCart className="w-6 h-6 text-slate-500" />
                          ) : (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm line-clamp-1">{prod.name}</h3>
                          <p className="text-slate-500 text-xxs font-mono">SKU: {prod.sku}</p>
                          <p className="text-amber-500 text-xs font-extrabold">Rs. {prod.price}</p>
                        </div>
                      </div>

                      {/* Quantity & Actions controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantity - 1)}
                            className="px-2.5 py-1 text-slate-400 hover:text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="px-3 text-white font-mono text-xs">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantity + 1)}
                            className="px-2.5 py-1 text-slate-400 hover:text-white font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <span className="text-white font-bold text-sm block">Rs. {itemSubtotal}</span>
                          {item.quantity > prod.stock && (
                            <span className="text-red-500 text-xxs block">Stock limit: {prod.stock}</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="p-2 rounded-lg border border-slate-800 hover:border-red-500/30 hover:bg-red-950/20 text-slate-400 hover:text-red-400 transition-smooth"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clear Cart Button */}
            <div className="flex justify-between items-center">
              <Link
                to="/catalog"
                className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs font-semibold text-decoration-none transition-smooth"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
              <button
                onClick={clearCart}
                className="px-4 py-2 rounded-xl border border-slate-850 hover:border-red-500/20 hover:text-red-400 font-bold text-xs transition-smooth"
              >
                Clear All Items
              </button>
            </div>
          </div>

          {/* Pricing summary cards */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6 h-fit">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-slate-850 pb-2">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="text-white font-mono">Rs. {cartTotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping Fee</span>
                <span className="text-emerald-500 font-bold uppercase text-xs">Free Delivery</span>
              </div>
              <hr className="border-slate-850" />
              <div className="flex justify-between text-base font-extrabold">
                <span className="text-white">Total Amount</span>
                <span className="text-amber-500 font-mono">Rs. {cartTotal}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start space-x-2 text-xxs text-slate-400 leading-normal">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Ensure your selected items matches your motorcycle model specs and fitment standards.</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition-smooth shadow-lg shadow-amber-500/10"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
