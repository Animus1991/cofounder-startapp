import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

interface Props {
  data: any;
  user: User | null;
}

export default function FounderDashboard({ data, user }: Props) {
  const router = useRouter();
  const stats = data?.stats || {};

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Founder Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Build your startup, find co-founders, and grow your network
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="people" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statNumber}>{stats.connections || 0}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="briefcase" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{stats.opportunities || 0}</Text>
          <Text style={styles.statLabel}>Open Roles</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="document-text" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{stats.posts || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
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
            <Text style={styles.actionTitle}>Find Co-Founder</Text>
            <Text style={styles.actionSubtitle}>Discover talent</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/opportunities')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="add-circle" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>Post a Role</Text>
            <Text style={styles.actionSubtitle}>Hire team</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/mentoring')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="bulb" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionTitle}>Get Mentored</Text>
            <Text style={styles.actionSubtitle}>Book a session</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/events')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="calendar" size={28} color="#EC4899" />
            </View>
            <Text style={styles.actionTitle}>Events</Text>
            <Text style={styles.actionSubtitle}>Network & learn</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Startup Readiness (Placeholder) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Startup Readiness</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.readinessCard}>
          <View style={styles.readinessHeader}>
            <View style={styles.readinessScore}>
              <Text style={styles.readinessScoreNumber}>72</Text>
              <Text style={styles.readinessScoreLabel}>/100</Text>
            </View>
            <View style={styles.readinessInfo}>
              <Text style={styles.readinessTitle}>Good Progress!</Text>
              <Text style={styles.readinessSubtitle}>Complete your pitch deck to improve</Text>
            </View>
          </View>
          <View style={styles.readinessProgress}>
            <View style={[styles.readinessBar, { width: '72%' }]} />
          </View>
          <View style={styles.readinessChecklist}>
            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.checklistText}>Profile Complete</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.checklistText}>Team Members Added</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="ellipse-outline" size={20} color="#6B7280" />
              <Text style={[styles.checklistText, { color: '#6B7280' }]}>Pitch Deck Uploaded</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="ellipse-outline" size={20} color="#6B7280" />
              <Text style={[styles.checklistText, { color: '#6B7280' }]}>Financials Added</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        {data?.posts?.slice(0, 2).map((post: any, index: number) => (
          <View key={post.post_id || index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="chatbubble" size={16} color="#6366F1" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText} numberOfLines={2}>
                {post.content}
              </Text>
              <Text style={styles.activityMeta}>
                {post.likes_count} likes • {post.comments_count} comments
              </Text>
            </View>
          </View>
        ))}
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
  readinessCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  readinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  readinessScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 16,
  },
  readinessScoreNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
  },
  readinessScoreLabel: {
    fontSize: 18,
    color: '#6B7280',
  },
  readinessInfo: {
    flex: 1,
  },
  readinessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  readinessSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  readinessProgress: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 16,
  },
  readinessBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  readinessChecklist: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistText: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#6366F120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
  },
  activityMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
