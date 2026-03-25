import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

interface Props {
  data: any;
  user: User | null;
}

export default function ServiceProviderDashboard({ data, user }: Props) {
  const router = useRouter();
  const stats = data?.stats || {};

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Service Provider Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Connect with startups and grow your business
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="people" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statNumber}>{stats.activeClients || 0}</Text>
          <Text style={styles.statLabel}>Active Clients</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="cube" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{stats.services || 0}</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="star" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{stats.rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#6366F120' }]}>
              <Ionicons name="search" size={28} color="#6366F1" />
            </View>
            <Text style={styles.actionTitle}>Find Clients</Text>
            <Text style={styles.actionSubtitle}>Browse startups</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="add-circle" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>Add Service</Text>
            <Text style={styles.actionSubtitle}>List your offering</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/marketplace')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="storefront" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionTitle}>Marketplace</Text>
            <Text style={styles.actionSubtitle}>View your listings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/messages')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="chatbubbles" size={28} color="#EC4899" />
            </View>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionSubtitle}>Client inquiries</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Service Catalog */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Services</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.serviceCard}>
          <View style={styles.serviceIcon}>
            <Ionicons name="code-slash" size={24} color="#6366F1" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Software Development</Text>
            <Text style={styles.servicePrice}>Starting at $5,000</Text>
          </View>
          <View style={styles.serviceStats}>
            <Text style={styles.serviceStatNumber}>12</Text>
            <Text style={styles.serviceStatLabel}>Projects</Text>
          </View>
        </View>
        <View style={styles.serviceCard}>
          <View style={styles.serviceIcon}>
            <Ionicons name="color-palette" size={24} color="#EC4899" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>UI/UX Design</Text>
            <Text style={styles.servicePrice}>Starting at $2,500</Text>
          </View>
          <View style={styles.serviceStats}>
            <Text style={styles.serviceStatNumber}>8</Text>
            <Text style={styles.serviceStatLabel}>Projects</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addServiceButton}>
          <Ionicons name="add" size={20} color="#6366F1" />
          <Text style={styles.addServiceText}>Add New Service</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Leads */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        {(data?.clients || []).slice(0, 3).map((client: any, index: number) => (
          <View key={client.connection_id || index} style={styles.leadCard}>
            <View style={styles.leadInfo}>
              <Text style={styles.leadName}>{client.other_user?.name || 'Startup'}</Text>
              <Text style={styles.leadCompany}>
                {client.other_user?.headline || 'Looking for services'}
              </Text>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Earnings Overview (Placeholder) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Revenue</Text>
              <Text style={styles.earningsValue}>$12,450</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>New Clients</Text>
              <Text style={styles.earningsValue}>3</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Projects</Text>
              <Text style={styles.earningsValue}>5</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366F120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  servicePrice: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 2,
  },
  serviceStats: {
    alignItems: 'center',
  },
  serviceStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  serviceStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addServiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 8,
  },
  leadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  leadCompany: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  contactButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  earningsCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  earningsItem: {
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
  },
});
