import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
import { ExpenseCard } from '@/components/Cards';
import { EmptyState, FAB, FormField, ModalHeader, PrimaryButton, SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory, PAYMENT_METHODS, PaymentMethod } from '@/types';

export default function ExpensesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, addExpense, editExpense, deleteExpense } = useData();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const filtered = useMemo(
    () =>
      expenses
        .filter(e =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, search],
  );

  const totalThisMonth = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  function openAdd() {
    setEditingId(null);
    setName(''); setCategory('Other'); setAmount('');
    setDate(new Date().toISOString().split('T')[0]); setNotes(''); setPaymentMethod('cash');
    setModalVisible(true);
  }

  function openEdit(expense: Expense) {
    setEditingId(expense.id);
    setName(expense.name); setCategory(expense.category); setAmount(String(expense.amount));
    setDate(expense.date); setNotes(expense.notes || ''); setPaymentMethod(expense.paymentMethod);
    setModalVisible(true);
  }

  function handleSave() {
    if (!name.trim() || !amount) return;
    const data = {
      name: name.trim(),
      category,
      amount: parseFloat(amount),
      date,
      notes: notes.trim(),
      paymentMethod,
    };
    if (editingId) {
      editExpense(editingId, data);
    } else {
      addExpense(data);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  function handleDelete(expense: Expense) {
    Alert.alert('Delete Expense', `Delete "${expense.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteExpense(expense.id),
      },
    ]);
  }

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.foreground }]}>Expenses</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            This month: ₹{totalThisMonth.toFixed(2)}
          </Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search expenses..." />

      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onPress={() => openEdit(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="credit-card"
            title={search ? 'No expenses found' : 'No expenses yet'}
            subtitle="Track transport, salaries, supplies and more"
            action={!search ? { label: 'Add Expense', onPress: openAdd } : undefined}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={openAdd} />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <ModalHeader
            title={editingId ? 'Edit Expense' : 'New Expense'}
            onClose={() => setModalVisible(false)}
            rightAction={{ label: 'Save', onPress: handleSave }}
          />
          <KeyboardAwareScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FormField label="Expense Name" value={name} onChangeText={setName} required />
            <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" required />
            <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.muted, borderColor: category === cat ? colors.primary : colors.border }]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipTxt, { color: category === cat ? '#fff' : colors.mutedForeground }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, { backgroundColor: paymentMethod === m ? colors.primary : colors.muted, borderColor: paymentMethod === m ? colors.primary : colors.border }]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text style={[styles.chipTxt, { color: paymentMethod === m ? '#fff' : colors.mutedForeground }]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />

            <PrimaryButton label={editingId ? 'Save Changes' : 'Add Expense'} onPress={handleSave} disabled={!name.trim() || !amount} />
            {editingId && (
              <PrimaryButton label="Delete Expense" onPress={() => {
                setModalVisible(false);
                setTimeout(() => deleteExpense(editingId), 300);
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
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  list: { paddingTop: 8, flexGrow: 1 },
  modal: { flex: 1 },
  modalBody: { padding: 16, gap: 4 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  methodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
});
