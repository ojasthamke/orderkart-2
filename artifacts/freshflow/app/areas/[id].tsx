import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, FAB, FormField, ModalHeader, PrimaryButton, SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { Street } from '@/types';

export default function AreaDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { streets, customers, addStreet, editStreet, deleteStreet, areas } = useData();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [streetName, setStreetName] = useState('');

  const area = areas.find(a => a.id === id);
  const areaName = area?.name || name || 'Area';

  const areaStreets = useMemo(
    () =>
      streets
        .filter(s => s.areaId === id && s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [streets, id, search],
  );

  function openAdd() {
    setEditingId(null);
    setStreetName('');
    setModalVisible(true);
  }

  function openEdit(street: Street) {
    setEditingId(street.id);
    setStreetName(street.name);
    setModalVisible(true);
  }

  function handleSave() {
    if (!streetName.trim()) return;
    if (editingId) {
      editStreet(editingId, streetName.trim());
    } else {
      addStreet(id!, areaName, streetName.trim());
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  function handleDelete(street: Street) {
    Alert.alert('Delete Street', `Delete "${street.name}" and all its customers?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteStreet(street.id),
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
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: colors.foreground }]}>{areaName}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {areaStreets.length} streets · {customers.filter(c => c.areaId === id).length} customers
          </Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search streets..." />

      <FlatList
        data={areaStreets}
        keyExtractor={s => s.id}
        renderItem={({ item }) => {
          const custCount = customers.filter(c => c.streetId === item.id).length;
          return (
            <TouchableOpacity
              style={[styles.streetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push({ pathname: '/streets/[id]', params: { id: item.id, name: item.name } })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.streetIcon, { backgroundColor: colors.accent }]}>
                <Feather name="git-branch" size={18} color={colors.accentForeground} />
              </View>
              <View style={styles.streetBody}>
                <Text style={[styles.streetName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.streetMeta, { color: colors.mutedForeground }]}>
                  {custCount} customer{custCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                <Feather name="edit-2" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
              <Feather name="chevron-right" size={18} color={colors.border} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="git-branch"
            title={search ? 'No streets found' : 'No streets yet'}
            subtitle={`Add streets in ${areaName} to organise customers`}
            action={!search ? { label: 'Add Street', onPress: openAdd } : undefined}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={openAdd} />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <ModalHeader
            title={editingId ? 'Edit Street' : 'New Street'}
            onClose={() => setModalVisible(false)}
            rightAction={{ label: 'Save', onPress: handleSave }}
          />
          <KeyboardAwareScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FormField label="Street Name" value={streetName} onChangeText={setStreetName} placeholder="e.g. MG Road, Lane 4" required />
            <PrimaryButton label={editingId ? 'Save Changes' : 'Add Street'} onPress={handleSave} disabled={!streetName.trim()} />
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
  headerTitle: { flex: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  list: { paddingTop: 8, flexGrow: 1 },
  streetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1,
  },
  streetIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  streetBody: { flex: 1 },
  streetName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  streetMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  actionBtn: { padding: 6 },
  modal: { flex: 1 },
  modalBody: { padding: 16, gap: 16 },
});
