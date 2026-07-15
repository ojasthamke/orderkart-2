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
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationCard } from '@/components/Cards';
import { EmptyState, FAB, FormField, ModalHeader, PrimaryButton, SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

export default function AreasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { locations, customers, addLocation, editLocation, deleteLocation, getLocationsByParent, getCustomersAtLocation } = useData();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');

  const rootLocations = useMemo(
    () =>
      locations
        .filter(l => l.parentLocationId === null && l.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations, search],
  );

  function openAdd() {
    setEditingId(null);
    setLocationName('');
    setNotes('');
    setModalVisible(true);
  }

  function openEdit(id: string, name: string, oldNotes?: string) {
    setEditingId(id);
    setLocationName(name);
    setNotes(oldNotes || '');
    setModalVisible(true);
  }

  function handleSave() {
    if (!locationName.trim()) return;
    if (editingId) {
      editLocation(editingId, { name: locationName.trim(), notes: notes.trim() });
    } else {
      addLocation(locationName.trim(), 'Area', null, notes.trim());
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert(
      'Delete Area',
      `Delete "${name}"? Child locations and customers will be re-parented to the root.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteLocation(id);
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
        <Text style={[styles.title, { color: colors.foreground }]}>Locations</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {rootLocations.length} root areas · Manage delivery hierarchy
        </Text>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search areas..." />

      <FlatList
        data={rootLocations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const subLocations = getLocationsByParent(item.id);
          const subCustomers = getCustomersAtLocation(item.id, true);
          return (
            <LocationCard
              name={item.name}
              type={item.type}
              childCount={subLocations.length}
              customerCount={subCustomers.length}
              onPress={() => router.push({ pathname: '/areas/[id]', params: { id: item.id, name: item.name } })}
              onEdit={() => openEdit(item.id, item.name, item.notes)}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="map"
            title={search ? 'No locations found' : 'No locations yet'}
            subtitle={search ? 'Try a different search term' : 'Add your first root Area to start building the hierarchy'}
            action={!search ? { label: 'Add Location', onPress: openAdd } : undefined}
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
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g. Rajapeth, Sector 4"
              required
            />
            <FormField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
            />
            <PrimaryButton label={editingId ? 'Save Changes' : 'Add Area'} onPress={handleSave} disabled={!locationName.trim()} />
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
});
