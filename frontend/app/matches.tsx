import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Avatar } from '../src/components/Avatar';
import { RoleBadge } from '../src/components/RoleBadge';
import api from '../src/utils/api';
import { useResponsive } from '../src/hooks/useResponsive';
import { User, UserRole, roleLabels } from '../src/types';

interface MatchResult {
  user: User;
  score: number;
  matchReasons: string[];
  complementarySkills: string[];
  sharedInterests: string[];
  mismatchFlags: string[];
}

const MATCH_WEIGHTS = {
  skills: 25,
  rolefit: 20,
  stage: 15,
  industry: 15,
  commitment: 10,
  location: 10,
  values: 5,
};

export default function MatchesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop, isTablet, columns, padding } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [filters, setFilters] = useState({
    role: '' as string,
    stage: '' as string,
    location: '' as string,
    minScore: 50,
  });
  const [showFilters, setShowFilters] = useState(false);

  const calculateCompatibility = (otherUser: any): MatchResult => {
    let score = 0;
    const matchReasons: string[] = [];
    const complementarySkills: string[] = [];
    const sharedInterests: string[] = [];
    const mismatchFlags: string[] = [];

    const myProfile = user?.profile || {};
    const theirProfile = otherUser.profile || {};

    // Skills compatibility (complementary skills are valued)
    const mySkills = new Set(myProfile.skills || []);
    const theirSkills = new Set(theirProfile.skills || []);
    
    theirSkills.forEach((skill: string) => {
      if (!mySkills.has(skill)) {
        complementarySkills.push(skill);
      }
    });
    
    if (complementarySkills.length > 0) {
      score += Math.min(MATCH_WEIGHTS.skills, complementarySkills.length * 5);
      matchReasons.push(`Has ${complementarySkills.length} complementary skills`);
    }

    // Shared interests
    const myInterests = new Set(myProfile.interests || []);
    const theirInterests = theirProfile.interests || [];
    
    theirInterests.forEach((interest: string) => {
      if (myInterests.has(interest)) {
        sharedInterests.push(interest);
      }
    });
    
    if (sharedInterests.length > 0) {
      score += Math.min(15, sharedInterests.length * 5);
      matchReasons.push(`${sharedInterests.length} shared interests`);
    }

    // Role fit (founders looking for technical co-founders, etc.)
    const myRole = user?.roles?.[0];
    const theirRole = otherUser.roles?.[0];
    
    if (myRole === 'founder' && theirRole === 'talent') {
      score += MATCH_WEIGHTS.rolefit;
      matchReasons.push('Potential technical co-founder');
    } else if (myRole === 'founder' && theirRole === 'mentor') {
      score += MATCH_WEIGHTS.rolefit * 0.7;
      matchReasons.push('Can provide mentorship');
    } else if (myRole === 'founder' && theirRole === 'investor') {
      score += MATCH_WEIGHTS.rolefit * 0.5;
      matchReasons.push('Potential investor');
    }

    // Sector/Industry match
    const mySectors = new Set(myProfile.sectors || []);
    const theirSectors = theirProfile.sectors || [];
    const sharedSectors = theirSectors.filter((s: string) => mySectors.has(s));
    
    if (sharedSectors.length > 0) {
      score += MATCH_WEIGHTS.industry;
      matchReasons.push(`Same industry focus: ${sharedSectors[0]}`);
    }

    // Stage preferences
    const myStages = new Set(myProfile.stage_preferences || []);
    const theirStages = theirProfile.stage_preferences || [];
    const sharedStages = theirStages.filter((s: string) => myStages.has(s));
    
    if (sharedStages.length > 0) {
      score += MATCH_WEIGHTS.stage;
      matchReasons.push('Aligned on startup stage');
    }

    // Location compatibility
    if (myProfile.remote_ok && theirProfile.remote_ok) {
      score += MATCH_WEIGHTS.location;
      matchReasons.push('Both open to remote');
    } else if (myProfile.location && theirProfile.location && 
               myProfile.location === theirProfile.location) {
      score += MATCH_WEIGHTS.location;
      matchReasons.push(`Same location: ${myProfile.location}`);
    }

    // Availability match
    if (myProfile.availability_hours && theirProfile.availability_hours) {
      const diff = Math.abs(myProfile.availability_hours - theirProfile.availability_hours);
      if (diff <= 10) {
        score += MATCH_WEIGHTS.commitment;
        matchReasons.push('Similar time commitment');
      } else {
        mismatchFlags.push('Different availability levels');
      }
    }

    // Add some randomness for demo variety
    score += Math.floor(Math.random() * 10);
    
    // Normalize score to 0-100
    score = Math.min(100, Math.max(0, score));

    return {
      user: otherUser,
      score,
      matchReasons,
      complementarySkills: complementarySkills.slice(0, 3),
      sharedInterests: sharedInterests.slice(0, 3),
      mismatchFlags,
    };
  };

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users?limit=50');
      const allUsers = response.data || [];
      
      // Filter out current user and calculate compatibility
      const potentialMatches = allUsers
        .filter((u: any) => u.user_id !== user?.user_id)
        .map(calculateCompatibility)
        .filter((m: MatchResult) => m.score >= filters.minScore)
        .sort((a: MatchResult, b: MatchResult) => b.score - a.score);

      setMatches(potentialMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [fetchMatches]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#6366F1';
  };

  const renderMatchCard = (match: MatchResult) => (
    <TouchableOpacity
      key={match.user.user_id}
      style={[styles.matchCard, isDesktop && styles.matchCardDesktop]}
      onPress={() => router.push(`/user/${match.user.user_id}`)}
    >
      {/* Score Badge */}
      <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(match.score) }]}>
        <Text style={styles.scoreText}>{match.score}%</Text>
        <Text style={styles.scoreLabel}>Match</Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <Avatar uri={match.user.profile?.profile_image} name={match.user.name} size={60} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{match.user.name}</Text>
          <RoleBadge role={match.user.roles?.[0] as UserRole} size="small" />
          {match.user.profile?.headline && (
            <Text style={styles.userHeadline} numberOfLines={2}>
              {match.user.profile.headline}
            </Text>
          )}
        </View>
      </View>

      {/* Match Explanation */}
      <View style={styles.matchExplanation}>
        <Text style={styles.explanationTitle}>Why this match?</Text>
        {match.matchReasons.slice(0, 3).map((reason, index) => (
          <View key={index} style={styles.reasonItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        ))}
      </View>

      {/* Complementary Skills */}
      {match.complementarySkills.length > 0 && (
        <View style={styles.skillsSection}>
          <Text style={styles.skillsTitle}>Complementary Skills</Text>
          <View style={styles.skillTags}>
            {match.complementarySkills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Shared Interests */}
      {match.sharedInterests.length > 0 && (
        <View style={styles.interestsSection}>
          <Text style={styles.skillsTitle}>Shared Interests</Text>
          <View style={styles.skillTags}>
            {match.sharedInterests.map((interest, index) => (
              <View key={index} style={[styles.skillTag, styles.interestTag]}>
                <Text style={[styles.skillTagText, styles.interestTagText]}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mismatch Flags */}
      {match.mismatchFlags.length > 0 && (
        <View style={styles.flagsSection}>
          {match.mismatchFlags.map((flag, index) => (
            <View key={index} style={styles.flagItem}>
              <Ionicons name="alert-circle" size={14} color="#F59E0B" />
              <Text style={styles.flagText}>{flag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => router.push(`/user/${match.user.user_id}`)}
        >
          <Ionicons name="person-add" size={18} color="#FFFFFF" />
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="bookmark-outline" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Your Matches</Text>
            <Text style={styles.headerSubtitle}>{matches.length} compatible profiles</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={22} color="#F9FAFB" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Min Match Score: {filters.minScore}%</Text>
            <View style={styles.scoreButtons}>
              {[30, 50, 70, 80].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.scoreButton,
                    filters.minScore === score && styles.scoreButtonActive,
                  ]}
                  onPress={() => setFilters({ ...filters, minScore: score })}
                >
                  <Text style={[
                    styles.scoreButtonText,
                    filters.minScore === score && styles.scoreButtonTextActive,
                  ]}>
                    {score}%+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Match Algorithm Info */}
      <View style={styles.algorithmInfo}>
        <Ionicons name="sparkles" size={16} color="#6366F1" />
        <Text style={styles.algorithmText}>
          Matches based on complementary skills, shared interests, and career alignment
        </Text>
      </View>

      {/* Matches List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Finding your best matches...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            isDesktop && styles.contentContainerDesktop,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
        >
          <View style={[
            styles.matchesGrid,
            isDesktop && styles.matchesGridDesktop,
          ]}>
            {matches.map(renderMatchCard)}
          </View>
          
          {matches.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or complete your profile for better matches
              </Text>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerDesktop: {
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  filterToggle: {
    padding: 8,
    backgroundColor: '#1F2937',
    borderRadius: 10,
  },
  filtersPanel: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  scoreButtonActive: {
    backgroundColor: '#6366F1',
  },
  scoreButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  scoreButtonTextActive: {
    color: '#FFFFFF',
  },
  algorithmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#6366F110',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    gap: 8,
  },
  algorithmText: {
    flex: 1,
    fontSize: 13,
    color: '#6366F1',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerDesktop: {
    padding: 32,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  matchesGrid: {
    gap: 16,
  },
  matchesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  matchCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  matchCardDesktop: {
    width: '48%',
    marginRight: '2%',
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 80,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  userHeadline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    lineHeight: 20,
  },
  matchExplanation: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 10,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  reasonText: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  skillsSection: {
    marginBottom: 12,
  },
  interestsSection: {
    marginBottom: 12,
  },
  skillsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  skillTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: '#6366F120',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  skillTagText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  interestTag: {
    backgroundColor: '#10B98120',
  },
  interestTagText: {
    color: '#10B981',
  },
  flagsSection: {
    marginBottom: 12,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  flagText: {
    fontSize: 12,
    color: '#F59E0B',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
