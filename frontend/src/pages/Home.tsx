import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Star, ArrowUpRight, Wrench } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  Category?: {
    name: string;
  };
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          API.get('/products/categories'),
          API.get('/products?sort=price_desc') // fetch some products
        ]);
        if (catRes.data.success) setCategories(catRes.data.categories);
        if (prodRes.data.success) {
          // Take top 4 as featured
          setFeaturedProducts(prodRes.data.products.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:py-32 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1d] to-[#0a0f1d]">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center md:text-left">
            <span className="px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 font-bold text-xs uppercase tracking-wider">
              Revive Your Ride
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Premium Performance <br />
              <span className="text-amber-500">Bike Spare Parts</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-lg">
              Explore our extensive collection of 100% authentic replacement components and performance upgrades. Keep your engine purring and brakes sharp.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Link
                to="/catalog"
                className="px-6 py-3 rounded-lg bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-smooth text-decoration-none shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/auth"
                className="px-6 py-3 rounded-lg bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition-smooth text-decoration-none border border-slate-800 flex items-center justify-center"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Right Graphics */}
          <div className="relative flex justify-center items-center">
            {/* Visual Glassmorphic Card representing a speed dashboard */}
            <div className="glass-panel p-8 rounded-3xl border border-slate-700/30 max-w-sm w-full space-y-6 shadow-2xl relative pulse-glow">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs tracking-widest uppercase">System Status</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-black text-3xl">RPM MAX</h3>
                <p className="text-amber-500 font-mono text-sm">Engine Compression: Optimal</p>
              </div>
              <div className="border-t border-slate-800 pt-4 flex justify-between text-xs text-slate-400">
                <div>
                  <p>Part Compatibility</p>
                  <p className="text-white font-semibold">100% Certified</p>
                </div>
                <div className="text-right">
                  <p>Fast Shipping</p>
                  <p className="text-white font-semibold">Express Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selling Points */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 flex items-start space-x-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base mb-1">100% Genuine Spares</h3>
            <p className="text-slate-400 text-sm">Direct source warranties from premium global brands and certified manufacturers.</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 flex items-start space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Truck className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base mb-1">Express Delivery</h3>
            <p className="text-slate-400 text-sm">Safe, secure packaging shipped directly to your garage within 3-5 business days.</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 flex items-start space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <RefreshCw className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base mb-1">Hassle-Free Returns</h3>
            <p className="text-slate-400 text-sm">Simple 7-day part compatibility returns if a spare does not fit your machine.</p>
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Shop Parts By Category</h2>
          <p className="text-slate-400 text-sm">Select a category to narrow down your spare part requirements.</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading catalog categories...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.slug}`}
                className="glass-panel glass-panel-hover p-5 rounded-2xl text-center text-decoration-none group flex flex-col justify-between h-44"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3 border border-slate-700/50 group-hover:border-amber-500/50 transition-smooth">
                  <Wrench className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-1 group-hover:text-amber-400 transition-smooth truncate">
                    {cat.name}
                  </h3>
                  <p className="text-slate-500 text-xxs line-clamp-2">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Trending Parts</h2>
            <p className="text-slate-400 text-sm">Top-rated items currently requested by riders.</p>
          </div>
          <Link
            to="/catalog"
            className="text-decoration-none text-amber-500 font-bold hover:text-amber-400 text-sm flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading trending products...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <div
                key={prod.id}
                className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-smooth"
              >
                {/* Image Wrap */}
                <div className="h-44 bg-slate-900 rounded-xl overflow-hidden mb-4 relative border border-slate-800/60 flex items-center justify-center">
                  {prod.image.startsWith('/uploads') ? (
                    // Placeholder fallback rendering styled gradient box
                    <div className="w-full h-full gradient-gold-blue opacity-25 flex items-center justify-center">
                      <Wrench className="w-12 h-12 text-white" />
                    </div>
                  ) : (
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                  )}
                  {prod.stock === 0 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-500 text-white font-bold text-xxs uppercase">
                      Sold Out
                    </span>
                  )}
                  {prod.category && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400 text-xxs font-medium">
                      {prod.category.name}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm line-clamp-1 h-5">{prod.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-500 font-extrabold text-base">Rs. {prod.price}</span>
                    <span className="text-slate-500 text-xxs flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="text-slate-300 font-bold">4.8</span>
                    </span>
                  </div>
                  <Link
                    to={`/catalog/${prod.id}`}
                    className="w-full text-center py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-white font-bold text-xs text-decoration-none hover:bg-slate-800 block transition-smooth"
                  >
                    View Specifications
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
