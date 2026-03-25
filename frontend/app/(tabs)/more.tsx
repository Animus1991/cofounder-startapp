import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const menuItems = [
  { id: 'events', title: 'Events', icon: 'calendar-outline', color: '#6366F1', description: 'Discover startup events' },
  { id: 'marketplace', title: 'Marketplace', icon: 'cart-outline', color: '#10B981', description: 'Tools & services for startups' },
  { id: 'mentoring', title: 'Mentoring', icon: 'bulb-outline', color: '#F59E0B', description: 'Find mentors & book sessions' },
  { id: 'learning', title: 'Learning', icon: 'book-outline', color: '#EC4899', description: 'Courses & resources' },
  { id: 'groups', title: 'Groups', icon: 'people-outline', color: '#8B5CF6', description: 'Join communities' },
  { id: 'connections', title: 'My Network', icon: 'git-network-outline', color: '#06B6D4', description: 'Manage your connections' },
  { id: 'profile', title: 'My Profile', icon: 'person-circle-outline', color: '#EF4444', description: 'View & edit your profile' },
  { id: 'settings', title: 'Settings', icon: 'settings-outline', color: '#6B7280', description: 'App preferences' },
];

export default function MoreScreen() {
  const router = useRouter();

  const handleMenuPress = (id: string) => {
    switch (id) {
      case 'events':
        router.push('/events');
        break;
      case 'marketplace':
        router.push('/marketplace');
        break;
      case 'mentoring':
        router.push('/mentoring');
        break;
      case 'learning':
        router.push('/learning');
        break;
      case 'groups':
        router.push('/groups');
        break;
      case 'connections':
        router.push('/(tabs)/connections');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      case 'settings':
        router.push('/settings');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>CoFounderBay v2.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
