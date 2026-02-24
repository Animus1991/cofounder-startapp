import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { User, AIRecommendation, UserRole, roleLabels } from '../../src/types';
import { UserCard } from '../../src/components/UserCard';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import api from '../../src/utils/api';

const roleFilters: (UserRole | 'all')[] = ['all', 'founder', 'investor', 'mentor', 'service_provider', 'talent', 'startup_team'];

export default function DiscoverScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'browse'>('browse');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchRecommendations = async () => {
    try {
      const response = await api.get<AIRecommendation[]>('/recommendations');
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchUsers = async (reset = false) => {
    if (loadingMore && !reset) return;
    
    const newPage = reset ? 0 : page;
    if (reset) {
      setPage(0);
      setHasMore(true);
    }

    try {
      const params: any = { skip: newPage * 10, limit: 10 };
      if (selectedRole !== 'all') params.role = selectedRole;

      const response = await api.get<User[]>('/users', { params });
      
      if (reset) {
        setUsers(response.data);
      } else {
        setUsers(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
      setPage(newPage + 1);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRecommendations(), fetchUsers(true)]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchUsers(true);
    }
  }, [selectedRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRecommendations(), fetchUsers(true)]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || activeTab !== 'browse') return;
    setLoadingMore(true);
    await fetchUsers();
    setLoadingMore(false);
  };

  const handleConnect = async (userId: string) => {
    try {
      await api.post('/connections/request', { target_user_id: userId });
      setRecommendations(prev => prev.filter(r => r.user?.user_id !== userId));
      setUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  if (loading) {
    return <LoadingScreen message="Finding great matches..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.tabActive]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Ionicons 
            name="sparkles" 
            size={18} 
            color={activeTab === 'recommendations' ? '#6366F1' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.tabTextActive]}>
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Ionicons 
            name="grid-outline" 
            size={18} 
            color={activeTab === 'browse' ? '#6366F1' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
            Browse
          </Text>
        </TouchableOpacity>
      </View>

      {/* Role Filters (Browse tab only) */}
      {activeTab === 'browse' && (
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={roleFilters}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, selectedRole === item && styles.filterChipActive]}
                onPress={() => setSelectedRole(item)}
              >
                <Text style={[styles.filterText, selectedRole === item && styles.filterTextActive]}>
                  {item === 'all' ? 'All' : roleLabels[item as UserRole]}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filtersList}
          />
        </View>
      )}

      {/* Content */}
      {activeTab === 'recommendations' ? (
        <FlatList
          data={recommendations}
          keyExtractor={(item, index) => item.user?.user_id || `rec-${index}`}
          renderItem={({ item }) => (
            <UserCard
              user={item.user as User}
              onPress={() => router.push(`/user/${item.user?.user_id}`)}
              onConnect={() => handleConnect(item.user?.user_id || '')}
              matchScore={item.match_score}
              matchReason={item.match_reason}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
            />
          }
          ListHeaderComponent={
            <View style={styles.aiHeader}>
              <View style={styles.aiIconContainer}>
                <Ionicons name="sparkles" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.aiTitle}>AI-Powered Recommendations</Text>
              <Text style={styles.aiSubtitle}>Based on your profile, skills, and interests</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No recommendations yet</Text>
              <Text style={styles.emptyText}>Complete your profile to get personalized matches</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onPress={() => router.push(`/user/${item.user_id}`)}
              onConnect={() => handleConnect(item.user_id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#6366F1" style={styles.loadingMore} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>Try adjusting your filters</Text>
            </View>
          }
        />
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#6366F120',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#6366F1',
  },
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  filtersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  aiHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
  },
});
