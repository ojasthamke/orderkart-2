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
import { LocationCard, CustomerCard } from '@/components/Cards';
import { EmptyState, FormField, ModalHeader, PrimaryButton, SearchBar, SectionHeader } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { Location, LocationType } from '@/types';

const LOCATION_TYPES: LocationType[] = ['Road', 'Street', 'Galli', 'Society', 'Building', 'Landmark', 'Other'];

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const {
    locations,
    customers,
    addLocation,
    editLocation,
    deleteLocation,
    getBreadcrumbs,
    getLocationsByParent,
    getCustomersAtLocation,
  } = useData();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [locationName, setLocationName] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('Road');
  const [notes, setNotes] = useState('');

  const currentLocation = useMemo(() => locations.find(l => l.id === id), [locations, id]);
  const breadcrumbs = useMemo(() => getBreadcrumbs(id), [getBreadcrumbs, id]);
  
  const subLocations = useMemo(() => {
    return getLocationsByParent(id).filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  }, [getLocationsByParent, id, search]);

  const localCustomers = useMemo(() => {
    // Get non-recursive customers directly assigned to this location
    return getCustomersAtLocation(id!, false).filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [getCustomersAtLocation, id, search]);

  function openAddChild() {
    setEditingId(null);
    setLocationName('');
    setLocationType('Road');
    setNotes('');
    setModalVisible(true);
  }

  function openEdit(loc: Location) {
    setEditingId(loc.id);
    setLocationName(loc.name);
    setLocationType(loc.type);
    setNotes(loc.notes || '');
    setModalVisible(true);
  }

  function handleSave() {
    if (!locationName.trim()) return;
    if (editingId) {
      editLocation(editingId, { name: locationName.trim(), type: locationType, notes: notes.trim() });
    } else {
      addLocation(locationName.trim(), locationType, id!, notes.trim());
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  function handleDelete(loc: Location) {
    Alert.alert(
      'Delete Location',
      `Delete "${loc.name}"? Sub-locations and customers will be re-parented to "${currentLocation?.name || 'parent'}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteLocation(loc.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ],
    );
  }

  function openAddCustomer() {
    router.push({ pathname: '/customers/create', params: { locationId: id } });
  }

  const listData = useMemo(() => {
    const list: any[] = [];
    
    // Add Sub-Locations Section
    list.push({
      kind: 'header',
      title: 'Sub-Locations',
      count: subLocations.length,
      onAdd: openAddChild,
    });
    
    if (subLocations.length === 0) {
      list.push({ kind: 'empty-locations' });
    } else {
      subLocations.forEach(loc => {
        list.push({ kind: 'location', data: loc });
      });
    }
    
    // Add Customers Section
    list.push({
      kind: 'header',
      title: 'Customers',
      count: localCustomers.length,
      onAdd: openAddCustomer,
    });
    
    if (localCustomers.length === 0) {
      list.push({ kind: 'empty-customers' });
    } else {
      localCustomers.forEach(cust => {
        list.push({ kind: 'customer', data: cust });
      });
    }
    
    return list;
  }, [subLocations, localCustomers]);

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  if (!currentLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPt + 20 }]}>
        <EmptyState icon="alert-triangle" title="Location Not Found" subtitle="This location does not exist or has been removed." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: colors.foreground }]}>{currentLocation.name}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {currentLocation.type} details
          </Text>
        </View>
      </View>

      {/* Clickable Breadcrumbs Path */}
      <View style={[styles.breadcrumbRow, { borderBottomColor: colors.border }]}>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            {idx > 0 && <Feather name="chevron-right" size={12} color={colors.mutedForeground} style={styles.chevron} />}
            <TouchableOpacity
              onPress={() => router.replace({ pathname: '/areas/[id]', params: { id: crumb.id } })}
              disabled={crumb.id === id}
            >
              <Text
                style={[
                  styles.breadcrumbText,
                  { color: crumb.id === id ? colors.foreground : colors.primary },
                  crumb.id === id && { fontFamily: 'Inter_600SemiBold' },
                ]}
              >
                {crumb.name}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search within this location..." />

      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.kind}-${item.data?.id || index}`}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <SectionHeader
                title={item.title}
                count={item.count}
                action={{ label: 'Add', onPress: item.onAdd, icon: 'plus' }}
              />
            );
          }
          if (item.kind === 'empty-locations') {
            return (
              <View style={styles.inlineEmpty}>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
                  No sub-locations here yet.
                </Text>
              </View>
            );
          }
          if (item.kind === 'empty-customers') {
            return (
              <View style={styles.inlineEmpty}>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
                  No customers registered directly at this location.
                </Text>
              </View>
            );
          }
          if (item.kind === 'location') {
            const children = getLocationsByParent(item.data.id);
            const subCusts = getCustomersAtLocation(item.data.id, true);
            return (
              <LocationCard
                name={item.data.name}
                type={item.data.type}
                childCount={children.length}
                customerCount={subCusts.length}
                onPress={() => router.push({ pathname: '/areas/[id]', params: { id: item.data.id } })}
                onEdit={() => openEdit(item.data)}
                onDelete={() => handleDelete(item.data)}
              />
            );
          }
          if (item.kind === 'customer') {
            return (
              <CustomerCard
                customer={item.data}
                onPress={() => router.push({ pathname: '/customers/[id]', params: { id: item.data.id } })}
              />
            );
          }
          return null;
        }}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <ModalHeader
            title={editingId ? 'Edit Sub-Location' : 'New Sub-Location'}
            onClose={() => setModalVisible(false)}
            rightAction={{ label: 'Save', onPress: handleSave }}
          />
          <KeyboardAwareScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FormField
              label="Location Name"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g. Main Road, Galli A, Block 3"
              required
            />
            
            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Location Type *</Text>
            <View style={styles.chipsContainer}>
              {LOCATION_TYPES.map(t => {
                const selected = locationType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setLocationType(t)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.muted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#fff' : colors.foreground }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FormField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional landmark or navigation notes"
              multiline
              numberOfLines={3}
            />
            <PrimaryButton label={editingId ? 'Save Changes' : 'Add Sub-Location'} onPress={handleSave} disabled={!locationName.trim()} />
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
  breadcrumbRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 4, borderBottomWidth: 1,
  },
  breadcrumbText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  chevron: { marginHorizontal: 2 },
  list: { paddingTop: 8, flexGrow: 1 },
  inlineEmpty: { paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center' },
  modal: { flex: 1 },
  modalBody: { padding: 16, gap: 16 },
  formLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
