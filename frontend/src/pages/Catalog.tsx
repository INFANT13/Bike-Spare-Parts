import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal, ShoppingCart, Info, Star } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  slug: string;
  price: number;
  stock: number;
  image: string;
  categoryId: number;
  Category?: {
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const Catalog: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { token } = useAuth();

  // Parse initial query params
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Categories on Mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/products/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products based on filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort) params.append('sort', sort);

      const res = await API.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when category query param changes from external clicks
  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category') || '';
    setCategory(cat);
  }, [location.search]);

  // Trigger search on filter changes
  useEffect(() => {
    fetchProducts();
  }, [category, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    navigate('/catalog');
    // Fetch directly using empty params
    setProducts([]);
    setLoading(true);
    API.get('/products').then((res) => {
      if (res.data.success) setProducts(res.data.products);
      setLoading(false);
    });
  };

  const handleAddToCart = async (productId: number) => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Please login to add products to your cart.' });
      setTimeout(() => setFeedback(null), 4000);
      navigate('/auth');
      return;
    }
    const res = await addToCart(productId, 1);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Added to cart!' });
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to add item.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Parts Catalog</h1>
          <p className="text-slate-400 text-sm">Find genuine replacement spares for all major bike makes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-6 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-white font-bold text-sm flex items-center space-x-1.5">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span>Filter Options</span>
            </h3>
            <button onClick={handleResetFilters} className="text-amber-500 hover:text-amber-400 font-medium text-xs">
              Clear All
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Search Keyword</label>
            <div className="relative">
              <input
                type="text"
                placeholder="SKU, Name, Model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-white border border-slate-700/80 font-bold rounded-xl text-xs transition-smooth"
            >
              Search Database
            </button>
          </form>

          {/* Category List */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                // Update URL parameter
                if (e.target.value) navigate(`/catalog?category=${e.target.value}`);
                else navigate('/catalog');
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Price Limits (Rs.)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-600">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={fetchProducts}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-smooth shadow-md shadow-amber-500/5"
            >
              Apply Pricing
            </button>
          </div>
        </div>

        {/* Product Listing */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting and Summary */}
          <div className="flex justify-between items-center bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
            <span className="text-slate-400 text-xs">
              Showing <span className="text-white font-bold">{products.length}</span> parts matching query
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-xs hidden sm:inline">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Querying inventory databases...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-slate-950/20 border border-slate-800/60 rounded-2xl">
              <p className="text-slate-400 mb-2">No spare parts match your filter selection.</p>
              <button onClick={handleResetFilters} className="text-amber-500 hover:underline text-sm font-semibold">
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-smooth"
                >
                  <div className="space-y-4">
                    {/* Visual Media */}
                    <div className="h-44 bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800/60 flex items-center justify-center">
                      {prod.image.startsWith('/uploads') ? (
                        <div className="w-full h-full gradient-gold-blue opacity-25 flex items-center justify-center">
                          <SlidersHorizontal className="w-12 h-12 text-white" />
                        </div>
                      ) : (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                      )}
                      {prod.stock === 0 ? (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-500 text-white font-bold text-xxs uppercase">
                          Out Of Stock
                        </span>
                      ) : prod.stock < 5 ? (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-orange-500 text-slate-950 font-bold text-xxs uppercase">
                          Only {prod.stock} Left
                        </span>
                      ) : null}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400 text-xxs">
                        SKU: {prod.sku}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-amber-500 font-semibold text-xxs uppercase tracking-wider">
                        {prod.Category ? prod.Category.name : 'Spare Part'}
                      </p>
                      <h3 className="text-white font-bold text-sm line-clamp-2 h-10">{prod.name}</h3>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4 pt-3 border-t border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-extrabold text-base">Rs. {prod.price}</span>
                      <span className="text-slate-500 text-xxs flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span className="text-slate-300 font-bold">4.7</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      <Link
                        to={`/catalog/${prod.id}`}
                        className="col-span-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold text-center text-decoration-none hover:bg-slate-800 flex items-center justify-center"
                        title="View specifications table"
                      >
                        <Info className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleAddToCart(prod.id)}
                        disabled={prod.stock === 0}
                        className="col-span-3 py-2 rounded-xl bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs transition-smooth flex items-center justify-center space-x-1.5"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
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

export default Catalog;
