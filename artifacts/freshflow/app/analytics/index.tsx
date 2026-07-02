import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { Item } from '@/types';

type Period = 'week' | 'month' | 'year';

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const colors = useColors();
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.barGroup}>
          <Text style={[chartStyles.barValue, { color: colors.mutedForeground }]}>
            {d.value > 999 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toFixed(0)}
          </Text>
          <View style={chartStyles.barTrack}>
            <View
              style={[
                chartStyles.bar,
                { height: Math.max(4, (d.value / maxVal) * 100), backgroundColor: color },
              ]}
            />
          </View>
          <Text style={[chartStyles.barLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140, paddingTop: 24 },
  barGroup: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  barTrack: { flex: 1, width: '80%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
});

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, expenses, customers, items } = useData();
  const [period, setPeriod] = useState<Period>('month');

  const stats = useMemo(() => {
    const now = new Date();

    const filtered = orders.filter(o => {
      const d = new Date(o.createdAt);
      if (period === 'week') return now.getTime() - d.getTime() <= 7 * 86400000;
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });

    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      if (period === 'week') return now.getTime() - d.getTime() <= 7 * 86400000;
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });

    const totalSales = filtered.reduce((s, o) => s + o.grandTotal, 0);
    const totalCollected = filtered.reduce((s, o) => s + o.paidAmount, 0);
    const totalPending = filtered.reduce((s, o) => s + o.remainingAmount, 0);
    const totalExpensesAmt = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const totalCost = filtered.reduce((s, o) => {
      return s + o.items.reduce((is, i) => {
        const item = items.find(it => it.id === i.itemId);
        return is + (item ? item.costPrice * i.quantity : 0);
      }, 0);
    }, 0);
    const profit = totalCollected - totalCost - totalExpensesAmt;
    const orderCount = filtered.length;

    // Top selling items
    const itemSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach(o => {
      o.items.forEach(i => {
        if (!itemSales[i.itemId]) itemSales[i.itemId] = { name: i.itemName, qty: 0, revenue: 0 };
        itemSales[i.itemId].qty += i.quantity;
        itemSales[i.itemId].revenue += i.total;
      });
    });
    const topItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Chart data
    let chartData: { label: string; value: number }[] = [];
    if (period === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      chartData = days.map((label, i) => ({
        label,
        value: filtered.filter(o => new Date(o.createdAt).getDay() === i).reduce((s, o) => s + o.grandTotal, 0),
      }));
    } else if (period === 'month') {
      const weeks = ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5'];
      chartData = weeks.map((label, i) => ({
        label,
        value: filtered
          .filter(o => {
            const day = new Date(o.createdAt).getDate();
            return Math.floor((day - 1) / 7) === i;
          })
          .reduce((s, o) => s + o.grandTotal, 0),
      }));
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chartData = months.map((label, i) => ({
        label,
        value: filtered.filter(o => new Date(o.createdAt).getMonth() === i).reduce((s, o) => s + o.grandTotal, 0),
      }));
    }

    return { totalSales, totalCollected, totalPending, totalExpensesAmt, profit, orderCount, topItems, chartData };
  }, [orders, expenses, items, period]);

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const c = colors;

  function StatBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
    return (
      <View style={[styles.statBox, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
          <Feather name={icon as any} size={18} color={color} />
        </View>
        <Text style={[styles.statVal, { color: c.foreground }]}>{value}</Text>
        <Text style={[styles.statLbl, { color: c.mutedForeground }]}>{label}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.foreground }]}>Analytics</Text>
      </View>

      {/* Period Selector */}
      <View style={[styles.periodRow, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        {(['week', 'month', 'year'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, { backgroundColor: period === p ? c.primary : 'transparent' }]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodTxt, { color: period === p ? '#fff' : c.mutedForeground }]}>
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatBox label="Total Sales" value={`₹${stats.totalSales.toFixed(0)}`} color={c.primary} icon="trending-up" />
        <StatBox label="Collected" value={`₹${stats.totalCollected.toFixed(0)}`} color={c.success} icon="check-circle" />
        <StatBox label="Pending Due" value={`₹${stats.totalPending.toFixed(0)}`} color={c.destructive} icon="alert-circle" />
        <StatBox label="Expenses" value={`₹${stats.totalExpensesAmt.toFixed(0)}`} color={c.orange} icon="credit-card" />
        <StatBox label="Profit" value={`₹${stats.profit.toFixed(0)}`} color={stats.profit >= 0 ? c.success : c.destructive} icon="dollar-sign" />
        <StatBox label="Orders" value={String(stats.orderCount)} color={c.purple} icon="shopping-cart" />
      </View>

      {/* Sales Chart */}
      <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.chartTitle, { color: c.foreground }]}>Sales Chart</Text>
        <BarChart data={stats.chartData} color={c.primary} />
      </View>

      {/* Top Items */}
      {stats.topItems.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.chartTitle, { color: c.foreground }]}>Top Selling Items</Text>
          {stats.topItems.map((item, i) => {
            const maxRev = stats.topItems[0]?.revenue || 1;
            return (
              <View key={i} style={styles.topItemRow}>
                <Text style={[styles.topItemRank, { color: c.mutedForeground }]}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topItemName, { color: c.foreground }]}>{item.name}</Text>
                  <View style={styles.topItemBar}>
                    <View
                      style={[styles.topItemBarFill, { width: `${(item.revenue / maxRev) * 100}%`, backgroundColor: c.primary }]}
                    />
                  </View>
                </View>
                <Text style={[styles.topItemRev, { color: c.primary }]}>₹{item.revenue.toFixed(0)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Low Stock */}
      {items.filter(i => i.stock <= i.minStock).length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.chartTitle, { color: c.destructive }]}>Low Stock Alert</Text>
          {items.filter(i => i.stock <= i.minStock).map(item => (
            <View key={item.id} style={styles.lowStockRow}>
              <Text style={[styles.lowStockName, { color: c.foreground }]}>{item.name}</Text>
              <Text style={[styles.lowStockVal, { color: c.destructive }]}>
                {item.stock} {item.unit} (min {item.minStock})
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Summary */}
      <View style={[styles.summaryCard, { backgroundColor: c.primary + '12', borderColor: c.primary + '30' }]}>
        <Text style={[styles.summaryTitle, { color: c.primary }]}>Business Summary</Text>
        <Text style={[styles.summaryLine, { color: c.foreground }]}>
          Total Customers: <Text style={{ fontFamily: 'Inter_700Bold' }}>{customers.length}</Text>
        </Text>
        <Text style={[styles.summaryLine, { color: c.foreground }]}>
          Total Orders (all time): <Text style={{ fontFamily: 'Inter_700Bold' }}>{orders.length}</Text>
        </Text>
        <Text style={[styles.summaryLine, { color: c.foreground }]}>
          Total Items in Inventory: <Text style={{ fontFamily: 'Inter_700Bold' }}>{items.length}</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  periodRow: {
    flexDirection: 'row', padding: 8, gap: 8,
    borderBottomWidth: 1, paddingHorizontal: 16,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  periodTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statBox: {
    width: '47%', padding: 14, borderRadius: 14, borderWidth: 1, gap: 6, alignItems: 'flex-start',
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLbl: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  chartCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  chartTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  topItemRank: { fontSize: 13, fontFamily: 'Inter_600SemiBold', width: 24 },
  topItemName: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  topItemBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  topItemBarFill: { height: '100%', borderRadius: 3 },
  topItemRev: { fontSize: 13, fontFamily: 'Inter_700Bold', minWidth: 60, textAlign: 'right' },
  lowStockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  lowStockName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  lowStockVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  summaryCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  summaryTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  summaryLine: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
