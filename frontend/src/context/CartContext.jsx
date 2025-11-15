import { createContext, useContext, useState } from 'react';
import { cleanMenuItemName } from '../utils/nameCleaner';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    const cleanItem = {
      ...item,
      name: cleanMenuItemName(item.name)
    };
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === cleanItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === cleanItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...cleanItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotalEGP = cartItems.reduce(
    (sum, item) => sum + item.priceEGP * item.quantity,
    0
  );

  const vatEGP = subtotalEGP * 0.14;
  const totalEGP = subtotalEGP + vatEGP;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotalEGP,
        vatEGP,
        totalEGP,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

