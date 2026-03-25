import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/Avatar';
import { RoleBadge } from '../../src/components/RoleBadge';
import { UserRole, roleLabels, roleColors } from '../../src/types';
import api from '../../src/utils/api';

// Role-specific dashboard imports
import FounderDashboard from '../../src/components/dashboards/FounderDashboard';
import InvestorDashboard from '../../src/components/dashboards/InvestorDashboard';
import MentorDashboard from '../../src/components/dashboards/MentorDashboard';
import TalentDashboard from '../../src/components/dashboards/TalentDashboard';
import ServiceProviderDashboard from '../../src/components/dashboards/ServiceProviderDashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Set initial active role
  useEffect(() => {
    if (user?.roles && user.roles.length > 0 && !activeRole) {
      setActiveRole(user.roles[0] as UserRole);
    }
  }, [user]);

  // Fetch dashboard data based on role
  const fetchDashboardData = useCallback(async () => {
    if (!activeRole) return;
    
    try {
      setLoading(true);
      const data: any = {};

      // Fetch role-specific data
      switch (activeRole) {
        case 'founder':
          const [opportunities, connections, posts] = await Promise.all([
            api.get('/opportunities?status=open&limit=5'),
            api.get('/connections'),
            api.get('/posts?limit=3')
          ]);
          data.opportunities = opportunities.data;
          data.connections = connections.data;
          data.posts = posts.data;
          data.stats = {
            connections: connections.data?.length || 0,
            opportunities: opportunities.data?.length || 0,
            posts: posts.data?.length || 0
          };
          break;

        case 'investor':
          const [pipeline, watchlists, startups] = await Promise.all([
            api.get('/investor/pipeline'),
            api.get('/investor/watchlists'),
            api.get('/users?role=founder&limit=10')
          ]);
          data.pipeline = pipeline.data;
          data.watchlists = watchlists.data;
          data.startups = startups.data;
          data.stats = {
            pipeline: pipeline.data?.length || 0,
            watchlists: watchlists.data?.length || 0,
            dealsSourcing: startups.data?.length || 0
          };
          break;

        case 'mentor':
          const [sessions, mentees, courses] = await Promise.all([
            api.get('/mentor-sessions'),
            api.get('/connections'),
            api.get('/courses?limit=5')
          ]);
          data.sessions = sessions.data;
          data.mentees = mentees.data;
          data.courses = courses.data;
          data.stats = {
            totalSessions: user?.mentor_info?.total_sessions || 0,
            rating: user?.mentor_info?.avg_rating || 0,
            activeMentees: mentees.data?.length || 0
          };
          break;

        case 'talent':
          const [jobs, applications, recommendations] = await Promise.all([
            api.get('/opportunities?status=open&limit=10'),
            api.get('/opportunities'),
            api.get('/recommendations')
          ]);
          data.jobs = jobs.data;
          data.applications = applications.data;
          data.recommendations = recommendations.data;
          data.stats = {
            matchingJobs: jobs.data?.length || 0,
            applications: 0,
            profileViews: Math.floor(Math.random() * 100) + 20
          };
          break;

        case 'service_provider':
          const [clients, services, reviews] = await Promise.all([
            api.get('/connections'),
            api.get('/marketplace/tools'),
            api.get('/posts?limit=5')
          ]);
          data.clients = clients.data;
          data.services = services.data;
          data.reviews = reviews.data;
          data.stats = {
            activeClients: clients.data?.length || 0,
            services: services.data?.length || 0,
            rating: 4.8
          };
          break;

        default:
          // Generic dashboard data
          const [genPosts, genConnections] = await Promise.all([
            api.get('/posts?limit=5'),
            api.get('/connections')
          ]);
          data.posts = genPosts.data;
          data.connections = genConnections.data;
          break;
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setShowRoleSwitcher(false);
    setDashboardData(null);
  };

  const renderRoleDashboard = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      );
    }

    switch (activeRole) {
      case 'founder':
        return <FounderDashboard data={dashboardData} user={user} />;
      case 'investor':
        return <InvestorDashboard data={dashboardData} user={user} />;
      case 'mentor':
        return <MentorDashboard data={dashboardData} user={user} />;
      case 'talent':
        return <TalentDashboard data={dashboardData} user={user} />;
      case 'service_provider':
        return <ServiceProviderDashboard data={dashboardData} user={user} />;
      default:
        return <FounderDashboard data={dashboardData} user={user} />;
    }
  };

  if (!user) return null;

  const userRoles = (user.roles || ['founder']) as UserRole[];
  const hasMultipleRoles = userRoles.length > 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar uri={user.profile?.profile_image} name={user.name} size={44} />
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name.split(' ')[0]}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#F9FAFB" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Switcher */}
      {hasMultipleRoles && (
        <TouchableOpacity 
          style={styles.roleSwitcher}
          onPress={() => setShowRoleSwitcher(!showRoleSwitcher)}
        >
          <View style={styles.activeRoleContainer}>
            <View style={[styles.roleIndicator, { backgroundColor: roleColors[activeRole || 'founder'] }]} />
            <Text style={styles.activeRoleText}>
              {roleLabels[activeRole || 'founder']} Dashboard
            </Text>
          </View>
          <Ionicons 
            name={showRoleSwitcher ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>
      )}

      {/* Role Dropdown */}
      {showRoleSwitcher && (
        <View style={styles.roleDropdown}>
          {userRoles.map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleOption,
                activeRole === role && styles.roleOptionActive
              ]}
              onPress={() => handleRoleSwitch(role)}
            >
              <View style={[styles.roleIndicator, { backgroundColor: roleColors[role] }]} />
              <Text style={[
                styles.roleOptionText,
                activeRole === role && styles.roleOptionTextActive
              ]}>
                {roleLabels[role]}
              </Text>
              {activeRole === role && (
                <Ionicons name="checkmark" size={20} color="#6366F1" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Dashboard Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
      >
        {renderRoleDashboard()}
        <View style={{ height: 100 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  roleSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
  },
  activeRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  activeRoleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  roleDropdown: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  roleOptionActive: {
    backgroundColor: '#374151',
  },
  roleOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
  },
  roleOptionTextActive: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9CA3AF',
  },
});
