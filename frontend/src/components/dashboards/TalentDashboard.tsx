import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

interface Props {
  data: any;
  user: User | null;
}

export default function TalentDashboard({ data, user }: Props) {
  const router = useRouter();
  const stats = data?.stats || {};
  const jobs = data?.jobs || [];
  const recommendations = data?.recommendations || [];

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Talent Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Find your dream startup role and grow your career
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="briefcase" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statNumber}>{stats.matchingJobs || 0}</Text>
          <Text style={styles.statLabel}>Matching Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="paper-plane" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{stats.applications || 0}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="eye" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{stats.profileViews || 0}</Text>
          <Text style={styles.statLabel}>Profile Views</Text>
        </View>
      </View>

      {/* Profile Strength */}
      <View style={styles.section}>
        <View style={styles.profileStrength}>
          <View style={styles.profileStrengthHeader}>
            <View>
              <Text style={styles.profileStrengthTitle}>Profile Strength</Text>
              <Text style={styles.profileStrengthSubtitle}>Add skills to improve visibility</Text>
            </View>
            <View style={styles.strengthBadge}>
              <Text style={styles.strengthBadgeText}>85%</Text>
            </View>
          </View>
          <View style={styles.strengthProgress}>
            <View style={[styles.strengthBar, { width: '85%' }]} />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/opportunities')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#6366F120' }]}>
              <Ionicons name="search" size={28} color="#6366F1" />
            </View>
            <Text style={styles.actionTitle}>Browse Jobs</Text>
            <Text style={styles.actionSubtitle}>{jobs.length}+ open roles</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="person" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>Edit Profile</Text>
            <Text style={styles.actionSubtitle}>Stand out</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/learning')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="school" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionTitle}>Learn Skills</Text>
            <Text style={styles.actionSubtitle}>Grow expertise</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/mentoring')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="bulb" size={28} color="#EC4899" />
            </View>
            <Text style={styles.actionTitle}>Get Guidance</Text>
            <Text style={styles.actionSubtitle}>Book a mentor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recommended Jobs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/opportunities')}>
            <Text style={styles.sectionLink}>See All</Text>
          </TouchableOpacity>
        </View>
        {jobs.slice(0, 3).map((job: any, index: number) => (
          <TouchableOpacity key={job.opportunity_id || index} style={styles.jobCard}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>
                {job.creator?.name || 'Startup'} • {job.location || 'Remote'}
              </Text>
              <View style={styles.jobTags}>
                <View style={styles.jobTag}>
                  <Text style={styles.jobTagText}>{job.type || 'Full-time'}</Text>
                </View>
                {job.compensation_type && (
                  <View style={[styles.jobTag, { backgroundColor: '#10B98120' }]}>
                    <Text style={[styles.jobTagText, { color: '#10B981' }]}>
                      {job.compensation_type}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeNumber}>{90 - index * 5}%</Text>
              <Text style={styles.matchBadgeLabel}>Match</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Skill Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Skills</Text>
        <View style={styles.skillsCard}>
          <Text style={styles.skillsIntro}>
            Based on your profile, these skills could help you stand out:
          </Text>
          <View style={styles.skillsList}>
            {['TypeScript', 'AWS', 'Product Management', 'Data Analysis'].map((skill, index) => (
              <View key={index} style={styles.skillItem}>
                <View style={styles.skillIcon}>
                  <Ionicons name="add-circle" size={20} color="#6366F1" />
                </View>
                <Text style={styles.skillName}>{skill}</Text>
                <TouchableOpacity style={styles.addSkillButton}>
                  <Text style={styles.addSkillText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
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
  profileStrength: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  profileStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileStrengthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  profileStrengthSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  strengthBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  strengthBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  strengthProgress: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  strengthBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
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
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  jobCompany: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  jobTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  jobTag: {
    backgroundColor: '#6366F120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jobTagText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '500',
  },
  matchBadge: {
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  matchBadgeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  matchBadgeLabel: {
    fontSize: 11,
    color: '#10B981',
  },
  skillsCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  skillsIntro: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  skillsList: {
    gap: 10,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIcon: {
    marginRight: 10,
  },
  skillName: {
    flex: 1,
    fontSize: 15,
    color: '#F9FAFB',
  },
  addSkillButton: {
    backgroundColor: '#6366F120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSkillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
});
