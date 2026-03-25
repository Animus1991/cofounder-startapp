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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import api from '../src/utils/api';
import { useResponsive } from '../src/hooks/useResponsive';

interface Community {
  group_id: string;
  name: string;
  description: string;
  rules?: string;
  is_private: boolean;
  tags: string[];
  cover_image?: string;
  creator_id: string;
  moderators: string[];
  members_count: number;
  created_at: string;
  is_member?: boolean;
}

interface Post {
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author?: {
    name: string;
    profile_image?: string;
  };
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'tech', label: 'Tech', icon: 'code-slash' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'startup', label: 'Startups', icon: 'rocket' },
  { id: 'finance', label: 'Finance', icon: 'cash' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { id: 'design', label: 'Design', icon: 'color-palette' },
];

export default function CommunitiesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop, isTablet, padding } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [creating, setCreating] = useState(false);
  
  // New community form
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    is_private: false,
  });

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      setCommunities(response.data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchCommunityPosts = async (communityId: string) => {
    try {
      const response = await api.get(`/posts?group_id=${communityId}&limit=20`);
      setPosts(response.data || []);
    } catch (error) {
      // Fallback to all posts if group filtering not supported
      const response = await api.get('/posts?limit=10');
      setPosts(response.data || []);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  useEffect(() => {
    if (selectedCommunity) {
      fetchCommunityPosts(selectedCommunity.group_id);
    }
  }, [selectedCommunity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunities();
  };

  const handleJoinCommunity = async (community: Community) => {
    try {
      await api.post(`/groups/${community.group_id}/join`);
      setCommunities(prev => 
        prev.map(c => 
          c.group_id === community.group_id 
            ? { ...c, is_member: true, members_count: c.members_count + 1 }
            : c
        )
      );
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim()) return;
    
    try {
      setCreating(true);
      await api.post('/groups', {
        name: newCommunity.name,
        description: newCommunity.description,
        tags: newCommunity.tags,
        is_private: newCommunity.is_private,
      });
      setShowCreateModal(false);
      setNewCommunity({ name: '', description: '', tags: [], is_private: false });
      fetchCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedCommunity) return;
    
    try {
      await api.post('/posts', {
        content: newPostContent,
        group_id: selectedCommunity.group_id,
        tags: [],
      });
      setNewPostContent('');
      fetchCommunityPosts(selectedCommunity.group_id);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const filteredCommunities = communities.filter(c => {
    const matchesCategory = selectedCategory === 'all' || 
      c.tags.some(t => t.toLowerCase().includes(selectedCategory));
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const renderCommunityCard = (community: Community) => (
    <TouchableOpacity
      key={community.group_id}
      style={[styles.communityCard, isDesktop && styles.communityCardDesktop]}
      onPress={() => setSelectedCommunity(community)}
    >
      <View style={[
        styles.communityCover,
        { backgroundColor: `hsl(${community.name.charCodeAt(0) * 5}, 60%, 40%)` }
      ]}>
        <Ionicons name="people" size={32} color="#FFFFFF" />
      </View>
      <View style={styles.communityContent}>
        <View style={styles.communityHeader}>
          <Text style={styles.communityName} numberOfLines={1}>{community.name}</Text>
          {community.is_private && (
            <Ionicons name="lock-closed" size={14} color="#6B7280" />
          )}
        </View>
        <Text style={styles.communityDescription} numberOfLines={2}>
          {community.description}
        </Text>
        <View style={styles.communityMeta}>
          <View style={styles.memberCount}>
            <Ionicons name="people-outline" size={14} color="#9CA3AF" />
            <Text style={styles.memberCountText}>{community.members_count} members</Text>
          </View>
          {community.tags.slice(0, 2).map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[
            styles.joinButton,
            community.is_member && styles.joinedButton
          ]}
          onPress={() => !community.is_member && handleJoinCommunity(community)}
        >
          <Text style={[
            styles.joinButtonText,
            community.is_member && styles.joinedButtonText
          ]}>
            {community.is_member ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCommunityDetail = () => {
    if (!selectedCommunity) return null;

    return (
      <Modal
        visible={!!selectedCommunity}
        animationType="slide"
        onRequestClose={() => setSelectedCommunity(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedCommunity(null)}>
              <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{selectedCommunity.name}</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="#F9FAFB" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailContent}>
            {/* Community Info */}
            <View style={styles.detailInfo}>
              <View style={[
                styles.detailCover,
                { backgroundColor: `hsl(${selectedCommunity.name.charCodeAt(0) * 5}, 60%, 40%)` }
              ]}>
                <Ionicons name="people" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.detailDescription}>{selectedCommunity.description}</Text>
              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatValue}>{selectedCommunity.members_count}</Text>
                  <Text style={styles.detailStatLabel}>Members</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatValue}>{posts.length}</Text>
                  <Text style={styles.detailStatLabel}>Posts</Text>
                </View>
              </View>
            </View>

            {/* New Post */}
            {selectedCommunity.is_member && (
              <View style={styles.newPostSection}>
                <TextInput
                  style={styles.newPostInput}
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  placeholder="Share something with the community..."
                  placeholderTextColor="#6B7280"
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.postButton,
                    !newPostContent.trim() && styles.postButtonDisabled
                  ]}
                  onPress={handleCreatePost}
                  disabled={!newPostContent.trim()}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Posts */}
            <View style={styles.postsSection}>
              <Text style={styles.sectionTitle}>Recent Discussions</Text>
              {posts.length === 0 ? (
                <View style={styles.emptyPosts}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#4B5563" />
                  <Text style={styles.emptyPostsText}>No posts yet. Be the first!</Text>
                </View>
              ) : (
                posts.map((post) => (
                  <View key={post.post_id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.postAvatar}>
                        <Text style={styles.postAvatarText}>
                          {post.author?.name?.charAt(0) || 'U'}
                        </Text>
                      </View>
                      <View style={styles.postInfo}>
                        <Text style={styles.postAuthor}>{post.author?.name || 'Anonymous'}</Text>
                        <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={styles.postContent}>{post.content}</Text>
                    <View style={styles.postActions}>
                      <TouchableOpacity style={styles.postAction}>
                        <Ionicons name="heart-outline" size={18} color="#9CA3AF" />
                        <Text style={styles.postActionText}>{post.likes_count}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.postAction}>
                        <Ionicons name="chatbubble-outline" size={18} color="#9CA3AF" />
                        <Text style={styles.postActionText}>{post.comments_count}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Communities</Text>
            <Text style={styles.headerSubtitle}>{communities.length} communities</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          {isDesktop && <Text style={styles.createButtonText}>Create</Text>}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchTextInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search communities..."
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.id ? '#FFFFFF' : '#9CA3AF'}
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.id && styles.categoryChipTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Communities List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            isDesktop && styles.contentContainerDesktop
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
        >
          <View style={[
            styles.communitiesGrid,
            isDesktop && styles.communitiesGridDesktop
          ]}>
            {filteredCommunities.map(renderCommunityCard)}
          </View>
          
          {filteredCommunities.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>No communities found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or create one</Text>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Community Detail Modal */}
      {renderCommunityDetail()}

      {/* Create Community Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.createModalContent}>
            <View style={styles.createModalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.createModalTitle}>New Community</Text>
              <TouchableOpacity onPress={handleCreateCommunity} disabled={creating}>
                <Text style={[
                  styles.createText,
                  (!newCommunity.name.trim() || creating) && styles.createTextDisabled
                ]}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.createForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Community Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCommunity.name}
                  onChangeText={(text) => setNewCommunity({ ...newCommunity, name: text })}
                  placeholder="e.g., SaaS Founders"
                  placeholderTextColor="#6B7280"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={newCommunity.description}
                  onChangeText={(text) => setNewCommunity({ ...newCommunity, description: text })}
                  placeholder="What is this community about?"
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Privacy</Text>
                <View style={styles.privacyOptions}>
                  <TouchableOpacity
                    style={[
                      styles.privacyOption,
                      !newCommunity.is_private && styles.privacyOptionActive
                    ]}
                    onPress={() => setNewCommunity({ ...newCommunity, is_private: false })}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={20}
                      color={!newCommunity.is_private ? '#6366F1' : '#6B7280'}
                    />
                    <Text style={[
                      styles.privacyOptionText,
                      !newCommunity.is_private && styles.privacyOptionTextActive
                    ]}>Public</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.privacyOption,
                      newCommunity.is_private && styles.privacyOptionActive
                    ]}
                    onPress={() => setNewCommunity({ ...newCommunity, is_private: true })}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={newCommunity.is_private ? '#6366F1' : '#6B7280'}
                    />
                    <Text style={[
                      styles.privacyOptionText,
                      newCommunity.is_private && styles.privacyOptionTextActive
                    ]}>Private</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
  headerDesktop: {
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#F9FAFB',
  },
  categoriesContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
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
  communitiesGrid: {
    gap: 16,
  },
  communitiesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  communityCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  communityCardDesktop: {
    width: '31%',
    marginRight: '2%',
  },
  communityCover: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityContent: {
    padding: 16,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  communityName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  communityDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tag: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  joinButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: '#374151',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinedButtonText: {
    color: '#9CA3AF',
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
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  detailContent: {
    flex: 1,
  },
  detailInfo: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  detailCover: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 15,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 40,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  detailStatLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  newPostSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  newPostInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F9FAFB',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  postButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#374151',
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPostsText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  postCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postInfo: {
    marginLeft: 10,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  postContent: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  // Create Modal
  createModalContent: {
    flex: 1,
  },
  createModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  cancelText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  createTextDisabled: {
    color: '#6B7280',
  },
  createForm: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#374151',
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 8,
  },
  privacyOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F115',
  },
  privacyOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  privacyOptionTextActive: {
    color: '#6366F1',
  },
});
