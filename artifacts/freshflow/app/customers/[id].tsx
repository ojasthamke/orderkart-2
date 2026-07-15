import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderCard } from '@/components/Cards';
import { Badge } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { formatCurrency, formatDate } from '@/types';

export default function CustomerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, deleteCustomer, getOrdersForCustomer, getLocationPath } = useData();

  const customer = customers.find(c => c.id === id);
  const orders = useMemo(() => (id ? getOrdersForCustomer(id) : []), [id, getOrdersForCustomer]);

  if (!customer) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Customer not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  function handleWhatsApp(phone: string) {
    const num = phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=91${num}`);
  }

  function handleDelete() {
    if (!customer) return;
    Alert.alert(
      'Delete Customer',
      `Delete "${customer.name}" and all their orders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCustomer(customer.id);
            router.back();
          },
        },
      ],
    );
  }

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() =>
              router.push({
                pathname: '/customers/create',
                params: { editId: customer.id },
              })
            }
          >
            <Feather name="edit-2" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {customer.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{customer.name}</Text>
        <Text style={[styles.address, { color: colors.mutedForeground }]}>
          {customer.houseNumber ? `${customer.houseNumber}, ` : ''}{customer.address}
        </Text>
        <Text style={[styles.location, { color: colors.mutedForeground }]}>
          {getLocationPath(customer.locationId)}
        </Text>
        {customer.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]}>{customer.notes}</Text>
        ) : null}
        <Text style={[styles.since, { color: colors.mutedForeground }]}>
          Customer since {formatDate(customer.customerSince)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => handleCall(customer.phone)}
        >
          <Feather name="phone" size={20} color={colors.success} />
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Call</Text>
        </TouchableOpacity>
        {customer.whatsapp || customer.phone ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleWhatsApp(customer.whatsapp || customer.phone)}
          >
            <Feather name="message-circle" size={20} color="#25D366" />
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
        {customer.phone2 ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleCall(customer.phone2)}
          >
            <Feather name="phone-call" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>Phone 2</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/orders/create', params: { customerId: customer.id } })}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={[styles.actionLabel, { color: '#fff' }]}>Order</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.primary }]}>{formatCurrency(customer.outstandingBalance)}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Outstanding</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.success }]}>{formatCurrency(customer.totalPaid)}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Total Paid</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.foreground }]}>{customer.totalOrders}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Orders</Text>
        </View>
      </View>

      {/* Order History */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order History</Text>
        {orders.length === 0 ? (
          <View style={[styles.emptyOrders, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shopping-bag" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No orders yet</Text>
          </View>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 8 },
  profileCard: {
    margin: 16, padding: 20, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', gap: 6,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  avatarText: { fontSize: 30, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  address: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  location: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  notes: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'center' },
  since: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1, minWidth: 70, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6,
  },
  actionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  statBox: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4,
  },
  statVal: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLbl: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  section: { padding: 16, gap: 0 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  emptyOrders: {
    alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 14,
    borderWidth: 1, gap: 10,
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
