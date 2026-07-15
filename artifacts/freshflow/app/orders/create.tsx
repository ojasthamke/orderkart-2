import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import {
  Customer,
  Item,
  OrderItem,
  PaymentMethod,
  smartRound,
  PAYMENT_METHODS,
} from '@/types';

const PRESET_QTY = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];

export default function CreateOrderScreen() {
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, items, addOrder, settings, getLocationPath } = useData();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    customerId ? (customers.find(c => c.id === customerId) ?? null) : null,
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [deliveryCharge, setDeliveryCharge] = useState(String(settings.deliveryCharge));
  const [useSmartRounding, setUseSmartRounding] = useState(settings.smartRounding);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'customer' | 'items' | 'summary'>(
    customerId ? 'items' : 'customer',
  );
  const [itemSearch, setItemSearch] = useState('');
  const [qtyModalItem, setQtyModalItem] = useState<Item | null>(null);
  const [customQty, setCustomQty] = useState('1');
  const [custSearch, setCustSearch] = useState('');

  const filteredItems = useMemo(
    () =>
      items.filter(i =>
        i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.category.toLowerCase().includes(itemSearch.toLowerCase()),
      ),
    [items, itemSearch],
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        c =>
          c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
          c.phone.includes(custSearch),
      ),
    [customers, custSearch],
  );

  const subtotal = orderItems.reduce((s, i) => s + i.total, 0);
  const discountAmt = parseFloat(discount) || 0;
  const afterDiscount = subtotal - discountAmt;
  const dc = parseFloat(deliveryCharge) || 0;
  const beforeRounding = afterDiscount + dc;
  const rounded = useSmartRounding ? smartRound(beforeRounding) : beforeRounding;
  const grandTotal = rounded;
  const paidAmt = parseFloat(paidAmount) || 0;
  const remainingAmount = Math.max(0, grandTotal - paidAmt);

  function addItemToOrder(item: Item, qty: number) {
    const total = qty * item.sellingPrice;
    setOrderItems(prev => {
      const existing = prev.findIndex(i => i.itemId === item.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantity: qty,
          total: qty * item.sellingPrice,
        };
        return updated;
      }
      return [
        ...prev,
        {
          itemId: item.id,
          itemName: item.name,
          quantity: qty,
          unit: item.unit,
          price: item.sellingPrice,
          total,
        },
      ];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQtyModalItem(null);
  }

  function removeItem(itemId: string) {
    setOrderItems(prev => prev.filter(i => i.itemId !== itemId));
  }

  function handlePlaceOrder() {
    if (!selectedCustomer || orderItems.length === 0) return;
    addOrder({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: `${selectedCustomer.houseNumber ? `${selectedCustomer.houseNumber}, ` : ''}${selectedCustomer.address} (${getLocationPath(selectedCustomer.locationId)})`,
      items: orderItems,
      subtotal,
      discount: discountAmt,
      roundedAmount: rounded,
      deliveryCharge: dc,
      grandTotal,
      paidAmount: paidAmt,
      remainingAmount,
      paymentMethod,
      deliveryStatus: 'pending',
      notes,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Order Placed', `Order for ${selectedCustomer.name} created successfully!`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const c = colors;

  // ── Step: Select Customer ──────────────────────────────────────────────────
  if (step === 'customer') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: c.card, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Select Customer</Text>
        </View>
        <SearchBar value={custSearch} onChangeText={setCustSearch} placeholder="Search customers..." />
        <FlatList
          data={filteredCustomers}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.custRow, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => { setSelectedCustomer(item); setStep('items'); }}
              activeOpacity={0.7}
            >
              <View style={[styles.custAvatar, { backgroundColor: c.secondary }]}>
                <Text style={[styles.custAvatarTxt, { color: c.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.custInfo}>
                <Text style={[styles.custName, { color: c.foreground }]}>{item.name}</Text>
                <Text style={[styles.custMeta, { color: c.mutedForeground }]}>{item.phone} · {item.houseNumber}</Text>
                {item.outstandingBalance > 0 && (
                  <Text style={[styles.custOutstanding, { color: c.destructive }]}>
                    Due ₹{item.outstandingBalance.toFixed(0)}
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={18} color={c.border} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Feather name="users" size={36} color={c.border} />
              <Text style={[styles.emptyTxt, { color: c.mutedForeground }]}>No customers found</Text>
            </View>
          }
        />
      </View>
    );
  }

  // ── Step: Add Items ────────────────────────────────────────────────────────
  if (step === 'items') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: c.card, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => { customerId ? router.back() : setStep('customer'); }} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={c.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>{selectedCustomer?.name}</Text>
            <Text style={[styles.headerSub, { color: c.mutedForeground }]}>Select items for order</Text>
          </View>
          {orderItems.length > 0 && (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: c.primary }]}
              onPress={() => setStep('summary')}
            >
              <Text style={styles.nextBtnText}>Review ({orderItems.length})</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <SearchBar value={itemSearch} onChangeText={setItemSearch} placeholder="Search items..." />

        <FlatList
          data={filteredItems}
          keyExtractor={i => i.id}
          renderItem={({ item }) => {
            const inOrder = orderItems.find(o => o.itemId === item.id);
            return (
              <TouchableOpacity
                style={[styles.itemRow, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => { setQtyModalItem(item); setCustomQty('1'); }}
                activeOpacity={0.7}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: c.foreground }]}>{item.name}</Text>
                  <Text style={[styles.itemMeta, { color: c.mutedForeground }]}>
                    ₹{item.sellingPrice}/{item.unit} · Stock: {item.stock}
                  </Text>
                </View>
                {inOrder ? (
                  <View style={[styles.inOrderBadge, { backgroundColor: c.primary }]}>
                    <Text style={styles.inOrderTxt}>{inOrder.quantity} {inOrder.unit}</Text>
                  </View>
                ) : (
                  <View style={[styles.addCircle, { backgroundColor: c.secondary }]}>
                    <Feather name="plus" size={18} color={c.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Quantity Modal */}
        <Modal
          visible={!!qtyModalItem}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={() => setQtyModalItem(null)}
        >
          {qtyModalItem && (
            <View style={[styles.qtyModal, { backgroundColor: c.background }]}>
              <View style={[styles.qtyHeader, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => setQtyModalItem(null)}>
                  <Feather name="x" size={22} color={c.mutedForeground} />
                </TouchableOpacity>
                <Text style={[styles.qtyTitle, { color: c.foreground }]}>{qtyModalItem.name}</Text>
                <Text style={[styles.qtyPrice, { color: c.primary }]}>₹{qtyModalItem.sellingPrice}/{qtyModalItem.unit}</Text>
              </View>
              <ScrollView contentContainerStyle={styles.qtyBody}>
                <Text style={[styles.qtyLabel, { color: c.mutedForeground }]}>Quick Select</Text>
                <View style={styles.presetGrid}>
                  {PRESET_QTY.map(q => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.presetBtn, { backgroundColor: c.secondary, borderColor: c.border }]}
                      onPress={() => addItemToOrder(qtyModalItem, q)}
                    >
                      <Text style={[styles.presetTxt, { color: c.primary }]}>{q}</Text>
                      <Text style={[styles.presetUnit, { color: c.mutedForeground }]}>{qtyModalItem.unit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.qtyLabel, { color: c.mutedForeground }]}>Custom Quantity</Text>
                <View style={styles.customQtyRow}>
                  <TextInput
                    style={[styles.customQtyInput, { backgroundColor: c.muted, borderColor: c.border, color: c.foreground }]}
                    value={customQty}
                    onChangeText={setCustomQty}
                    keyboardType="decimal-pad"
                    placeholder="Enter quantity"
                    placeholderTextColor={c.mutedForeground}
                  />
                  <TouchableOpacity
                    style={[styles.customQtyAdd, { backgroundColor: c.primary }]}
                    onPress={() => {
                      const q = parseFloat(customQty);
                      if (q > 0) addItemToOrder(qtyModalItem, q);
                    }}
                  >
                    <Feather name="check" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </Modal>
      </View>
    );
  }

  // ── Step: Summary ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => setStep('items')} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Order Summary</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.summaryBody, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer */}
        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.summarySection, { color: c.mutedForeground }]}>CUSTOMER</Text>
          <Text style={[styles.summaryCustomer, { color: c.foreground }]}>{selectedCustomer?.name}</Text>
          <Text style={[styles.summaryMeta, { color: c.mutedForeground }]}>
            {selectedCustomer?.phone} · {selectedCustomer?.houseNumber}
          </Text>
        </View>

        {/* Items */}
        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summarySection, { color: c.mutedForeground }]}>ITEMS ({orderItems.length})</Text>
            <TouchableOpacity onPress={() => setStep('items')}>
              <Text style={[styles.editLink, { color: c.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          {orderItems.map(item => (
            <View key={item.itemId} style={styles.orderItemRow}>
              <Text style={[styles.orderItemName, { color: c.foreground }]}>{item.itemName}</Text>
              <Text style={[styles.orderItemQty, { color: c.mutedForeground }]}>
                {item.quantity} {item.unit} × ₹{item.price}
              </Text>
              <Text style={[styles.orderItemTotal, { color: c.foreground }]}>₹{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.summarySection, { color: c.mutedForeground }]}>PRICING</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Subtotal</Text>
            <Text style={[styles.priceVal, { color: c.foreground }]}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Discount</Text>
            <TextInput
              style={[styles.priceInput, { borderColor: c.border, color: c.foreground }]}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={c.mutedForeground}
            />
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Delivery Charge</Text>
            <TextInput
              style={[styles.priceInput, { borderColor: c.border, color: c.foreground }]}
              value={deliveryCharge}
              onChangeText={setDeliveryCharge}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={c.mutedForeground}
            />
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Smart Rounding</Text>
            <Switch
              value={useSmartRounding}
              onValueChange={setUseSmartRounding}
              trackColor={{ true: c.primary }}
            />
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: c.foreground }]}>Grand Total</Text>
            <Text style={[styles.totalVal, { color: c.primary }]}>₹{grandTotal.toFixed(2)}</Text>
          </View>
          {useSmartRounding && beforeRounding !== grandTotal && (
            <Text style={[styles.roundingNote, { color: c.mutedForeground }]}>
              Rounded from ₹{beforeRounding.toFixed(2)} to ₹{grandTotal.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Payment */}
        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.summarySection, { color: c.mutedForeground }]}>PAYMENT</Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.methodBtn,
                  { backgroundColor: paymentMethod === m ? c.primary : c.muted, borderColor: paymentMethod === m ? c.primary : c.border },
                ]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.methodTxt, { color: paymentMethod === m ? '#fff' : c.mutedForeground }]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Amount Paid</Text>
            <TextInput
              style={[styles.priceInput, { borderColor: c.border, color: c.foreground }]}
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="decimal-pad"
              placeholder={String(grandTotal.toFixed(2))}
              placeholderTextColor={c.mutedForeground}
            />
          </View>
          {remainingAmount > 0 && (
            <View style={[styles.priceRow, { marginTop: 8 }]}>
              <Text style={[styles.priceLabel, { color: c.destructive }]}>Remaining</Text>
              <Text style={[styles.priceVal, { color: c.destructive, fontFamily: 'Inter_700Bold' }]}>
                ₹{remainingAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <TextInput
          style={[styles.notesInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Order notes (optional)..."
          placeholderTextColor={c.mutedForeground}
          multiline
        />
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.placeOrderBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, { backgroundColor: c.primary, opacity: orderItems.length === 0 ? 0.5 : 1 }]}
          onPress={handlePlaceOrder}
          disabled={orderItems.length === 0}
        >
          <Feather name="check-circle" size={20} color="#fff" />
          <Text style={styles.placeOrderTxt}>Place Order · ₹{grandTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', flex: 1 },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  nextBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  custRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1 },
  custAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  custAvatarTxt: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  custInfo: { flex: 1 },
  custName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  custMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  custOutstanding: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  itemMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  inOrderBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  inOrderTxt: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  addCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qtyModal: { flex: 1 },
  qtyHeader: { padding: 20, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', flex: 1, marginLeft: 12 },
  qtyPrice: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  qtyBody: { padding: 16, gap: 12 },
  qtyLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetBtn: { width: 70, height: 56, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  presetTxt: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  presetUnit: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  customQtyRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  customQtyInput: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  customQtyAdd: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12 },
  summaryBody: { padding: 16, gap: 12 },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  summarySection: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryCustomer: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  summaryMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  editLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderItemName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  orderItemQty: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  orderItemTotal: { fontSize: 14, fontFamily: 'Inter_600SemiBold', minWidth: 60, textAlign: 'right' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  priceVal: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  priceInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 15, fontFamily: 'Inter_600SemiBold', minWidth: 80, textAlign: 'right' },
  totalRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  totalVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  roundingNote: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  methodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  methodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  methodTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  notesInput: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 70 },
  placeOrderBar: { borderTopWidth: 1, padding: 16 },
  placeOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
  placeOrderTxt: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyTxt: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
