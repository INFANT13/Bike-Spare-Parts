// Central Frontend configuration & helper functions
const API_BASE = ''; // Same origin since frontend is served statically by Spring Boot

// Auth state management
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

function setAuthToken(token) {
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
}

function logout() {
    setAuthToken(null);
    setUser(null);
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Global API Request Helper
async function fetchAPI(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        if (response.status === 401) {
            // Unauthorized, clean token state
            setAuthToken(null);
            setUser(null);
            // Only redirect if they are not already on auth page
            if (!window.location.pathname.includes('auth.html')) {
                window.location.href = 'auth.html';
            }
            throw new Error('Unauthorized - please log in again.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        return { success: false, message: error.message || 'Network connection failed' };
    }
}

// Toast alerts helper
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-lg font-bold transition-all duration-300 pointer-events-auto min-w-[250px] animate-slideIn ${
        type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
    }`;
    toast.innerText = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-10px]');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Dynamic navbar rendering
function renderNavbar() {
    const header = document.querySelector('header');
    if (!header) return;

    const user = getUser();
    const isLoggedIn = !!user;
    const isAdmin = isLoggedIn && user.role === 'admin';

    let navLinks = `
        <a href="catalog.html" class="text-slate-300 hover:text-amber-500 font-medium transition-smooth">Parts Catalog</a>
    `;

    if (isAdmin) {
        navLinks += `
            <a href="admin.html" class="text-slate-300 hover:text-amber-500 font-medium transition-smooth">Admin Panel</a>
        `;
    }

    let authSection = '';
    if (isLoggedIn) {
        authSection = `
            <div class="flex items-center space-x-4">
                <a href="cart.html" class="relative p-2 text-slate-300 hover:text-amber-500 transition-smooth">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span id="cart-badge" class="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
                </a>
                <a href="profile.html" class="text-slate-300 hover:text-amber-500 font-medium transition-smooth flex items-center space-x-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>${user.name.split(' ')[0]}</span>
                </a>
                <button onclick="logout()" class="px-4 py-2 border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 font-bold rounded-xl text-xs transition-smooth cursor-pointer">
                    Logout
                </button>
            </div>
        `;
    } else {
        authSection = `
            <a href="auth.html" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-smooth shadow-lg hover:shadow-amber-500/25">
                Login / Signup
            </a>
        `;
    }

    header.innerHTML = `
        <nav class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="index.html" class="flex items-center space-x-2">
                <span class="text-2xl font-black tracking-wider text-white flex items-center">
                    BIKE<span class="text-amber-500">SPARE</span><span class="text-xs bg-slate-800 text-slate-400 ml-1.5 px-2 py-0.5 rounded">PRO</span>
                </span>
            </a>
            
            <div class="hidden md:flex items-center space-x-8">
                ${navLinks}
            </div>

            <div class="flex items-center space-x-4">
                ${authSection}
            </div>
        </nav>
    `;

    if (isLoggedIn) {
        updateCartBadge();
    }
}

// Refresh and update cart items count badge
async function updateCartBadge() {
    const data = await fetchAPI('/api/cart');
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    if (data.success && data.items && data.items.length > 0) {
        const totalItems = data.items.reduce((total, item) => total + item.quantity, 0);
        badge.innerText = totalItems;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Dynamic footer rendering
function renderFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 py-12 border-t border-slate-800/80">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div class="space-y-4">
                    <h4 class="text-lg font-bold text-white">BikeSparePro</h4>
                    <p class="text-slate-400 text-sm">Your reliable hub for premium-grade, genuine two-wheeler spare parts. Engineered to fit, built to last.</p>
                </div>
                <div>
                    <h5 class="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Shop</h5>
                    <ul class="space-y-2 text-sm text-slate-400">
                        <li><a href="catalog.html" class="hover:text-amber-500 transition-smooth">Engine Parts</a></li>
                        <li><a href="catalog.html" class="hover:text-amber-500 transition-smooth">Brakes & Friction</a></li>
                        <li><a href="catalog.html" class="hover:text-amber-500 transition-smooth">Suspensions</a></li>
                    </ul>
                </div>
                <div>
                    <h5 class="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Support</h5>
                    <ul class="space-y-2 text-sm text-slate-400">
                        <li><a href="#" class="hover:text-amber-500 transition-smooth">Shipping Information</a></li>
                        <li><a href="#" class="hover:text-amber-500 transition-smooth">Warranty Policies</a></li>
                        <li><a href="#" class="hover:text-amber-500 transition-smooth">Contact Us</a></li>
                    </ul>
                </div>
                <div>
                    <h5 class="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Secure Store</h5>
                    <p class="text-slate-400 text-sm mb-2">Checkout securely with standard mock demo payments.</p>
                    <div class="flex items-center space-x-3 text-slate-500">
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
                    </div>
                </div>
            </div>
            <div class="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
                &copy; ${new Date().getFullYear()} BikeSparePro Inc. All rights reserved. Made for e-commerce simulation.
            </div>
        </div>
    `;
}

// Auto render on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderFooter();
});
