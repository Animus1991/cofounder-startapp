import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import api from '../src/utils/api';
import { useResponsive } from '../src/hooks/useResponsive';

interface StatCard {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  icon: string;
  color: string;
}

interface User {
  user_id: string;
  name: string;
  email: string;
  roles: string[];
  created_at: string;
  profile?: {
    profile_image?: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop, isTablet, isMobile, columns, padding } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'analytics'>('overview');
  const [stats, setStats] = useState<StatCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersRes = await api.get('/users?limit=100');
      const allUsers = usersRes.data || [];
      setUsers(allUsers);

      // Fetch posts for engagement
      const postsRes = await api.get('/posts?limit=50');
      const posts = postsRes.data || [];

      // Fetch connections
      const connectionsRes = await api.get('/connections');
      const connections = connectionsRes.data || [];

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newUsersThisWeek = allUsers.filter((u: any) => 
        new Date(u.created_at) > weekAgo
      ).length;

      const founderCount = allUsers.filter((u: any) => 
        u.roles?.includes('founder')
      ).length;
      
      const investorCount = allUsers.filter((u: any) => 
        u.roles?.includes('investor')
      ).length;
      
      const mentorCount = allUsers.filter((u: any) => 
        u.roles?.includes('mentor')
      ).length;

      setStats([
        {
          id: 'total_users',
          title: 'Total Users',
          value: allUsers.length,
          change: newUsersThisWeek,
          icon: 'people',
          color: '#6366F1',
        },
        {
          id: 'founders',
          title: 'Founders',
          value: founderCount,
          icon: 'rocket',
          color: '#10B981',
        },
        {
          id: 'investors',
          title: 'Investors',
          value: investorCount,
          icon: 'cash',
          color: '#F59E0B',
        },
        {
          id: 'mentors',
          title: 'Mentors',
          value: mentorCount,
          icon: 'school',
          color: '#EC4899',
        },
        {
          id: 'posts',
          title: 'Total Posts',
          value: posts.length,
          icon: 'document-text',
          color: '#8B5CF6',
        },
        {
          id: 'connections',
          title: 'Connections Made',
          value: connections.length,
          icon: 'git-network',
          color: '#06B6D4',
        },
      ]);

      // Recent activity
      setRecentActivity([
        ...allUsers.slice(0, 5).map((u: any) => ({
          type: 'user_joined',
          user: u.name,
          time: u.created_at,
        })),
        ...posts.slice(0, 5).map((p: any) => ({
          type: 'post_created',
          user: p.author?.name || 'Unknown',
          time: p.created_at,
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10));

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderStatCard = (stat: StatCard) => (
    <View key={stat.id} style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
      <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
        <Ionicons name={stat.icon as any} size={24} color={stat.color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
        {stat.change !== undefined && stat.change > 0 && (
          <View style={styles.statChange}>
            <Ionicons name="arrow-up" size={12} color="#10B981" />
            <Text style={styles.statChangeText}>+{stat.change} this week</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderUserRow = (user: User) => (
    <TouchableOpacity
      key={user.user_id}
      style={styles.userRow}
      onPress={() => router.push(`/user/${user.user_id}`)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{user.name.charAt(0)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      <View style={styles.userRoles}>
        {user.roles?.slice(0, 2).map((role, i) => (
          <View key={i} style={styles.roleTag}>
            <Text style={styles.roleTagText}>{role}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.userDate}>{formatTimeAgo(user.created_at)}</Text>
    </TouchableOpacity>
  );

  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        {stats.map(renderStatCard)}
      </View>

      {/* Charts Section */}
      <View style={[styles.chartsRow, isDesktop && styles.chartsRowDesktop]}>
        <View style={[styles.chartCard, isDesktop && styles.chartCardHalf]}>
          <Text style={styles.chartTitle}>User Growth</Text>
          <View style={styles.chartPlaceholder}>
            <Ionicons name="trending-up" size={48} color="#6366F1" />
            <Text style={styles.chartPlaceholderText}>Growth chart coming soon</Text>
          </View>
        </View>
        <View style={[styles.chartCard, isDesktop && styles.chartCardHalf]}>
          <Text style={styles.chartTitle}>Engagement</Text>
          <View style={styles.chartPlaceholder}>
            <Ionicons name="analytics" size={48} color="#10B981" />
            <Text style={styles.chartPlaceholderText}>Engagement metrics</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: activity.type === 'user_joined' ? '#6366F120' : '#10B98120' }
              ]}>
                <Ionicons
                  name={activity.type === 'user_joined' ? 'person-add' : 'document-text'}
                  size={16}
                  color={activity.type === 'user_joined' ? '#6366F1' : '#10B981'}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{activity.user}</Text>
                  {activity.type === 'user_joined' ? ' joined the platform' : ' created a post'}
                </Text>
                <Text style={styles.activityTime}>{formatTimeAgo(activity.time)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderUsers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={18} color="#9CA3AF" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.usersList}>
        {users.map(renderUserRow)}
      </View>
    </View>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'users', label: 'Users', icon: 'people' },
    { id: 'moderation', label: 'Moderation', icon: 'shield' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your platform</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Ionicons
                name={(activeTab === tab.id ? tab.icon : `${tab.icon}-outline`) as any}
                size={18}
                color={activeTab === tab.id ? '#6366F1' : '#9CA3AF'}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading admin data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'moderation' && (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>No Pending Reports</Text>
              <Text style={styles.emptySubtitle}>All content has been reviewed</Text>
            </View>
          )}
          {activeTab === 'analytics' && (
            <View style={styles.emptyState}>
              <Ionicons name="analytics" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>Advanced Analytics</Text>
              <Text style={styles.emptySubtitle}>Coming soon with detailed insights</Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  tabTextActive: {
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
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statsGridDesktop: {
    gap: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardDesktop: {
    width: '31%',
    padding: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
    marginLeft: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statTitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statChangeText: {
    fontSize: 11,
    color: '#10B981',
    marginLeft: 2,
  },
  chartsRow: {
    marginBottom: 24,
  },
  chartsRowDesktop: {
    flexDirection: 'row',
    gap: 16,
  },
  chartCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  chartCardHalf: {
    flex: 1,
    marginBottom: 0,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  activityList: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  activityUser: {
    fontWeight: '600',
    color: '#F9FAFB',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  usersList: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  userEmail: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 1,
  },
  userRoles: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 12,
  },
  roleTag: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  userDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  },
});
