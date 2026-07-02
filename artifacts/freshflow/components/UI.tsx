import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

// ─── StatCard ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, color, onPress }: StatCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color: string;
  bg?: string;
  small?: boolean;
}

export function Badge({ label, color, bg, small }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg || color + '18' }, small && styles.badgeSmall]}>
      <Text style={[styles.badgeText, { color }, small && styles.badgeTextSmall]}>{label}</Text>
    </View>
  );
}

// ─── SearchBar ───────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const colors = useColors();
  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="search" size={18} color={colors.mutedForeground} />
      <TextInput
        style={[styles.searchInput, { color: colors.foreground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon as any} size={32} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      )}
      {action && (
        <TouchableOpacity
          style={[styles.emptyAction, { backgroundColor: colors.primary }]}
          onPress={action.onPress}
        >
          <Text style={[styles.emptyActionText, { color: colors.primaryForeground }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: { label: string; onPress: () => void; icon?: string };
}

export function SectionHeader({ title, count, action }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {count !== undefined && (
          <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
          </View>
        )}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.sectionAction}>
          {action.icon && <Feather name={action.icon as any} size={14} color={colors.primary} />}
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────
interface FABProps {
  onPress: () => void;
  icon?: string;
}

export function FAB({ onPress, icon = 'plus' }: FABProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Feather name={icon as any} size={26} color="#fff" />
    </TouchableOpacity>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function LoadingSpinner() {
  const colors = useColors();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// ─── PrimaryButton ───────────────────────────────────────────────────────────
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: string;
  variant?: 'primary' | 'danger' | 'outline';
}

export function PrimaryButton({ label, onPress, disabled, icon, variant = 'primary' }: PrimaryButtonProps) {
  const colors = useColors();
  const bg =
    variant === 'primary' ? colors.primary :
    variant === 'danger' ? colors.destructive :
    'transparent';
  const fg = variant === 'outline' ? colors.primary : '#fff';
  const border = variant === 'outline' ? { borderWidth: 1.5, borderColor: colors.primary } : {};
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, border]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && <Feather name={icon as any} size={18} color={fg} style={{ marginRight: 8 }} />}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── ModalHeader ─────────────────────────────────────────────────────────────
interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  rightAction?: { label: string; onPress: () => void; loading?: boolean };
}

export function ModalHeader({ title, onClose, rightAction }: ModalHeaderProps) {
  const colors = useColors();
  return (
    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onClose} style={styles.modalClose}>
        <Feather name="x" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>
      <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress} style={styles.modalAction} disabled={rightAction.loading}>
          {rightAction.loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.modalActionText, { color: colors.primary }]}>{rightAction.label}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 60 }} />
      )}
    </View>
  );
}

// ─── FormField ───────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
  required?: boolean;
}

export function FormField({
  label, value, onChangeText, placeholder, keyboardType, multiline, required,
}: FormFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>
        {label}{required && ' *'}
      </Text>
      <TextInput
        style={[
          styles.formInput,
          {
            color: colors.foreground,
            backgroundColor: colors.muted,
            borderColor: colors.border,
          },
          multiline && { height: 80, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
        returnKeyType={multiline ? undefined : 'next'}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    minWidth: 140,
  },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 2 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeSmall: { paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  badgeTextSmall: { fontSize: 11 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', padding: 0 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  emptyAction: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  emptyActionText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'web' ? 54 : 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, gap: 8,
  },
  buttonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalClose: { width: 60, alignItems: 'flex-start' },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', flex: 1, textAlign: 'center' },
  modalAction: { width: 60, alignItems: 'flex-end' },
  modalActionText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  formField: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  formInput: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, fontSize: 15, fontFamily: 'Inter_400Regular',
  },
});
