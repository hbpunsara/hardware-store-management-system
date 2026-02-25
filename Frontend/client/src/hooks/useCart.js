import { useState, useCallback } from "react";

export const useCart = () => {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  const addItem = useCallback((product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.productId);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.09;
  const tax = subtotal * taxRate;
  const total = subtotal + tax - discount;

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    tax,
    discount,
    setDiscount,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

export default useCart;
