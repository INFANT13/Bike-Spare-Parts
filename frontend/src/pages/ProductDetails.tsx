import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Wrench, ArrowLeft, ShoppingCart, ShieldCheck, RefreshCw, Layers } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  specifications: Record<string, any> | null;
  Category?: {
    name: string;
    slug: string;
  };
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await API.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!token) {
      setFeedback({ type: 'error', message: 'Please login to add products to your cart.' });
      setTimeout(() => setFeedback(null), 4000);
      navigate('/auth');
      return;
    }
    const res = await addToCart(product.id, quantity);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Added to cart successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to add item.' });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading spare part specifications...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-white font-extrabold text-2xl">Spare Part Not Found</h2>
        <p className="text-slate-400">The component requested does not exist or has been discontinued.</p>
        <Link to="/catalog" className="text-amber-500 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Parse specifications safely
  const specs = product.specifications || {};

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

      {/* Back button */}
      <div>
        <Link
          to="/catalog"
          className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-sm text-decoration-none font-medium transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Media Layout */}
        <div className="space-y-4">
          <div className="h-96 md:h-[480px] bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden flex items-center justify-center relative">
            {product.image.startsWith('/uploads') ? (
              <div className="w-full h-full gradient-gold-blue opacity-25 flex items-center justify-center">
                <Wrench className="w-20 h-20 text-white" />
              </div>
            ) : (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            )}
            {product.stock === 0 && (
              <span className="absolute top-4 right-4 px-3 py-1 rounded bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider">
                Temporarily Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Product Details Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {product.Category ? product.Category.name : 'Genuine Spare Parts'}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{product.name}</h1>
            <div className="flex items-center space-x-4 text-slate-400 text-xs font-mono">
              <span>SKU: {product.sku}</span>
              <span>•</span>
              <span className={product.stock > 0 ? 'text-emerald-500' : 'text-red-500'}>
                {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="text-3xl font-extrabold text-amber-500">Rs. {product.price}</div>

          <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-850 pt-4">
            {product.description || 'No custom description available for this spare part item.'}
          </p>

          {/* Add to Cart Actions */}
          <div className="border-t border-b border-slate-850 py-4 flex flex-col sm:flex-row gap-4 items-center">
            {product.stock > 0 && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 w-full sm:w-auto">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-slate-400 hover:text-white font-bold"
                >
                  -
                </button>
                <span className="px-4 text-white font-mono text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1 text-slate-400 hover:text-white font-bold"
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition-smooth shadow-lg shadow-amber-500/10"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Store guarantees */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-slate-300 text-xs font-semibold">100% Genuine Certified</span>
            </div>
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 flex items-center space-x-2.5">
              <RefreshCw className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-slate-300 text-xs font-semibold">7-Day Compatibility Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {Object.keys(specs).length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <span>Technical Specifications</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="min-w-full divide-y divide-slate-850">
              <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                {Object.entries(specs).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/40 w-1/3">
                      {key}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-200">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
