import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ShieldCheck, Wrench, Menu, X, Home } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-50 px-4 py-3 shadow-lg border-b border-[rgba(255,255,255,0.06)]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 text-decoration-none group">
          <Wrench className="w-8 h-8 text-amber-500 group-hover:rotate-45 transition-smooth" />
          <span className="text-xl font-extrabold tracking-wider text-white group-hover:text-amber-400 transition-smooth">
            BIKE<span className="text-amber-500 font-light">SPARE</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`flex items-center space-x-1 text-decoration-none font-medium transition-smooth ${
              isActive('/') ? 'text-amber-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            <span>Home</span>
          </Link>
          <Link
            to="/catalog"
            className={`text-decoration-none font-medium transition-smooth ${
              isActive('/catalog') ? 'text-amber-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            Parts Catalog
          </Link>
        </div>

        {/* Action Controls */}
        <div className="hidden md:flex items-center space-x-5">
          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative p-2 text-slate-300 hover:text-amber-500 hover:scale-105 transition-smooth"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Admin Indicator */}
          {user && user.role === 'admin' && (
            <Link
              to="/admin"
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/20 text-decoration-none text-red-400 font-semibold text-sm hover:bg-red-950/40 transition-smooth ${
                isActive('/admin') ? 'border-red-500 bg-red-950/30' : ''
              }`}
              title="Admin Panel"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}

          {/* User Account / Auth Toggle */}
          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className={`flex items-center space-x-1.5 text-decoration-none text-sm transition-smooth font-medium ${
                  isActive('/profile') ? 'text-amber-500' : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-5 h-5 text-amber-500" />
                <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-sm transition-smooth border border-slate-700/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm text-decoration-none hover:bg-amber-400 hover:scale-102 transition-smooth shadow-lg shadow-amber-500/10"
            >
              <span>Login / Register</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <Link to="/cart" className="relative p-2 text-slate-300">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-300 hover:text-amber-500 focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden mt-3 p-4 rounded-xl bg-slate-950/95 border border-slate-800/80 animate-fadeIn">
          <div className="flex flex-col space-y-4">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="text-decoration-none text-slate-300 hover:text-amber-500 py-1"
            >
              Home
            </Link>
            <Link
              to="/catalog"
              onClick={() => setIsOpen(false)}
              className="text-decoration-none text-slate-300 hover:text-amber-500 py-1"
            >
              Parts Catalog
            </Link>

            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="text-decoration-none text-red-400 font-semibold py-1 flex items-center space-x-1"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            <hr className="border-slate-800" />

            {user ? (
              <div className="flex flex-col space-y-3">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="text-decoration-none text-amber-500 py-1 flex items-center space-x-2"
                >
                  <User className="w-5 h-5" />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-slate-800 text-white font-bold text-sm border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm text-center text-decoration-none block hover:bg-amber-400"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
