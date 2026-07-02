import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormField, ModalHeader, PrimaryButton } from '@/components/UI';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useData();

  const [businessName, setBusinessName] = useState(settings.businessName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [deliveryCharge, setDeliveryCharge] = useState(String(settings.deliveryCharge));
  const [smartRounding, setSmartRounding] = useState(settings.smartRounding);
  const [currency, setCurrency] = useState(settings.currency);

  useEffect(() => {
    setBusinessName(settings.businessName);
    setOwnerName(settings.ownerName);
    setPhone(settings.phone);
    setWhatsapp(settings.whatsapp);
    setDeliveryCharge(String(settings.deliveryCharge));
    setSmartRounding(settings.smartRounding);
    setCurrency(settings.currency);
  }, [settings]);

  function handleSave() {
    updateSettings({
      businessName: businessName.trim() || 'My Business',
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      deliveryCharge: parseFloat(deliveryCharge) || 10,
      smartRounding,
      currency: currency.trim() || '₹',
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Settings saved successfully!');
  }

  const topPt = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const c = colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.foreground }]}>Settings</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.body, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Business Info */}
        <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>BUSINESS INFORMATION</Text>
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <FormField label="Business Name" value={businessName} onChangeText={setBusinessName} />
          <FormField label="Owner Name" value={ownerName} onChangeText={setOwnerName} />
          <FormField label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <FormField label="WhatsApp Number" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
        </View>

        {/* Order Settings */}
        <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>ORDER SETTINGS</Text>
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <FormField
            label="Default Delivery Charge"
            value={deliveryCharge}
            onChangeText={setDeliveryCharge}
            keyboardType="decimal-pad"
          />
          <FormField label="Currency Symbol" value={currency} onChangeText={setCurrency} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={[styles.toggleLabel, { color: c.foreground }]}>Smart Bill Rounding</Text>
              <Text style={[styles.toggleSub, { color: c.mutedForeground }]}>Round bills to nearest 10 (e.g. ₹58 → ₹60)</Text>
            </View>
            <Switch
              value={smartRounding}
              onValueChange={setSmartRounding}
              trackColor={{ true: c.primary }}
            />
          </View>
        </View>

        {/* App Info */}
        <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: c.mutedForeground }]}>App Name</Text>
            <Text style={[styles.infoVal, { color: c.foreground }]}>FreshFlow</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: c.mutedForeground }]}>Version</Text>
            <Text style={[styles.infoVal, { color: c.foreground }]}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: c.mutedForeground }]}>Data Storage</Text>
            <Text style={[styles.infoVal, { color: c.foreground }]}>Offline (Device)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: c.mutedForeground }]}>Cloud Sync</Text>
            <Text style={[styles.infoVal, { color: c.mutedForeground }]}>Coming Soon</Text>
          </View>
        </View>

        <PrimaryButton label="Save Settings" onPress={handleSave} icon="save" />

        {/* Future Backup Options */}
        <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>BACKUP & RESTORE</Text>
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          {['Export Database', 'Import Database', 'Cloud Backup (Coming Soon)', 'Google Drive (Coming Soon)'].map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.futureBtn, { borderBottomColor: c.border }]}
              onPress={() => {
                if (item.includes('Coming Soon')) {
                  Alert.alert('Coming Soon', 'This feature will be available in a future update.');
                }
              }}
            >
              <Feather
                name={item.includes('Export') ? 'upload' : item.includes('Import') ? 'download' : item.includes('Cloud') ? 'cloud' : 'hard-drive'}
                size={18}
                color={item.includes('Coming Soon') ? c.border : c.primary}
              />
              <Text style={[styles.futureBtnTxt, { color: item.includes('Coming Soon') ? c.border : c.foreground }]}>{item}</Text>
              <Feather name="chevron-right" size={16} color={c.border} />
            </TouchableOpacity>
          ))}
        </View>
      </KeyboardAwareScrollView>
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
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  body: { padding: 16, gap: 8 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  toggleLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  toggleSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  infoVal: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  futureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  futureBtnTxt: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
});
