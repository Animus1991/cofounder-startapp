import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserRole, roleLabels, roleColors, roleIcons } from '../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'small' | 'medium' | 'large';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'small' }) => {
  const color = roleColors[role] || '#6366F1';
  const label = roleLabels[role] || role;
  const icon = roleIcons[role] || 'person';

  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, iconSize: 12 },
    medium: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, iconSize: 14 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, iconSize: 16 },
  };

  const s = sizeStyles[size];

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }]}>
      <Ionicons name={icon as any} size={s.iconSize} color={color} style={styles.icon} />
      <Text style={[styles.text, { color, fontSize: s.fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
