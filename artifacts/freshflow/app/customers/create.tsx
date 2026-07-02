import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormField, ModalHeader, PrimaryButton } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

export default function CreateCustomerScreen() {
  const { streetId, streetName, areaId, areaName, editId } = useLocalSearchParams<{
    streetId?: string;
    streetName?: string;
    areaId?: string;
    areaName?: string;
    editId?: string;
  }>();

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addCustomer, editCustomer, customers } = useData();

  const isEditing = !!editId;
  const editingCustomer = isEditing ? customers.find(c => c.id === editId) : null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setPhone2(editingCustomer.phone2 || '');
      setHouseNumber(editingCustomer.houseNumber);
      setAddress(editingCustomer.address);
      setNotes(editingCustomer.notes || '');
      setWhatsapp(editingCustomer.whatsapp || '');
    }
  }, [editId]);

  function handleSave() {
    if (!name.trim() || !phone.trim()) return;

    if (isEditing && editingCustomer) {
      editCustomer(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        phone2: phone2.trim(),
        houseNumber: houseNumber.trim(),
        address: address.trim(),
        notes: notes.trim(),
        whatsapp: whatsapp.trim(),
      });
    } else {
      addCustomer({
        streetId: streetId!,
        streetName: streetName || '',
        areaId: areaId || editingCustomer?.areaId || '',
        areaName: areaName || editingCustomer?.areaName || '',
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

  const canSave = name.trim().length > 0 && phone.trim().length > 0;
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
        {streetName && (
          <View style={[styles.streetBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.streetBadgeText, { color: colors.primary }]}>
              {streetName} · {areaName}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PERSONAL INFO</Text>
        <FormField label="Full Name" value={name} onChangeText={setName} required />
        <FormField label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" required />
        <FormField label="Phone 2 (Optional)" value={phone2} onChangeText={setPhone2} keyboardType="phone-pad" />
        <FormField label="WhatsApp Number" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>ADDRESS</Text>
        <FormField label="House / Flat Number" value={houseNumber} onChangeText={setHouseNumber} />
        <FormField label="Address / Landmark" value={address} onChangeText={setAddress} multiline />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>NOTES</Text>
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Any special instructions..." />

        <View style={styles.actionRow}>
          <PrimaryButton label={isEditing ? 'Save Changes' : 'Add Customer'} onPress={handleSave} disabled={!canSave} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, gap: 4 },
  streetBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10,
    borderRadius: 10, marginBottom: 16, alignSelf: 'flex-start',
  },
  streetBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  actionRow: { marginTop: 12 },
});
