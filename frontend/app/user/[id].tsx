import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { User, Post } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { RoleBadge } from '../../src/components/RoleBadge';
import { PostCard } from '../../src/components/PostCard';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { formatNumber, formatDate } from '../../src/utils/helpers';
import api from '../../src/utils/api';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [connectionModalVisible, setConnectionModalVisible] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const isOwnProfile = currentUser?.user_id === id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          api.get<User>(`/users/${id}`),
          api.get<Post[]>(`/posts?user_id=${id}`),
        ]);
        
        setUser(userResponse.data);
        setPosts(postsResponse.data);

        // Check connection status
        if (!isOwnProfile) {
          try {
            const connectionsResponse = await api.get('/connections');
            const connection = connectionsResponse.data.find(
              (c: any) => c.other_user?.user_id === id
            );
            if (connection) {
              setConnectionStatus(connection.status === 'accepted' ? 'connected' : 'pending');
            }
          } catch (e) {
            // Not authenticated or no connections
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'User not found');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleConnect = async () => {
    setSendingRequest(true);
    try {
      await api.post('/connections/request', {
        target_user_id: id,
        message: connectionMessage || undefined,
      });
      setConnectionStatus('pending');
      setConnectionModalVisible(false);
      setConnectionMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await api.post(`/posts/${postId}/comment`, { content });
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  if (loading || !user) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#F9FAFB" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Cover Image */}
          {user.cover_image ? (
            <Image source={{ uri: user.cover_image }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Avatar uri={user.profile_image} name={user.name} size={100} style={styles.avatar} />
            
            <View style={styles.nameSection}>
              <Text style={styles.name}>{user.name}</Text>
              <RoleBadge role={user.role as any} size="medium" />
            </View>

            {user.headline && (
              <Text style={styles.headline}>{user.headline}</Text>
            )}

            {user.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                <Text style={styles.location}>{user.location}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{formatNumber(user.connection_count)}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{formatNumber(user.post_count)}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <View style={styles.actionButtons}>
                {connectionStatus === 'connected' ? (
                  <>
                    <Button
                      title="Message"
                      onPress={() => router.push(`/chat/${user.user_id}`)}
                      style={styles.messageButton}
                      icon={<Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
                    />
                    <Button
                      title="Connected"
                      onPress={() => {}}
                      variant="outline"
                      style={styles.connectedButton}
                      icon={<Ionicons name="checkmark" size={18} color="#10B981" style={{ marginRight: 8 }} />}
                    />
                  </>
                ) : connectionStatus === 'pending' ? (
                  <Button
                    title="Request Sent"
                    onPress={() => {}}
                    variant="secondary"
                    disabled
                    style={styles.fullButton}
                    icon={<Ionicons name="time-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />}
                  />
                ) : (
                  <Button
                    title="Connect"
                    onPress={() => setConnectionModalVisible(true)}
                    style={styles.fullButton}
                    icon={<Ionicons name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Bio Section */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Looking For */}
        {user.looking_for && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <View style={styles.lookingForCard}>
              <Ionicons name="search" size={20} color="#6366F1" />
              <Text style={styles.lookingForText}>{user.looking_for}</Text>
            </View>
          </View>
        )}

        {/* Skills */}
        {user.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.tagsContainer}>
              {user.skills.map((skill, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interests */}
        {user.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.tagsContainer}>
              {user.interests.map((interest, index) => (
                <View key={index} style={[styles.tag, styles.interestTag]}>
                  <Text style={[styles.tagText, styles.interestTagText]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.post_id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onUserPress={() => {}}
                onPostPress={(postId) => router.push(`/post/${postId}`)}
              />
            ))
          ) : (
            <View style={styles.noPostsContainer}>
              <Ionicons name="document-text-outline" size={48} color="#374151" />
              <Text style={styles.noPostsText}>No posts yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Connection Request Modal */}
      <Modal
        visible={connectionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setConnectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Connect with {user.name}</Text>
            <Text style={styles.modalSubtitle}>
              Add a personalized message to increase your chances of connecting
            </Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Hi! I'd love to connect because..."
              placeholderTextColor="#6B7280"
              value={connectionMessage}
              onChangeText={setConnectionMessage}
              multiline
              numberOfLines={4}
              maxLength={300}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setConnectionModalVisible(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Send Request"
                onPress={handleConnect}
                loading={sendingRequest}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  moreButton: {
    padding: 4,
  },
  profileHeader: {
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: 140,
  },
  coverPlaceholder: {
    height: 140,
    backgroundColor: '#374151',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginTop: -50,
  },
  avatar: {
    borderWidth: 4,
    borderColor: '#1F2937',
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  headline: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  location: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  messageButton: {
    flex: 1,
  },
  connectedButton: {
    flex: 1,
    borderColor: '#10B981',
  },
  fullButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 24,
  },
  lookingForCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  lookingForText: {
    flex: 1,
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#6366F120',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  interestTag: {
    backgroundColor: '#10B98120',
  },
  interestTagText: {
    color: '#10B981',
  },
  noPostsContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1F2937',
    borderRadius: 16,
  },
  noPostsText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  messageInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#F9FAFB',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
