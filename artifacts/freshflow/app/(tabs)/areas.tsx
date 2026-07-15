import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AreaCard } from '@/components/Cards';
import { EmptyState, FAB, FormField, ModalHeader, PrimaryButton, SearchBar, SectionHeader } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

export default function AreasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { areas, streets, customers, addArea, editArea, deleteArea } = useData();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState('');
  const [isSub, setIsSub] = useState(false);

  const filtered = useMemo(
    () =>
      areas
        .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
          if (a.isSub && !b.isSub) return -1;
          if (!a.isSub && b.isSub) return 1;
          return a.name.localeCompare(b.name);
        }),
    [areas, search],
  );

  function openAdd() {
    setEditingId(null);
    setAreaName('');
    setIsSub(false);
    setModalVisible(true);
  }

  function openEdit(id: string, name: string) {
    setEditingId(id);
    setAreaName(name);
    const area = areas.find(a => a.id === id);
    setIsSub(area?.isSub || false);
    setModalVisible(true);
  }

  function handleSave() {
    if (!areaName.trim()) return;
    if (editingId) {
      editArea(editingId, areaName.trim(), isSub);
    } else {
      addArea(areaName.trim(), isSub);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert(
      'Delete Area',
      `Delete "${name}" and all its streets and customers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteArea(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ],
    );
  }

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPt + 16, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Areas</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {areas.length} areas · Manage delivery zones
        </Text>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search areas..." />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AreaCard
            name={item.name}
            isSub={item.isSub}
            streetCount={streets.filter(s => s.areaId === item.id).length}
            customerCount={customers.filter(c => c.areaId === item.id).length}
            onPress={() => router.push({ pathname: '/areas/[id]', params: { id: item.id, name: item.name } })}
            onEdit={() => openEdit(item.id, item.name)}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="map-pin"
            title={search ? 'No areas found' : 'No areas yet'}
            subtitle={search ? 'Try a different search term' : 'Add your first delivery area to get started'}
            action={!search ? { label: 'Add Area', onPress: openAdd } : undefined}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={openAdd} />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <ModalHeader
            title={editingId ? 'Edit Area' : 'New Area'}
            onClose={() => setModalVisible(false)}
            rightAction={{ label: 'Save', onPress: handleSave }}
          />
          <KeyboardAwareScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FormField
              label="Area Name"
              value={areaName}
              onChangeText={setAreaName}
              placeholder="e.g. Sector 12, Downtown"
              required
            />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Is Sub Area?</Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Show at the top of the list</Text>
              </View>
              <Switch
                value={isSub}
                onValueChange={setIsSub}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <PrimaryButton label={editingId ? 'Save Changes' : 'Add Area'} onPress={handleSave} disabled={!areaName.trim()} />
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  list: { paddingTop: 8, flexGrow: 1 },
  modal: { flex: 1 },
  modalBody: { padding: 16, gap: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12, marginBottom: 12 },
  toggleLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  toggleSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
