import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  color: string;
  onPress: () => void;
  badge?: string;
}

function MenuItem({ icon, label, subtitle, color, onPress, badge }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: color + '18' }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.menuBody}>
        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle && <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={18} color={colors.border} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, items, settings, getLowStockItems } = useData();

  const lowStock = getLowStockItems().length;
  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const monthlyExpenses = expenses
    .filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>More</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FINANCE</Text>
        <MenuItem
          icon="file-text"
          label="Expenses"
          subtitle={`₹${monthlyExpenses.toFixed(0)} this month`}
          color={colors.destructive}
          onPress={() => router.push('/expenses')}
        />
        <MenuItem
          icon="bar-chart-2"
          label="Analytics"
          subtitle="Sales, profit & charts"
          color={colors.purple}
          onPress={() => router.push('/analytics')}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>INVENTORY</Text>
        <MenuItem
          icon="alert-triangle"
          label="Low Stock Alerts"
          subtitle={lowStock > 0 ? `${lowStock} items need attention` : 'All stock levels OK'}
          color={lowStock > 0 ? colors.destructive : colors.success}
          badge={lowStock > 0 ? String(lowStock) : undefined}
          onPress={() => router.push('/(tabs)/inventory')}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APP</Text>
        <MenuItem
          icon="settings"
          label="Settings"
          subtitle="Business info, preferences"
          color={colors.primary}
          onPress={() => router.push('/settings')}
        />
      </View>

      <View style={[styles.appInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.appName, { color: colors.primary }]}>FreshFlow</Text>
        <Text style={[styles.appVersion, { color: colors.mutedForeground }]}>
          Offline Order Management · v1.0
        </Text>
        <Text style={[styles.appBiz, { color: colors.foreground }]}>{settings.businessName}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  section: { paddingTop: 20, paddingHorizontal: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuBody: { flex: 1 },
  menuLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  menuSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, color: '#fff', fontFamily: 'Inter_700Bold' },
  appInfo: {
    margin: 16, marginTop: 24, padding: 20,
    borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 4,
  },
  appName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  appVersion: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  appBiz: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 4 },
});
