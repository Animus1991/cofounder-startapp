import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '../../hooks/useResponsive';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: ReactNode;
  onBack?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  rightContent,
  onBack,
}: PageHeaderProps) {
  const router = useRouter();
  const { isDesktop, showSidebar } = useResponsive();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={styles.leftSection}>
        {showBack && !showSidebar && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightContent && <View style={styles.rightSection}>{rightContent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    backgroundColor: '#111827',
  },
  containerDesktop: {
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  titleDesktop: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
