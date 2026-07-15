import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadData, saveData, STORAGE_KEYS } from '@/storage';
import {
  AppSettings,
  Customer,
  DEFAULT_SETTINGS,
  Expense,
  generateId,
  Item,
  Location,
  LocationType,
  Order,
  PaymentMethod,
} from '@/types';

interface DataContextType {
  // Locations
  locations: Location[];
  addLocation: (name: string, type: LocationType, parentLocationId: string | null, notes?: string) => void;
  editLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  getBreadcrumbs: (locationId: string | null) => Location[];
  getLocationPath: (locationId: string | null) => string;
  getLocationsByParent: (parentLocationId: string | null) => Location[];
  getCustomersAtLocation: (locationId: string, recursive?: boolean) => Customer[];

  // Customers
  customers: Customer[];
  addCustomer: (data: Omit<Customer, 'id' | 'outstandingBalance' | 'totalOrders' | 'totalPaid' | 'customerSince' | 'lastOrderDate'>) => void;
  editCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      let locs = await loadData<Location[]>(STORAGE_KEYS.LOCATIONS, []);
      let custs = await loadData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);

      // Backward compatibility data migration
      if (locs.length === 0) {
        const legacyAreas = await loadData<any[]>(STORAGE_KEYS.AREAS, []);
        const legacyStreets = await loadData<any[]>(STORAGE_KEYS.STREETS, []);
        if (legacyAreas.length > 0 || legacyStreets.length > 0) {
          console.log('Migrating legacy Areas & Streets to Locations...');
          const migratedLocs: Location[] = [];

          // Migrate Areas
          legacyAreas.forEach((area, index) => {
            migratedLocs.push({
              id: area.id,
              parentLocationId: null,
              name: area.name,
              type: 'Area',
              sortOrder: index,
              createdAt: area.createdAt || new Date().toISOString(),
            });
          });

          // Migrate Streets
          legacyStreets.forEach((street, index) => {
            migratedLocs.push({
              id: street.id,
              parentLocationId: street.areaId,
              name: street.name,
              type: 'Road',
              sortOrder: index,
              createdAt: street.createdAt || new Date().toISOString(),
            });
          });

          locs = migratedLocs;
          await saveData(STORAGE_KEYS.LOCATIONS, locs);

          // Update Customer references
          custs = custs.map(c => {
            const legacyCust = c as any;
            const lid = legacyCust.streetId || legacyCust.areaId || '';
            const newCust = { ...c, locationId: lid };
            delete (newCust as any).streetId;
            delete (newCust as any).streetName;
            delete (newCust as any).areaId;
            delete (newCust as any).areaName;
            return newCust;
          });
          await saveData(STORAGE_KEYS.CUSTOMERS, custs);

          // Clear legacy keys
          await saveData(STORAGE_KEYS.AREAS, []);
          await saveData(STORAGE_KEYS.STREETS, []);
        }
      }

      const [o, it, e, st] = await Promise.all([
        loadData<Order[]>(STORAGE_KEYS.ORDERS, []),
        loadData<Item[]>(STORAGE_KEYS.ITEMS, []),
        loadData<Expense[]>(STORAGE_KEYS.EXPENSES, []),
        loadData<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
      ]);

      setLocations(locs);
      setCustomers(custs);
      setOrders(o);
      setItems(it);
      setExpenses(e);
      setSettings(st);
      setIsLoaded(true);
    }
    load();
  }, []);

  // Locations CRUD
  const addLocation = useCallback((name: string, type: LocationType, parentLocationId: string | null, notes?: string) => {
    setLocations(prev => {
      const siblings = prev.filter(l => l.parentLocationId === parentLocationId);
      const nextSortOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sortOrder)) + 1 : 0;
      const location: Location = {
        id: generateId(),
        parentLocationId,
        name,
        type,
        sortOrder: nextSortOrder,
        notes,
        createdAt: new Date().toISOString(),
      };
      const next = [...prev, location];
      saveData(STORAGE_KEYS.LOCATIONS, next);
      return next;
    });
  }, []);

  const editLocation = useCallback((id: string, updates: Partial<Location>) => {
    setLocations(prev => {
      const next = prev.map(l => (l.id === id ? { ...l, ...updates } : l));
      saveData(STORAGE_KEYS.LOCATIONS, next);
      return next;
    });
  }, []);

  const deleteLocation = useCallback((id: string) => {
    let newParentId: string | null = null;
    setLocations(prev => {
      const deletedLoc = prev.find(l => l.id === id);
      newParentId = deletedLoc ? deletedLoc.parentLocationId : null;
      const next = prev
        .filter(l => l.id !== id)
        .map(l => (l.parentLocationId === id ? { ...l, parentLocationId: newParentId } : l));
      saveData(STORAGE_KEYS.LOCATIONS, next);
      return next;
    });

    setCustomers(prev => {
      const next = prev.map(c => (c.locationId === id ? { ...c, locationId: newParentId || '' } : c));
      saveData(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
  }, []);

  const getBreadcrumbs = useCallback(
    (locationId: string | null): Location[] => {
      if (!locationId) return [];
      const crumbs: Location[] = [];
      let currentId: string | null = locationId;
      const maxDepth = 20;
      let count = 0;
      while (currentId && count < maxDepth) {
        const loc = locations.find(l => l.id === currentId);
        if (!loc) break;
        crumbs.unshift(loc);
        currentId = loc.parentLocationId;
        count++;
      }
      return crumbs;
    },
    [locations],
  );

  const getLocationPath = useCallback(
    (locationId: string | null): string => {
      const crumbs = getBreadcrumbs(locationId);
      return crumbs.map(c => c.name).join(' > ');
    },
    [getBreadcrumbs],
  );

  const getLocationsByParent = useCallback(
    (parentLocationId: string | null) => {
      return locations.filter(l => l.parentLocationId === parentLocationId);
    },
    [locations],
  );

  const getCustomersAtLocation = useCallback(
    (locationId: string, recursive = true): Customer[] => {
      if (!recursive) {
        return customers.filter(c => c.locationId === locationId);
      }
      const childIds = new Set<string>([locationId]);
      let queue = [locationId];
      const maxDepth = 20;
      let count = 0;
      while (queue.length > 0 && count < maxDepth) {
        const nextQueue: string[] = [];
        for (const q of queue) {
          const children = locations.filter(l => l.parentLocationId === q);
          for (const child of children) {
            if (!childIds.has(child.id)) {
              childIds.add(child.id);
              nextQueue.push(child.id);
            }
          }
        }
        queue = nextQueue;
        count++;
      }
      return customers.filter(c => childIds.has(c.locationId));
    },
    [locations, customers],
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
        locations,
        addLocation,
        editLocation,
        deleteLocation,
        getBreadcrumbs,
        getLocationPath,
        getLocationsByParent,
        getCustomersAtLocation,
        customers,
        addCustomer,
        editCustomer,
        deleteCustomer,
        getCustomerById,
        orders,
        addOrder,
        editOrder,
        deleteOrder,
        updateDeliveryStatus,
        addPayment,
        getOrdersForCustomer,
        items,
        addItem,
        editItem,
        deleteItem,
        adjustStock,
        getLowStockItems,
        expenses,
        addExpense,
        editExpense,
        deleteExpense,
        settings,
        updateSettings,
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
