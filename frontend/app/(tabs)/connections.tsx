import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Connection, User } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { RoleBadge } from '../../src/components/RoleBadge';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { formatRelativeTime } from '../../src/utils/helpers';
import api from '../../src/utils/api';

export default function ConnectionsScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConnections = async () => {
    try {
      const response = await api.get<Connection[]>('/connections');
      const accepted = response.data.filter(c => c.status === 'accepted');
      const pending = response.data.filter(c => c.status === 'pending' && !c.is_sender);
      setConnections(accepted);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConnections();
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await api.put(`/connections/${connectionId}/accept`);
      fetchConnections();
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await api.put(`/connections/${connectionId}/reject`);
      fetchConnections();
    } catch (error) {
      console.error('Error rejecting connection:', error);
    }
  };

  const handleRemove = (connection: Connection) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove ${connection.other_user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/connections/${connection.connection_id}`);
              fetchConnections();
            } catch (error) {
              console.error('Error removing connection:', error);
            }
          },
        },
      ]
    );
  };

  const renderConnectionItem = ({ item }: { item: Connection }) => {
    const otherUser = item.other_user;
    if (!otherUser) return null;

    return (
      <TouchableOpacity 
        style={styles.connectionCard}
        onPress={() => router.push(`/user/${otherUser.user_id}`)}
      >
        <Avatar uri={otherUser.profile_image} name={otherUser.name} size={56} />
        <View style={styles.connectionInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.connectionName}>{otherUser.name}</Text>
            <RoleBadge role={otherUser.role as any} size="small" />
          </View>
          {otherUser.headline && (
            <Text style={styles.connectionHeadline} numberOfLines={1}>
              {otherUser.headline}
            </Text>
          )}
          <Text style={styles.connectionDate}>
            Connected {formatRelativeTime(item.created_at)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/chat/${otherUser.user_id}`);
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemove(item);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRequestItem = ({ item }: { item: Connection }) => {
    const otherUser = item.other_user;
    if (!otherUser) return null;

    return (
      <View style={styles.requestCard}>
        <TouchableOpacity 
          style={styles.requestHeader}
          onPress={() => router.push(`/user/${otherUser.user_id}`)}
        >
          <Avatar uri={otherUser.profile_image} name={otherUser.name} size={56} />
          <View style={styles.requestInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.connectionName}>{otherUser.name}</Text>
              <RoleBadge role={otherUser.role as any} size="small" />
            </View>
            {otherUser.headline && (
              <Text style={styles.connectionHeadline} numberOfLines={2}>
                {otherUser.headline}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleReject(item.connection_id)}
          >
            <Ionicons name="close" size={20} color="#EF4444" />
            <Text style={styles.rejectText}>Ignore</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAccept(item.connection_id)}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading your network..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Network</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{connections.length} connections</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.tabActive]}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[styles.tabText, activeTab === 'connections' && styles.tabTextActive]}>
            Connections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Requests
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'connections' ? (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.connection_id}
          renderItem={renderConnectionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No connections yet</Text>
              <Text style={styles.emptyText}>Start networking by discovering people</Text>
              <Button
                title="Discover People"
                onPress={() => router.push('/(tabs)/discover')}
                style={styles.emptyButton}
              />
            </View>
          }
        />
      ) : (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.connection_id}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptyText}>Connection requests will appear here</Text>
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
  headerStats: {
    marginTop: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#6366F1',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  connectionHeadline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  connectionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    padding: 10,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  moreButton: {
    padding: 10,
  },
  requestCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  messageContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  messageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#374151',
    borderRadius: 12,
    gap: 6,
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    gap: 6,
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
});
