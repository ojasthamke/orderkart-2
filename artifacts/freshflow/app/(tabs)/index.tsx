import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, StatCard } from '@/components/UI';
import { OrderCard } from '@/components/Cards';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { formatCurrency } from '@/types';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, customers, items, expenses, settings } = useData();

  const today = new Date().toDateString();

  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const todaySales = todayOrders.reduce((s, o) => s + o.grandTotal, 0);
    const pendingPayments = orders.reduce((s, o) => s + o.remainingAmount, 0);
    const monthOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlySales = monthOrders.reduce((s, o) => s + o.grandTotal, 0);
    const cashReceived = orders.reduce((s, o) => s + (o.paymentMethod === 'cash' ? o.paidAmount : 0), 0);
    const onlineReceived = orders.reduce((s, o) => s + (o.paymentMethod !== 'cash' ? o.paidAmount : 0), 0);
    const totalExpenses = expenses
      .filter(e => {
        const d = new Date(e.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
    const lowStock = items.filter(i => i.stock <= i.minStock).length;
    const pendingOrders = orders.filter(o => o.deliveryStatus === 'pending').length;
    return { todaySales, monthlySales, pendingPayments, cashReceived, onlineReceived, totalExpenses, lowStock, pendingOrders };
  }, [orders, items, expenses]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [orders],
  );

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
          <Text style={[styles.bizName, { color: colors.foreground }]}>{settings.businessName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.push('/settings')}
        >
          <Feather name="settings" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Today Card */}
      <View style={[styles.todayCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.todayLabel}>Today's Sales</Text>
        <Text style={styles.todayAmount}>{formatCurrency(stats.todaySales)}</Text>
        <Text style={styles.todaySub}>
          {orders.filter(o => new Date(o.createdAt).toDateString() === today).length} orders today
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            label="Monthly Sales"
            value={formatCurrency(stats.monthlySales)}
            icon="trending-up"
            color={colors.success}
            onPress={() => router.push('/analytics')}
          />
          <StatCard
            label="Pending Due"
            value={formatCurrency(stats.pendingPayments)}
            icon="alert-circle"
            color={colors.destructive}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Cash Received"
            value={formatCurrency(stats.cashReceived)}
            icon="dollar-sign"
            color={colors.primary}
          />
          <StatCard
            label="Online Received"
            value={formatCurrency(stats.onlineReceived)}
            icon="smartphone"
            color={colors.purple}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Monthly Expenses"
            value={formatCurrency(stats.totalExpenses)}
            icon="credit-card"
            color={colors.orange}
            onPress={() => router.push('/expenses')}
          />
          <StatCard
            label="Customers"
            value={String(customers.length)}
            icon="users"
            color={colors.blue}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Pending Orders"
            value={String(stats.pendingOrders)}
            icon="clock"
            color={colors.warning}
            onPress={() => router.push('/(tabs)/orders')}
          />
          <StatCard
            label="Low Stock"
            value={String(stats.lowStock)}
            icon="alert-triangle"
            color={stats.lowStock > 0 ? colors.destructive : colors.success}
            onPress={() => router.push('/(tabs)/inventory')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/areas')}
        >
          <Feather name="map" size={22} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.foreground }]}>Locations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Feather name="shopping-cart" size={22} color={colors.success} />
          <Text style={[styles.quickActionText, { color: colors.foreground }]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/inventory')}
        >
          <Feather name="package" size={22} color={colors.orange} />
          <Text style={[styles.quickActionText, { color: colors.foreground }]}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/analytics')}
        >
          <Feather name="bar-chart-2" size={22} color={colors.purple} />
          <Text style={[styles.quickActionText, { color: colors.foreground }]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <>
          <SectionHeader
            title="Recent Orders"
            count={recentOrders.length}
            action={{ label: 'See All', onPress: () => router.push('/(tabs)/orders') }}
          />
          {recentOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1,
  },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  bizName: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  todayCard: {
    margin: 16, borderRadius: 18, padding: 22,
    shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  todayLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_500Medium' },
  todayAmount: { fontSize: 36, color: '#fff', fontFamily: 'Inter_700Bold', marginTop: 4 },
  todaySub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
  statsGrid: { paddingHorizontal: 16, gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  quickActions: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8,
  },
  quickAction: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 8,
  },
  quickActionText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
