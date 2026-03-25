import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

interface Props {
  data: any;
  user: User | null;
}

export default function MentorDashboard({ data, user }: Props) {
  const router = useRouter();
  const stats = data?.stats || {};
  const sessions = data?.sessions || [];

  const upcomingSessions = sessions.filter((s: any) => s.status === 'pending' || s.status === 'confirmed');

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Mentor Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Guide founders, share expertise, and grow your impact
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="calendar" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statNumber}>{stats.totalSessions || 0}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="star" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{stats.rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="people" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{stats.activeMentees || 0}</Text>
          <Text style={styles.statLabel}>Mentees</Text>
        </View>
      </View>

      {/* Upcoming Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        {upcomingSessions.length > 0 ? (
          upcomingSessions.slice(0, 3).map((session: any, index: number) => (
            <View key={session.session_id || index} style={styles.sessionCard}>
              <View style={styles.sessionTime}>
                <Text style={styles.sessionDate}>Today</Text>
                <Text style={styles.sessionHour}>2:00 PM</Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTopic}>{session.topic || 'Mentoring Session'}</Text>
                <Text style={styles.sessionMentee}>
                  with {session.mentor?.name || 'Mentee'}
                </Text>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color="#374151" />
            <Text style={styles.emptyText}>No upcoming sessions</Text>
            <Text style={styles.emptySubtext}>Your schedule is clear</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#6366F120' }]}>
              <Ionicons name="settings" size={28} color="#6366F1" />
            </View>
            <Text style={styles.actionTitle}>Availability</Text>
            <Text style={styles.actionSubtitle}>Set your hours</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="cash" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>Earnings</Text>
            <Text style={styles.actionSubtitle}>$2,400 this month</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/learning')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="book" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionTitle}>Create Course</Text>
            <Text style={styles.actionSubtitle}>Share knowledge</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/feed')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="chatbubbles" size={28} color="#EC4899" />
            </View>
            <Text style={styles.actionTitle}>Community</Text>
            <Text style={styles.actionSubtitle}>Share insights</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mentor Profile Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Mentor Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>${user?.mentor_info?.hourly_rate || 100}</Text>
                <Text style={styles.profileStatLabel}>per hour</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{user?.mentor_info?.total_sessions || 0}</Text>
                <Text style={styles.profileStatLabel}>sessions</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{user?.mentor_info?.avg_rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.profileStatLabel}>rating</Text>
              </View>
            </View>
          </View>
          <View style={styles.expertiseSection}>
            <Text style={styles.expertiseTitle}>Expertise</Text>
            <View style={styles.expertiseTags}>
              {(user?.mentor_info?.expertise || user?.profile?.skills || []).slice(0, 4).map((skill: string, index: number) => (
                <View key={index} style={styles.expertiseTag}>
                  <Text style={styles.expertiseTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={18} color="#6366F1" />
            <Text style={styles.editProfileText}>Edit Mentor Profile</Text>
          </TouchableOpacity>
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
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sessionTime: {
    alignItems: 'center',
    backgroundColor: '#6366F115',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  sessionDate: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  sessionHour: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTopic: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  sessionMentee: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
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
  profileCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  profileHeader: {
    marginBottom: 16,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
  expertiseSection: {
    marginBottom: 16,
  },
  expertiseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    backgroundColor: '#6366F120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expertiseTagText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 8,
  },
});
