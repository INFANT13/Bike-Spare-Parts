import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: number;
  quantity: number;
  productId: number;
  Product: {
    id: number;
    name: string;
    price: number;
    image: string;
    stock: number;
    sku: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  cartCount: number;
  cartTotal: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (productId: number, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (productId: number) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!token) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get('/cart');
      if (res.data.success) {
        setCartItems(res.data.items);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync cart when token/user changes
  useEffect(() => {
    fetchCart();
  }, [token, user]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!token) {
      return { success: false, message: 'Please login to add items to your cart.' };
    }
    try {
      const res = await API.post('/cart/add', { productId, quantity });
      if (res.data.success) {
        await fetchCart(); // Reload cart details
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      console.error('Add to cart failed:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to add item to cart.'
      };
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!token) return { success: false, message: 'Not authorized' };
    try {
      const res = await API.put('/cart/update', { productId, quantity });
      if (res.data.success) {
        // Optimistically update or refetch
        await fetchCart();
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      console.error('Update quantity failed:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update quantity.'
      };
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!token) return { success: false, message: 'Not authorized' };
    try {
      const res = await API.delete(`/cart/remove/${productId}`);
      if (res.data.success) {
        await fetchCart();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      console.error('Remove item failed:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to remove item.'
      };
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      const res = await API.delete('/cart/clear');
      if (res.data.success) {
        setCartItems([]);
      }
    } catch (err) {
      console.error('Clear cart failed:', err);
    }
  };

  // Compute total items and price
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.Product ? parseFloat(item.Product.price as any) : 0;
    return total + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        cartCount,
        cartTotal,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
