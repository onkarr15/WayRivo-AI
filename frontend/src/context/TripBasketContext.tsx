import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../components/ui/Toast';

export type BasketItemType = 'HOTEL' | 'ACTIVITY' | 'PACKAGE' | 'DESTINATION';

export interface BasketItem {
  id: string;
  type: BasketItemType;
  title: string;
  destinationName?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  quantity?: number;
  details?: Record<string, any>;
}

interface TripBasketContextType {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  clearBasket: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  totalAmount: number;
  itemCount: number;
}

const TripBasketContext = createContext<TripBasketContextType | undefined>(undefined);

const BASKET_STORAGE_KEY = 'wayrivo_trip_basket';

export const TripBasketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<BasketItem[]>(() => {
    try {
      const stored = localStorage.getItem(BASKET_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to sync trip basket', e);
    }
  }, [items]);

  const addItem = (item: Omit<BasketItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.type === item.type);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.type === item.type
            ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
    toast.success(`Added "${item.title}" to trip plan!`);
    setIsDrawerOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.info('Item removed from trip');
  };

  const clearBasket = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <TripBasketContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearBasket,
        isDrawerOpen,
        setIsDrawerOpen,
        totalAmount,
        itemCount,
      }}
    >
      {children}
    </TripBasketContext.Provider>
  );
};

export const useTripBasket = () => {
  const context = useContext(TripBasketContext);
  if (!context) {
    throw new Error('useTripBasket must be used within a TripBasketProvider');
  }
  return context;
};
