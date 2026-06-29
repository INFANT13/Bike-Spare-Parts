import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Phone, MapPin } from 'lucide-react';

const Auth: React.FC = () => {
  const { login, register, token } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to catalog
  React.useEffect(() => {
    if (token) {
      navigate('/catalog');
    }
  }, [token, navigate]);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          navigate('/catalog');
        } else {
          setError(res.message || 'Login failed');
        }
      } else {
        const res = await register({ name, email, password, phone, address });
        if (res.success) {
          navigate('/catalog');
        } else {
          setError(res.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('An unexpected authorization error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6">
        {/* Toggle Headings */}
        <div className="flex border-b border-slate-850 pb-4">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`w-1/2 text-center pb-2 text-sm font-extrabold transition-smooth focus:outline-none border-b-2 ${
              isLogin ? 'border-amber-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center justify-center space-x-1.5">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </span>
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`w-1/2 text-center pb-2 text-sm font-extrabold transition-smooth focus:outline-none border-b-2 ${
              !isLogin ? 'border-amber-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center justify-center space-x-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  required={!isLogin}
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="customer@bikespareparts.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                required
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="9998887776"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Default Delivery Address</label>
                <div className="relative">
                  <textarea
                    placeholder="Street, City, PIN Code"
                    value={address}
                    rows={2}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center space-x-1.5 hover:bg-amber-400 transition-smooth shadow-lg shadow-amber-500/10"
          >
            <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          {isLogin ? (
            <p>
              Demo credentials: <br/>
              Admin: <code className="text-slate-400">admin@bikespareparts.com</code> / <code className="text-slate-400">admin123</code><br/>
              Customer: <code className="text-slate-400">customer@bikespareparts.com</code> / <code className="text-slate-400">customer123</code>
            </p>
          ) : (
            <p>Signing up generates a clean customer profile and an empty shopping cart.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
