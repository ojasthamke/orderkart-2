import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderCard } from '@/components/Cards';
import { EmptyState, FAB, SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { Order } from '@/types';

type Filter = 'all' | 'pending' | 'delivered' | 'today' | 'week';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
];

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, updateDeliveryStatus } = useData();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return orders
      .filter(o => {
        if (search) {
          const q = search.toLowerCase();
          return (
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.includes(q) ||
            o.customerAddress.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .filter(o => {
        if (filter === 'pending') return o.deliveryStatus === 'pending';
        if (filter === 'delivered') return o.deliveryStatus === 'delivered';
        if (filter === 'today') return new Date(o.createdAt).toDateString() === todayStr;
        if (filter === 'week') return new Date(o.createdAt) >= weekAgo;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, search, filter]);

  const pendingCount = orders.filter(o => o.deliveryStatus === 'pending').length;
  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Orders</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {orders.length} total · {pendingCount} pending
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.muted,
                  borderColor: filter === f.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search orders..." />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.id } })}
            onDeliveryToggle={() => {
              updateDeliveryStatus(item.id, 'delivered');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title={search ? 'No orders found' : 'No orders yet'}
            subtitle={search ? 'Try a different search term' : 'Create your first order from a customer profile'}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => router.push('/orders/create')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 0, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  filterScroll: { marginTop: 12 },
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  list: { paddingTop: 8, flexGrow: 1 },
});
