import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadData, saveData, STORAGE_KEYS } from '@/storage';
import {
  AppSettings,
  Area,
  Customer,
  DEFAULT_SETTINGS,
  Expense,
  generateId,
  Item,
  Order,
  PaymentMethod,
  Street,
} from '@/types';

interface DataContextType {
  // Areas
  areas: Area[];
  addArea: (name: string, isSub?: boolean) => void;
  editArea: (id: string, name: string, isSub?: boolean) => void;
  deleteArea: (id: string) => void;

  // Streets
  streets: Street[];
  addStreet: (areaId: string, areaName: string, name: string, isSub?: boolean) => void;
  editStreet: (id: string, name: string, isSub?: boolean) => void;
  deleteStreet: (id: string) => void;
  getStreetsForArea: (areaId: string) => Street[];

  // Customers
  customers: Customer[];
  addCustomer: (data: Omit<Customer, 'id' | 'outstandingBalance' | 'totalOrders' | 'totalPaid' | 'customerSince' | 'lastOrderDate'>) => void;
  editCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomersForStreet: (streetId: string) => Customer[];
  getCustomerById: (id: string) => Customer | undefined;

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  editOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  updateDeliveryStatus: (id: string, status: Order['deliveryStatus']) => void;
  addPayment: (orderId: string, amount: number, method: PaymentMethod) => void;
  getOrdersForCustomer: (customerId: string) => Order[];

