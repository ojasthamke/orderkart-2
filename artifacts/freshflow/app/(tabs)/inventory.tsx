import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemCard } from '@/components/Cards';
import { EmptyState, FAB, FormField, ModalHeader, PrimaryButton, SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { Item, ITEM_CATEGORIES, ITEM_UNITS, ItemCategory, ItemUnit } from '@/types';

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  Vegetables: 'feather',
  Fruits: 'sun',
  Groceries: 'shopping-bag',
  Medicines: 'heart',
};

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, addItem, editItem, deleteItem, adjustStock } = useData();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'All'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Vegetables');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState<ItemUnit>('Kg');

  const filtered = useMemo(() => {
    return items
      .filter(i => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = categoryFilter === 'All' || i.category === categoryFilter;
        return matchSearch && matchCat;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search, categoryFilter]);

  const lowStockCount = items.filter(i => i.stock <= i.minStock).length;

  function openAdd() {
    setEditingId(null);
    setName(''); setCategory('Vegetables'); setCostPrice('');
    setSellingPrice(''); setStock(''); setMinStock('5'); setUnit('Kg');
    setModalVisible(true);
  }

  function openEdit(item: Item) {
    setEditingId(item.id);
    setName(item.name); setCategory(item.category); setCostPrice(String(item.costPrice));
    setSellingPrice(String(item.sellingPrice)); setStock(String(item.stock));
    setMinStock(String(item.minStock)); setUnit(item.unit);
    setModalVisible(true);
  }

  function handleSave() {
    if (!name.trim() || !sellingPrice) return;
    const data = {
      name: name.trim(),
      category,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stock: parseFloat(stock) || 0,
      minStock: parseFloat(minStock) || 0,
      unit,
    };
    if (editingId) {
      editItem(editingId, data);
    } else {
      addItem(data);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  function handleDelete(item: Item) {
    Alert.alert('Delete Item', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
    ]);
  }

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Inventory</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {items.length} items
          {lowStockCount > 0 && ` · `}
          {lowStockCount > 0 && (
            <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>
              {lowStockCount} low stock
            </Text>
          )}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingBottom: 12, gap: 8 }}>
          {(['All', ...ITEM_CATEGORIES] as (ItemCategory | 'All')[]).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                { backgroundColor: categoryFilter === cat ? colors.primary : colors.muted, borderColor: categoryFilter === cat ? colors.primary : colors.border },
              ]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.catChipText, { color: categoryFilter === cat ? '#fff' : colors.mutedForeground }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search items..." />

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => openEdit(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title={search ? 'No items found' : 'No items yet'}
            subtitle="Add vegetables, fruits, groceries, or medicines"
            action={!search ? { label: 'Add Item', onPress: openAdd } : undefined}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={openAdd} />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <ModalHeader
            title={editingId ? 'Edit Item' : 'New Item'}
            onClose={() => setModalVisible(false)}
            rightAction={{ label: 'Save', onPress: handleSave }}
          />
          <KeyboardAwareScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FormField label="Item Name" value={name} onChangeText={setName} required />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
              {ITEM_CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.selectChip, { backgroundColor: category === c ? colors.primary : colors.muted, borderColor: category === c ? colors.primary : colors.border }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.selectChipText, { color: category === c ? '#fff' : colors.mutedForeground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
              {ITEM_UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.selectChip, { backgroundColor: unit === u ? colors.primary : colors.muted, borderColor: unit === u ? colors.primary : colors.border }]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.selectChipText, { color: unit === u ? '#fff' : colors.mutedForeground }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField label="Cost Price" value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Selling Price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" required />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField label="Current Stock" value={stock} onChangeText={setStock} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Min Stock" value={minStock} onChangeText={setMinStock} keyboardType="numeric" />
              </View>
            </View>

            <PrimaryButton label={editingId ? 'Save Changes' : 'Add Item'} onPress={handleSave} disabled={!name.trim() || !sellingPrice} />
            {editingId && (
              <PrimaryButton label="Delete Item" onPress={() => {
                const item = { id: editingId } as Item;
                setModalVisible(false);
                setTimeout(() => deleteItem(editingId), 300);
              }} variant="danger" />
            )}
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  list: { paddingTop: 8, flexGrow: 1 },
  modal: { flex: 1 },
  modalBody: { padding: 16, gap: 4 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  selectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  selectChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', gap: 12 },
});
