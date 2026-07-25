import React, { createContext, useContext, useMemo, useState } from "react";

/* ---------------- Types ---------------- */

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  increaseQty: (productId: string) => void;
  decreaseQty: (productId: string) => void;
  clearCart: () => void;
};

/* ---------------- Context ---------------- */

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ---------------- Provider ---------------- */

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);

  /* -------- Actions -------- */

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find(
        (p) => p.productId === item.productId
      );

      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const increaseQty = (productId: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, quantity: p.quantity + 1 }
          : p
      )
    );
  };

  const decreaseQty = (productId: string) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.productId === productId
            ? { ...p, quantity: p.quantity - 1 }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  /* -------- Derived values -------- */

  const totalAmount = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const value: CartContextType = {
    items,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    increaseQty,
    decreaseQty,
    clearCart,
  };

return (
  <CartContext.Provider value={value}>
    {typeof children === "string" ? null : children}
  </CartContext.Provider>
);


};

/* ---------------- Hook ---------------- */

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
