import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Customer, Expense, formatCurrency, formatDate, formatTime, Item, LocationType, Order } from '@/types';
import { useData } from '@/context/DataContext';

// ─── CustomerCard ─────────────────────────────────────────────────────────────
interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
}

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const colors = useColors();
  const { getLocationPath } = useData();
  const locationPath = getLocationPath(customer.locationId);
  const hasOutstanding = customer.outstandingBalance > 0;
  
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {customer.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {customer.name}
          </Text>
          {hasOutstanding && (
            <Text style={[styles.outstandingText, { color: colors.destructive }]}>
              {formatCurrency(customer.outstandingBalance)}
            </Text>
          )}
        </View>
        <View style={styles.cardMeta}>
          <Feather name="home" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {customer.houseNumber ? `${customer.houseNumber}, ` : ''}{locationPath || customer.address}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Feather name="phone" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{customer.phone}</Text>
          {customer.totalOrders > 0 && (
            <>
              <Text style={{ color: colors.border }}> · </Text>
              <Feather name="shopping-bag" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {customer.totalOrders} orders
              </Text>
            </>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.border} />
    </TouchableOpacity>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onDeliveryToggle?: () => void;
}

export function OrderCard({ order, onPress, onDeliveryToggle }: OrderCardProps) {
  const colors = useColors();

  const statusColor =
    order.deliveryStatus === 'delivered' ? colors.success :
    order.deliveryStatus === 'cancelled' ? colors.destructive :
    colors.warning;

  const statusLabel =
    order.deliveryStatus === 'delivered' ? 'Delivered' :
    order.deliveryStatus === 'cancelled' ? 'Cancelled' :
    'Pending';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.orderLeft}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {order.customerName}
          </Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {formatCurrency(order.grandTotal)}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {order.customerAddress}
          </Text>
        </View>
        <View style={[styles.cardMeta, { marginTop: 6 }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.metaText, { color: statusColor, fontFamily: 'Inter_600SemiBold' }]}>
            {statusLabel}
          </Text>
          {order.remainingAmount > 0 && (
            <>
              <Text style={{ color: colors.border }}> · </Text>
              <Feather name="alert-circle" size={12} color={colors.destructive} />
              <Text style={[styles.metaText, { color: colors.destructive }]}>
                Due {formatCurrency(order.remainingAmount)}
              </Text>
            </>
          )}
          <Text style={{ color: colors.border }}> · </Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
      </View>
      {onDeliveryToggle && order.deliveryStatus === 'pending' && (
        <TouchableOpacity
          style={[styles.deliverBtn, { backgroundColor: colors.success + '18', borderColor: colors.success }]}
          onPress={onDeliveryToggle}
        >
          <Feather name="check" size={16} color={colors.success} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── ItemCard ─────────────────────────────────────────────────────────────────
interface ItemCardProps {
  item: Item;
  onPress: () => void;
  showAddToOrder?: boolean;
  onAddToOrder?: () => void;
}

export function ItemCard({ item, onPress, showAddToOrder, onAddToOrder }: ItemCardProps) {
  const colors = useColors();
  const isLowStock = item.stock <= item.minStock;

  const categoryColor =
    item.category === 'Vegetables' ? colors.green :
    item.category === 'Fruits' ? colors.orange :
    item.category === 'Medicines' ? colors.purple :
    colors.blue;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.itemCatDot, { backgroundColor: categoryColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            ₹{item.sellingPrice}/{item.unit}
          </Text>
        </View>
        <View style={[styles.cardMeta, { marginTop: 4 }]}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.category}</Text>
          <Text style={{ color: colors.border }}> · </Text>
          <Text
            style={[
              styles.metaText,
              { color: isLowStock ? colors.destructive : colors.mutedForeground,
                fontFamily: isLowStock ? 'Inter_600SemiBold' : 'Inter_400Regular' },
            ]}
          >
            Stock: {item.stock} {item.unit}
          </Text>
          {isLowStock && (
            <>
              <Text style={{ color: colors.border }}> · </Text>
              <Feather name="alert-triangle" size={12} color={colors.destructive} />
              <Text style={[styles.metaText, { color: colors.destructive }]}>Low</Text>
            </>
          )}
        </View>
      </View>
      {showAddToOrder && (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={onAddToOrder}
        >
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── ExpenseCard ──────────────────────────────────────────────────────────────
interface ExpenseCardProps {
  expense: Expense;
  onPress: () => void;
}

export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.expenseIcon, { backgroundColor: colors.destructive + '18' }]}>
        <Feather name="credit-card" size={20} color={colors.destructive} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {expense.name}
          </Text>
          <Text style={[styles.amount, { color: colors.destructive }]}>
            {formatCurrency(expense.amount)}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{expense.category}</Text>
          <Text style={{ color: colors.border }}> · </Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {formatDate(expense.date)}
          </Text>
          <Text style={{ color: colors.border }}> · </Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground, textTransform: 'capitalize' }]}>
            {expense.paymentMethod}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── LocationCard ──────────────────────────────────────────────────────────────
interface LocationCardProps {
  name: string;
  type: LocationType;
  childCount: number;
  customerCount: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LocationCard({ name, type, childCount, customerCount, onPress, onEdit, onDelete }: LocationCardProps) {
  const colors = useColors();

  const getIconName = () => {
    switch (type) {
      case 'Area':
        return 'map';
      case 'Building':
        return 'home';
      case 'Landmark':
        return 'flag';
      case 'Road':
      case 'Street':
      case 'Galli':
        return 'git-branch';
      default:
        return 'map-pin';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.areaIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={getIconName()} size={20} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]}>{name}</Text>
          <View style={{ backgroundColor: colors.border + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: 'Inter_500Medium' }}>
              {type}
            </Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {childCount} sub-locations · {customerCount} customers
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
        <Feather name="edit-2" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
        <Feather name="trash-2" size={16} color={colors.destructive} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16,
    marginBottom: 10, borderRadius: 14, borderWidth: 1, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  cardBody: { flex: 1, gap: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  outstandingText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  amount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  orderLeft: { flex: 1 },
  deliverBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  itemCatDot: { width: 4, height: 40, borderRadius: 2 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  expenseIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  areaIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtn: { padding: 6 },
});