  // Items
  items: Item[];
  addItem: (data: Omit<Item, 'id'>) => void;
  editItem: (id: string, data: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  getLowStockItems: () => Item[];

  // Expenses
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id'>) => void;
  editExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (data: Partial<AppSettings>) => void;

  // State
  isLoaded: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [a, s, c, o, it, e, st] = await Promise.all([
        loadData<Area[]>(STORAGE_KEYS.AREAS, []),
        loadData<Street[]>(STORAGE_KEYS.STREETS, []),
        loadData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []),
        loadData<Order[]>(STORAGE_KEYS.ORDERS, []),
        loadData<Item[]>(STORAGE_KEYS.ITEMS, []),
        loadData<Expense[]>(STORAGE_KEYS.EXPENSES, []),
        loadData<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
      ]);
      setAreas(a);
      setStreets(s);
      setCustomers(c);
      setOrders(o);
      setItems(it);
      setExpenses(e);
      setSettings(st);
      setIsLoaded(true);
    }
    load();
  }, []);

  // Areas
  const addArea = useCallback((name: string, isSub = false) => {
    const area: Area = { id: generateId(), name, createdAt: new Date().toISOString(), isSub };
    setAreas(prev => {
      const next = [...prev, area];
      saveData(STORAGE_KEYS.AREAS, next);
      return next;
    });
  }, []);

  const editArea = useCallback((id: string, name: string, isSub?: boolean) => {
    setAreas(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, name, isSub: isSub !== undefined ? isSub : a.isSub } : a));
      saveData(STORAGE_KEYS.AREAS, next);
      return next;
    });
    setStreets(prev => {
      const next = prev.map(s => (s.areaId === id ? { ...s, areaName: name } : s));
      saveData(STORAGE_KEYS.STREETS, next);
      return next;
    });
    setCustomers(prev => {
      const next = prev.map(c => (c.areaId === id ? { ...c, areaName: name } : c));
      saveData(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
  }, []);

  const deleteArea = useCallback((id: string) => {
    setAreas(prev => {
      const next = prev.filter(a => a.id !== id);
      saveData(STORAGE_KEYS.AREAS, next);
      return next;
    });
    setStreets(prev => {
      const next = prev.filter(s => s.areaId !== id);
      saveData(STORAGE_KEYS.STREETS, next);
      return next;
    });
    setCustomers(prev => {
      const next = prev.filter(c => c.areaId !== id);
      saveData(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
  }, []);

  // Streets
  const addStreet = useCallback((areaId: string, areaName: string, name: string, isSub = false) => {
    const street: Street = { id: generateId(), areaId, areaName, name, createdAt: new Date().toISOString(), isSub };
    setStreets(prev => {
      const next = [...prev, street];
      saveData(STORAGE_KEYS.STREETS, next);
      return next;
    });
  }, []);

  const editStreet = useCallback((id: string, name: string, isSub?: boolean) => {
    setStreets(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, name, isSub: isSub !== undefined ? isSub : s.isSub } : s));
      saveData(STORAGE_KEYS.STREETS, next);
      return next;
    });
    setCustomers(prev => {
      const next = prev.map(c => (c.streetId === id ? { ...c, streetName: name } : c));
      saveData(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
  }, []);

  const deleteStreet = useCallback((id: string) => {
    setStreets(prev => {
      const next = prev.filter(s => s.id !== id);
      saveData(STORAGE_KEYS.STREETS, next);
      return next;
    });
    setCustomers(prev => {
      const next = prev.filter(c => c.streetId !== id);
      saveData(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
  }, []);

  const getStreetsForArea = useCallback(
    (areaId: string) => streets.filter(s => s.areaId === areaId),
    [streets],
  );

  // Customers
  const addCustomer = useCallback(
    (data: Omit<Customer, 'id' | 'outstandingBalance' | 'totalOrders' | 'totalPaid' | 'customerSince' | 'lastOrderDate'>) => {
      const customer: Customer = {
        ...data,
        id: generateId(),
        outstandingBalance: 0,
        totalOrders: 0,
        totalPaid: 0,
        customerSince: new Date().toISOString(),
        lastOrderDate: '',
      };
      setCustomers(prev => {
        const next = [...prev, customer];
        saveData(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
    },
    [],
  );

  const editCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setCustomers(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...data } : c));
      saveData(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => {
      const next = prev.filter(c => c.id !== id);
      saveData(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
    setOrders(prev => {
      const next = prev.filter(o => o.customerId !== id);
      saveData(STORAGE_KEYS.ORDERS, next);
      return next;
    });
  }, []);

  const getCustomersForStreet = useCallback(
    (streetId: string) => customers.filter(c => c.streetId === streetId),
    [customers],
  );

  const getCustomerById = useCallback(
    (id: string) => customers.find(c => c.id === id),
    [customers],
  );

  // Orders
  const addOrder = useCallback(
    (orderData: Omit<Order, 'id' | 'createdAt'>) => {
      const order: Order = {
        ...orderData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setOrders(prev => {
        const next = [...prev, order];
        saveData(STORAGE_KEYS.ORDERS, next);
        return next;
      });
      // Update customer stats
      setCustomers(prev => {
        const next = prev.map(c => {
          if (c.id !== orderData.customerId) return c;
          return {
            ...c,
            totalOrders: c.totalOrders + 1,
            totalPaid: c.totalPaid + orderData.paidAmount,
            outstandingBalance: c.outstandingBalance + orderData.remainingAmount,
            lastOrderDate: new Date().toISOString(),
          };
        });
        saveData(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
      // Decrease stock
      if (orderData.items.length > 0) {
        setItems(prev => {
          const next = prev.map(item => {
            const ordered = orderData.items.find(i => i.itemId === item.id);
            if (!ordered) return item;
            return { ...item, stock: Math.max(0, item.stock - ordered.quantity) };
          });
          saveData(STORAGE_KEYS.ITEMS, next);
          return next;
        });
      }
    },
    [],
  );

  const editOrder = useCallback((id: string, data: Partial<Order>) => {
    setOrders(prev => {
      const next = prev.map(o => (o.id === id ? { ...o, ...data } : o));
      saveData(STORAGE_KEYS.ORDERS, next);
      return next;
    });
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => {
      const order = prev.find(o => o.id === id);
      const next = prev.filter(o => o.id !== id);
      saveData(STORAGE_KEYS.ORDERS, next);
      if (order) {
        setCustomers(cprev => {
          const cnext = cprev.map(c => {
            if (c.id !== order.customerId) return c;
            return {
              ...c,
              totalOrders: Math.max(0, c.totalOrders - 1),
              totalPaid: Math.max(0, c.totalPaid - order.paidAmount),
              outstandingBalance: Math.max(0, c.outstandingBalance - order.remainingAmount),
            };
          });
          saveData(STORAGE_KEYS.CUSTOMERS, cnext);
          return cnext;
        });
      }
      return next;
    });
  }, []);

  const updateDeliveryStatus = useCallback((id: string, status: Order['deliveryStatus']) => {
    setOrders(prev => {
      const next = prev.map(o => (o.id === id ? { ...o, deliveryStatus: status } : o));
      saveData(STORAGE_KEYS.ORDERS, next);
      return next;
    });
  }, []);

  const addPayment = useCallback((orderId: string, amount: number, method: PaymentMethod) => {
    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id !== orderId) return o;
        const newPaid = Math.min(o.grandTotal, o.paidAmount + amount);
        const newRemaining = Math.max(0, o.grandTotal - newPaid);
        return { ...o, paidAmount: newPaid, remainingAmount: newRemaining, paymentMethod: method };
      });
      saveData(STORAGE_KEYS.ORDERS, next);
      const order = next.find(o => o.id === orderId);
      if (order) {
        setCustomers(cprev => {
          const cnext = cprev.map(c => {
            if (c.id !== order.customerId) return c;
            return {
              ...c,
              totalPaid: c.totalPaid + amount,
              outstandingBalance: Math.max(0, c.outstandingBalance - amount),
            };
          });
          saveData(STORAGE_KEYS.CUSTOMERS, cnext);
          return cnext;
        });
      }
      return next;
    });
  }, []);

  const getOrdersForCustomer = useCallback(
    (customerId: string) =>
      orders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  // Items
  const addItem = useCallback((data: Omit<Item, 'id'>) => {
    const item: Item = { ...data, id: generateId() };
    setItems(prev => {
      const next = [...prev, item];
      saveData(STORAGE_KEYS.ITEMS, next);
      return next;
    });
  }, []);

  const editItem = useCallback((id: string, data: Partial<Item>) => {
    setItems(prev => {
      const next = prev.map(i => (i.id === id ? { ...i, ...data } : i));
      saveData(STORAGE_KEYS.ITEMS, next);
      return next;
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      saveData(STORAGE_KEYS.ITEMS, next);
      return next;
    });
  }, []);

  const adjustStock = useCallback((id: string, delta: number) => {
    setItems(prev => {
      const next = prev.map(i =>
        i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i,
      );
      saveData(STORAGE_KEYS.ITEMS, next);
      return next;
    });
  }, []);

  const getLowStockItems = useCallback(
    () => items.filter(i => i.stock <= i.minStock),
    [items],
  );

  // Expenses
  const addExpense = useCallback((data: Omit<Expense, 'id'>) => {
    const expense: Expense = { ...data, id: generateId() };
    setExpenses(prev => {
      const next = [...prev, expense];
      saveData(STORAGE_KEYS.EXPENSES, next);
      return next;
    });
  }, []);

  const editExpense = useCallback((id: string, data: Partial<Expense>) => {
    setExpenses(prev => {
      const next = prev.map(e => (e.id === id ? { ...e, ...data } : e));
      saveData(STORAGE_KEYS.EXPENSES, next);
      return next;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      saveData(STORAGE_KEYS.EXPENSES, next);
      return next;
    });
  }, []);

  // Settings
  const updateSettings = useCallback((data: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...data };
      saveData(STORAGE_KEYS.SETTINGS, next);
      return next;
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        areas, addArea, editArea, deleteArea,
        streets, addStreet, editStreet, deleteStreet, getStreetsForArea,
        customers, addCustomer, editCustomer, deleteCustomer,
        getCustomersForStreet, getCustomerById,
        orders, addOrder, editOrder, deleteOrder,
        updateDeliveryStatus, addPayment, getOrdersForCustomer,
        items, addItem, editItem, deleteItem, adjustStock, getLowStockItems,
        expenses, addExpense, editExpense, deleteExpense,
        settings, updateSettings,
        isLoaded,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
