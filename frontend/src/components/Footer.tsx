import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05070e] border-t border-[rgba(255,255,255,0.05)] pt-12 pb-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Information */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center space-x-2 text-decoration-none group">
            <Wrench className="w-7 h-7 text-amber-500 group-hover:rotate-45 transition-smooth" />
            <span className="text-lg font-extrabold tracking-wider text-white">
              BIKE<span className="text-amber-500 font-light">SPARE</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your premium destination for authentic, high-quality, and certified motorcycle spare parts. Elevating your riding experience since 2026.
          </p>
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Genuine Certified Spares</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-amber-500/20 pb-2">Quick Navigation</h4>
          <ul className="list-unstyled space-y-2">
            <li>
              <Link to="/" className="text-decoration-none text-slate-400 hover:text-amber-400 text-sm transition-smooth">
                Home Page
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="text-decoration-none text-slate-400 hover:text-amber-400 text-sm transition-smooth">
                Parts Catalog
              </Link>
            </li>
            <li>
              <Link to="/cart" className="text-decoration-none text-slate-400 hover:text-amber-400 text-sm transition-smooth">
                Shopping Cart
              </Link>
            </li>
            <li>
              <Link to="/profile" className="text-decoration-none text-slate-400 hover:text-amber-400 text-sm transition-smooth">
                My Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Coordinates */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-amber-500/20 pb-2">Contact Details</h4>
          <ul className="list-unstyled space-y-3 text-slate-400 text-sm">
            <li className="flex items-start space-x-2">
              <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
              <span>45, Rider Lane, Velocity Road, Bangalore, PIN 560001</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-amber-500" />
              <span>+91 99988 87776</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>support@bikespareparts.com</span>
            </li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-amber-500/20 pb-2">Stay Updated</h4>
          <p className="text-slate-400 text-sm mb-3">
            Subscribe to receive alerts about stock arrivals, brand updates, and special discounts.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Your email address"
              className="px-3 py-2 rounded-l-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 w-full"
            />
            <button className="px-4 py-2 rounded-r-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-smooth text-sm">
              Join
            </button>
          </div>
        </div>
      </div>

      <hr className="border-slate-800/80 mb-6" />

      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs">
        <p>© 2026 Bike Spare Parts E-Commerce Store. All Rights Reserved.</p>
        <p className="flex items-center space-x-1 mt-2 md:mt-0">
          <span>Engineered with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
          <span>for passionate riders.</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
