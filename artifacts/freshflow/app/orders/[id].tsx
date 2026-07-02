import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { formatCurrency, formatDate, formatTime, PaymentMethod, PAYMENT_METHODS } from '@/types';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, updateDeliveryStatus, addPayment, deleteOrder, editOrder } = useData();

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');

  const order = useMemo(() => orders.find(o => o.id === id), [orders, id]);

  if (!order) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundTxt, { color: colors.mutedForeground }]}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor =
    order.deliveryStatus === 'delivered' ? colors.success :
    order.deliveryStatus === 'cancelled' ? colors.destructive :
    colors.warning;

  const statusLabel =
    order.deliveryStatus === 'delivered' ? 'Delivered' :
    order.deliveryStatus === 'cancelled' ? 'Cancelled' :
    'Pending';

  function handlePayment() {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    addPayment(order!.id, amount, payMethod);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPayModalVisible(false);
    setPayAmount('');
  }

  function handleDelete() {
    Alert.alert('Delete Order', 'Delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteOrder(order!.id);
          router.back();
        },
      },
    ]);
  }

  function toggleDelivery() {
    if (order!.deliveryStatus === 'pending') {
      updateDeliveryStatus(order!.id, 'delivered');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (order!.deliveryStatus === 'delivered') {
      updateDeliveryStatus(order!.id, 'pending');
    }
  }

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const c = colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Order Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={20} color={c.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Customer */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <Text style={[styles.orderDate, { color: c.mutedForeground }]}>
              {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
            </Text>
          </View>
          <Text style={[styles.customerName, { color: c.foreground }]}>{order.customerName}</Text>
          <View style={styles.infoRow}>
            <Feather name="phone" size={14} color={c.mutedForeground} />
            <Text style={[styles.infoTxt, { color: c.mutedForeground }]}>{order.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={14} color={c.mutedForeground} />
            <Text style={[styles.infoTxt, { color: c.mutedForeground }]}>{order.customerAddress}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardSection, { color: c.mutedForeground }]}>ORDER ITEMS</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, { borderBottomColor: c.border }]}>
              <Text style={[styles.itemName, { color: c.foreground }]}>{item.itemName}</Text>
              <Text style={[styles.itemQty, { color: c.mutedForeground }]}>
                {item.quantity} {item.unit} × ₹{item.price}
              </Text>
              <Text style={[styles.itemTotal, { color: c.foreground }]}>₹{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Bill */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardSection, { color: c.mutedForeground }]}>BILL</Text>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: c.mutedForeground }]}>Subtotal</Text>
            <Text style={[styles.billVal, { color: c.foreground }]}>₹{order.subtotal.toFixed(2)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: c.mutedForeground }]}>Discount</Text>
              <Text style={[styles.billVal, { color: c.success }]}>-₹{order.discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: c.mutedForeground }]}>Delivery Charge</Text>
            <Text style={[styles.billVal, { color: c.foreground }]}>₹{order.deliveryCharge.toFixed(2)}</Text>
          </View>
          <View style={[styles.billRow, styles.totalRow, { borderTopColor: c.border }]}>
            <Text style={[styles.totalLabel, { color: c.foreground }]}>Grand Total</Text>
            <Text style={[styles.totalVal, { color: c.primary }]}>₹{order.grandTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: c.mutedForeground }]}>
              Paid ({order.paymentMethod})
            </Text>
            <Text style={[styles.billVal, { color: c.success }]}>₹{order.paidAmount.toFixed(2)}</Text>
          </View>
          {order.remainingAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: c.destructive }]}>Remaining</Text>
              <Text style={[styles.billVal, { color: c.destructive, fontFamily: 'Inter_700Bold' }]}>
                ₹{order.remainingAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {order.notes ? (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardSection, { color: c.mutedForeground }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: c.foreground }]}>{order.notes}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: statusColor + '18', borderColor: statusColor }]}
            onPress={toggleDelivery}
          >
            <Feather
              name={order.deliveryStatus === 'delivered' ? 'rotate-ccw' : 'check-circle'}
              size={18}
              color={statusColor}
            />
            <Text style={[styles.actionTxt, { color: statusColor }]}>
              {order.deliveryStatus === 'delivered' ? 'Mark Pending' : 'Mark Delivered'}
            </Text>
          </TouchableOpacity>

          {order.remainingAmount > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.success + '18', borderColor: c.success }]}
              onPress={() => {
                setPayAmount(String(order.remainingAmount.toFixed(2)));
                setPayModalVisible(true);
              }}
            >
              <Feather name="dollar-sign" size={18} color={c.success} />
              <Text style={[styles.actionTxt, { color: c.success }]}>Add Payment</Text>
            </TouchableOpacity>
          )}

          {order.deliveryStatus !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.destructive + '18', borderColor: c.destructive }]}
              onPress={() => {
                Alert.alert('Cancel Order', 'Mark this order as cancelled?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', onPress: () => updateDeliveryStatus(order.id, 'cancelled') },
                ]);
              }}
            >
              <Feather name="x-circle" size={18} color={c.destructive} />
              <Text style={[styles.actionTxt, { color: c.destructive }]}>Cancel Order</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.muted, borderColor: c.border }]}
            onPress={() => router.push({ pathname: '/customers/[id]', params: { id: order.customerId } })}
          >
            <Feather name="user" size={18} color={c.foreground} />
            <Text style={[styles.actionTxt, { color: c.foreground }]}>View Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={payModalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setPayModalVisible(false)}>
        <View style={[styles.payModal, { backgroundColor: c.background }]}>
          <View style={[styles.payHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => setPayModalVisible(false)}>
              <Feather name="x" size={22} color={c.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.payTitle, { color: c.foreground }]}>Add Payment</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView contentContainerStyle={styles.payBody}>
            <Text style={[styles.payRemaining, { color: c.destructive }]}>
              Remaining: ₹{order.remainingAmount.toFixed(2)}
            </Text>
            <TextInput
              style={[styles.payInput, { borderColor: c.border, color: c.foreground, backgroundColor: c.muted }]}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="decimal-pad"
              placeholder="Amount"
              placeholderTextColor={c.mutedForeground}
              autoFocus
            />
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, { backgroundColor: payMethod === m ? c.primary : c.muted, borderColor: payMethod === m ? c.primary : c.border }]}
                  onPress={() => setPayMethod(m)}
                >
                  <Text style={[styles.methodTxt, { color: payMethod === m ? '#fff' : c.mutedForeground }]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.confirmPayBtn, { backgroundColor: c.success }]}
              onPress={handlePayment}
            >
              <Feather name="check" size={20} color="#fff" />
              <Text style={styles.confirmPayTxt}>Confirm Payment</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTxt: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', flex: 1 },
  deleteBtn: { padding: 8 },
  body: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  cardSection: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  orderDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  customerName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTxt: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  itemName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  itemQty: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  itemTotal: { fontSize: 14, fontFamily: 'Inter_600SemiBold', minWidth: 70, textAlign: 'right' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  billVal: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  totalRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  totalVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  notesText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  actionTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  payModal: { flex: 1 },
  payHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  payTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  payBody: { padding: 20, gap: 16 },
  payRemaining: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  payInput: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  methodRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  methodBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  methodTxt: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  confirmPayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  confirmPayTxt: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
});
