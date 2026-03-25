import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User, PipelineStage } from '../../types';

interface Props {
  data: any;
  user: User | null;
}

const pipelineStages: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#6366F1' },
  { key: 'contacted', label: 'Contacted', color: '#8B5CF6' },
  { key: 'meeting', label: 'Meeting', color: '#F59E0B' },
  { key: 'due_diligence', label: 'DD', color: '#EC4899' },
  { key: 'term_sheet', label: 'Term Sheet', color: '#10B981' },
];

export default function InvestorDashboard({ data, user }: Props) {
  const router = useRouter();
  const stats = data?.stats || {};
  const pipeline = data?.pipeline || [];

  // Count deals by stage
  const dealsByStage = pipelineStages.map(stage => ({
    ...stage,
    count: pipeline.filter((d: any) => d.stage === stage.key).length
  }));

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Investor Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Track deals, scout startups, and manage your portfolio
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="layers" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statNumber}>{stats.pipeline || 0}</Text>
          <Text style={styles.statLabel}>In Pipeline</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="bookmark" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{stats.watchlists || 0}</Text>
          <Text style={styles.statLabel}>Watchlists</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="trending-up" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{stats.dealsSourcing || 0}</Text>
          <Text style={styles.statLabel}>Scouting</Text>
        </View>
      </View>

      {/* Deal Pipeline */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Deal Pipeline</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pipelineCard}>
          <View style={styles.pipelineStages}>
            {dealsByStage.map((stage, index) => (
              <View key={stage.key} style={styles.pipelineStage}>
                <View style={[styles.stageCircle, { backgroundColor: stage.color }]}>
                  <Text style={styles.stageCount}>{stage.count}</Text>
                </View>
                <Text style={styles.stageLabel}>{stage.label}</Text>
                {index < dealsByStage.length - 1 && (
                  <View style={styles.stageConnector} />
                )}
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.addDealButton}>
            <Ionicons name="add" size={20} color="#6366F1" />
            <Text style={styles.addDealText}>Add New Deal</Text>
          </TouchableOpacity>
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
            <Text style={styles.actionTitle}>Scout Startups</Text>
            <Text style={styles.actionSubtitle}>Find new deals</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="analytics" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>Portfolio</Text>
            <Text style={styles.actionSubtitle}>Track investments</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/events')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="calendar" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionTitle}>Demo Days</Text>
            <Text style={styles.actionSubtitle}>Upcoming events</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="document-text" size={28} color="#EC4899" />
            </View>
            <Text style={styles.actionTitle}>Due Diligence</Text>
            <Text style={styles.actionSubtitle}>Review materials</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thesis Match */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matching Your Thesis</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>See All</Text>
          </TouchableOpacity>
        </View>
        {data?.startups?.slice(0, 3).map((startup: any, index: number) => (
          <TouchableOpacity 
            key={startup.user_id || index} 
            style={styles.startupCard}
            onPress={() => router.push(`/user/${startup.user_id}`)}
          >
            <View style={styles.startupInfo}>
              <Text style={styles.startupName}>{startup.name}</Text>
              <Text style={styles.startupHeadline} numberOfLines={1}>
                {startup.profile?.headline || 'Startup'}
              </Text>
              <View style={styles.startupTags}>
                {startup.profile?.sectors?.slice(0, 2).map((sector: string, i: number) => (
                  <View key={i} style={styles.sectorTag}>
                    <Text style={styles.sectorTagText}>{sector}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.matchScore}>
              <Text style={styles.matchScoreNumber}>{85 - index * 5}%</Text>
              <Text style={styles.matchScoreLabel}>Match</Text>
            </View>
          </TouchableOpacity>
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
  pipelineCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  pipelineStages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pipelineStage: {
    alignItems: 'center',
    position: 'relative',
  },
  stageCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stageCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stageLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stageConnector: {
    position: 'absolute',
    top: 22,
    left: 44,
    width: 20,
    height: 2,
    backgroundColor: '#374151',
  },
  addDealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addDealText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 8,
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
  startupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  startupHeadline: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  startupTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  sectorTag: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectorTagText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  matchScore: {
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  matchScoreNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  matchScoreLabel: {
    fontSize: 11,
    color: '#10B981',
  },
});
