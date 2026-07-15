import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormField, ModalHeader, PrimaryButton, SearchBar } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

export default function CreateCustomerScreen() {
  const { locationId, editId } = useLocalSearchParams<{
    locationId?: string;
    editId?: string;
  }>();

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addCustomer, editCustomer, customers, locations, getLocationPath } = useData();

  const isEditing = !!editId;
  const editingCustomer = isEditing ? customers.find(c => c.id === editId) : null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Location Selection State
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setPhone2(editingCustomer.phone2 || '');
      setHouseNumber(editingCustomer.houseNumber);
      setAddress(editingCustomer.address);
      setNotes(editingCustomer.notes || '');
      setWhatsapp(editingCustomer.whatsapp || '');
      setSelectedLocationId(editingCustomer.locationId);
    } else if (locationId) {
      setSelectedLocationId(locationId);
    }
  }, [editId, locationId, editingCustomer]);

  const filteredLocations = useMemo(() => {
    return locations
      .map(l => ({ ...l, pathLabel: getLocationPath(l.id) }))
      .filter(l => l.pathLabel.toLowerCase().includes(pickerSearch.toLowerCase()))
      .sort((a, b) => a.pathLabel.localeCompare(b.pathLabel));
  }, [locations, pickerSearch, getLocationPath]);

  function handleSave() {
    if (!name.trim() || !phone.trim() || !selectedLocationId) return;

    if (isEditing && editingCustomer) {
      editCustomer(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        phone2: phone2.trim(),
        houseNumber: houseNumber.trim(),
        address: address.trim(),
        notes: notes.trim(),
        whatsapp: whatsapp.trim(),
        locationId: selectedLocationId,
      });
    } else {
      addCustomer({
        locationId: selectedLocationId,
        name: name.trim(),
        phone: phone.trim(),
        phone2: phone2.trim(),
        houseNumber: houseNumber.trim(),
        address: address.trim(),
        notes: notes.trim(),
        whatsapp: whatsapp.trim(),
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  const canSave = name.trim().length > 0 && phone.trim().length > 0 && selectedLocationId.length > 0;
  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHeader
        title={isEditing ? 'Edit Customer' : 'New Customer'}
        onClose={() => router.back()}
        rightAction={{ label: 'Save', onPress: handleSave }}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.body, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PERSONAL INFO</Text>
        <FormField label="Full Name" value={name} onChangeText={setName} required />
        <FormField label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" required />
        <FormField label="Phone 2 (Optional)" value={phone2} onChangeText={setPhone2} keyboardType="phone-pad" />
        <FormField label="WhatsApp Number" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>LOCATION & ADDRESS</Text>
        
        {/* Clickable Location Picker Field */}
        <TouchableOpacity
          style={styles.pickerField}
          onPress={() => setPickerVisible(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Assigned Location *</Text>
            <Text style={{ color: selectedLocationId ? colors.foreground : colors.mutedForeground, fontSize: 15, fontFamily: 'Inter_500Medium', marginTop: 4 }}>
              {selectedLocationId ? getLocationPath(selectedLocationId) : 'Choose location...'}
            </Text>
          </View>
          <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <FormField label="House / Flat Number" value={houseNumber} onChangeText={setHouseNumber} />
        <FormField label="Address / Landmark Notes" value={address} onChangeText={setAddress} multiline />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>NOTES</Text>
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Any special instructions..." />

        <View style={styles.actionRow}>
          <PrimaryButton label={isEditing ? 'Save Changes' : 'Add Customer'} onPress={handleSave} disabled={!canSave} />
        </View>
      </KeyboardAwareScrollView>

      {/* Location Picker Search Modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ModalHeader title="Select Location" onClose={() => setPickerVisible(false)} />
          <SearchBar value={pickerSearch} onChangeText={setPickerSearch} placeholder="Search locations..." />
          <FlatList
            data={filteredLocations}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedLocationId(item.id);
                  setPickerVisible(false);
                  setPickerSearch('');
                }}
              >
                <Feather name="map-pin" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 15, fontFamily: 'Inter_500Medium' }}>{item.pathLabel}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 }}>Type: {item.type}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, gap: 4 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  actionRow: { marginTop: 12 },
  pickerField: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderWidth: 1, borderRadius: 10, borderColor: '#ccc',
    marginBottom: 14, minHeight: 60,
  },
  pickerLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1,
  },
});
