import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ShoppingItem } from '../types';
import { loadUserData, saveUserData } from '../utils/userStorage';
import {
  fetchShoppingItems,
  upsertShoppingItem,
  upsertShoppingItems,
  deleteShoppingItem,
  deleteShoppingItems,
} from '../services/data/supabaseData';

interface ShoppingListContextValue {
  items: ShoppingItem[];
  isMerging: boolean;
  toggleItem: (id: string) => void;
  addItems: (newItems: ShoppingItem[]) => void;
  replaceItems: (newItems: ShoppingItem[]) => void;
  removeItem: (id: string) => void;
  clearChecked: () => void;
  setMerging: (v: boolean) => void;
}

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

export function ShoppingListProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [items, setItems] = useState<ShoppingItem[]>(() =>
    loadUserData<ShoppingItem[]>(userId, 'shoppingList') ?? []
  );
  const [isMerging, setMerging] = useState(false);

  // Load from localStorage on userId change
  useEffect(() => {
    setItems(loadUserData<ShoppingItem[]>(userId, 'shoppingList') ?? []);
  }, [userId]);

  // Fetch from Supabase on mount / userId change
  useEffect(() => {
    fetchShoppingItems(userId).then((cloud) => {
      if (cloud !== null) {
        setItems(cloud);
        saveUserData(userId, 'shoppingList', cloud);
      }
    });
  }, [userId]);

  // Helper: persist to localStorage after state update
  const saveLocal = useCallback((updater: (prev: ShoppingItem[]) => ShoppingItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      saveUserData(userId, 'shoppingList', next);
      return next;
    });
  }, [userId]);

  const toggleItem = useCallback((id: string) => {
    saveLocal((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      const item = updated.find((i) => i.id === id);
      if (item) upsertShoppingItem(userId, item);
      return updated;
    });
  }, [userId, saveLocal]);

  const addItems = useCallback((newItems: ShoppingItem[]) => {
    saveLocal((prev) => [...prev, ...newItems]);
    upsertShoppingItems(userId, newItems);
  }, [userId, saveLocal]);

  const replaceItems = useCallback((newItems: ShoppingItem[]) => {
    // Replace is used by ingredient merge — delete old items, insert new
    saveLocal((prev) => {
      const oldIds = prev.map((i) => i.id);
      deleteShoppingItems(userId, oldIds);
      return newItems;
    });
    upsertShoppingItems(userId, newItems);
  }, [userId, saveLocal]);

  const removeItem = useCallback((id: string) => {
    saveLocal((prev) => prev.filter((item) => item.id !== id));
    deleteShoppingItem(userId, id);
  }, [userId, saveLocal]);

  const clearChecked = useCallback(() => {
    saveLocal((prev) => {
      const checkedIds = prev.filter((item) => item.checked).map((i) => i.id);
      deleteShoppingItems(userId, checkedIds);
      return prev.filter((item) => !item.checked);
    });
  }, [userId, saveLocal]);

  const value = useMemo(() => ({
    items,
    isMerging,
    toggleItem,
    addItems,
    replaceItems,
    removeItem,
    clearChecked,
    setMerging,
  }), [items, isMerging, toggleItem, addItems, replaceItems, removeItem, clearChecked]);

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error('useShoppingList must be used within ShoppingListProvider');
  return ctx;
}
