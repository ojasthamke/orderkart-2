import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  LOCATIONS: '@freshflow/locations',
  AREAS: '@freshflow/areas',
  STREETS: '@freshflow/streets',
  CUSTOMERS: '@freshflow/customers',
  ORDERS: '@freshflow/orders',
  ITEMS: '@freshflow/items',
  EXPENSES: '@freshflow/expenses',
  SETTINGS: '@freshflow/settings',
};

export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('AsyncStorage save error', e);
  }
}
