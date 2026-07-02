import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomerCard } from '@/components/Cards';
import { EmptyState, FAB, SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

export default function StreetDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, streets } = useData();

  const [search, setSearch] = useState('');

  const street = streets.find(s => s.id === id);
  const streetName = street?.name || name || 'Street';

  const streetCustomers = useMemo(
    () =>
      customers
        .filter(c => c.streetId === id && (
          search
            ? c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.phone.includes(search) ||
              c.houseNumber.toLowerCase().includes(search.toLowerCase())
            : true
        ))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [customers, id, search],
  );

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: colors.foreground }]}>{streetName}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {streetCustomers.length} customer{streetCustomers.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search customers..." />

      <FlatList
        data={streetCustomers}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={() => router.push({ pathname: '/customers/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={search ? 'No customers found' : 'No customers yet'}
            subtitle={`Add customers living on ${streetName}`}
            action={
              !search
                ? {
                    label: 'Add Customer',
                    onPress: () =>
                      router.push({
                        pathname: '/customers/create',
                        params: { streetId: id, streetName, areaId: street?.areaId, areaName: street?.areaName },
                      }),
                  }
                : undefined
            }
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        onPress={() =>
          router.push({
            pathname: '/customers/create',
            params: { streetId: id, streetName, areaId: street?.areaId, areaName: street?.areaName },
          })
        }
      />
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
  headerTitle: { flex: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  list: { paddingTop: 8, flexGrow: 1 },
});
