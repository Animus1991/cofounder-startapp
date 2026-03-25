import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../Avatar';
import { RoleBadge } from '../RoleBadge';
import { UserRole, roleLabels } from '../../types';

interface SidebarProps {
  width: number;
  activeRoute?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', route: '/(tabs)/dashboard' },
  { id: 'discover', label: 'Discover', icon: 'search', route: '/(tabs)/discover' },
  { id: 'matches', label: 'Matches', icon: 'people', route: '/matches' },
  { id: 'opportunities', label: 'Opportunities', icon: 'briefcase', route: '/(tabs)/opportunities' },
  { id: 'messages', label: 'Messages', icon: 'chatbubbles', route: '/(tabs)/messages' },
];

const secondaryNavItems: NavItem[] = [
  { id: 'communities', label: 'Communities', icon: 'globe', route: '/communities' },
  { id: 'mentoring', label: 'Mentoring', icon: 'bulb', route: '/mentoring' },
  { id: 'events', label: 'Events', icon: 'calendar', route: '/events' },
  { id: 'learning', label: 'Learning', icon: 'book', route: '/learning' },
  { id: 'milestones', label: 'Milestones', icon: 'flag', route: '/milestones' },
];

const bottomNavItems: NavItem[] = [
  { id: 'notifications', label: 'Notifications', icon: 'notifications', route: '/notifications' },
  { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
];

export default function Sidebar({ width, activeRoute }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = activeRoute === item.id;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => handleNavigation(item.route)}
      >
        <Ionicons
          name={(isActive ? item.icon : `${item.icon}-outline`) as any}
          size={22}
          color={isActive ? '#6366F1' : '#9CA3AF'}
        />
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
        {item.badge && item.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { width }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Ionicons name="rocket" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.logoText}>CoFounderBay</Text>
      </View>

      {/* User Profile Card */}
      {user && (
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Avatar uri={user.profile?.profile_image} name={user.name} size={40} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.profileRole} numberOfLines={1}>
              {roleLabels[user.roles?.[0] as UserRole] || 'Member'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </TouchableOpacity>
      )}

      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        {/* Main Navigation */}
        <View style={styles.navSection}>
          <Text style={styles.navSectionTitle}>MAIN</Text>
          {mainNavItems.map(renderNavItem)}
        </View>

        {/* Secondary Navigation */}
        <View style={styles.navSection}>
          <Text style={styles.navSectionTitle}>EXPLORE</Text>
          {secondaryNavItems.map(renderNavItem)}
        </View>

        {/* Admin Section (if admin) */}
        {user?.roles?.includes('ecosystem_org' as any) && (
          <View style={styles.navSection}>
            <Text style={styles.navSectionTitle}>ADMIN</Text>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/admin' as any)}
            >
              <Ionicons name="shield-outline" size={22} color="#9CA3AF" />
              <Text style={styles.navLabel}>Admin Panel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map(renderNavItem)}
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={[styles.navLabel, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#1F2937',
    borderRightWidth: 1,
    borderRightColor: '#374151',
    zIndex: 100,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginLeft: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  profileRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  navScroll: {
    flex: 1,
  },
  navSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: '#6366F115',
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 12,
  },
  navLabelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomNav: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
});
