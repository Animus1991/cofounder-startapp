import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Modal, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { Post } from '../../src/types';
import { PostCard } from '../../src/components/PostCard';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import api from '../../src/utils/api';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostTags, setNewPostTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await api.get<Post[]>('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/react`, { type: 'like' });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await api.post(`/posts/${postId}/comments`, { content });
      fetchPosts();
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewPostImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    setSubmitting(true);
    try {
      const tags = newPostTags.split(',').map(t => t.trim()).filter(t => t);
      const media = newPostImage ? [newPostImage] : [];
      await api.post('/posts', {
        content: newPostContent,
        media,
        tags,
        visibility: 'public'
      });
      setNewPostContent('');
      setNewPostImage(null);
      setNewPostTags('');
      setCreateModalVisible(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading feed..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CoFounderBay</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#F9FAFB" />
        </TouchableOpacity>
      </View>

      {/* Create Post Card */}
      <TouchableOpacity 
        style={styles.createPostCard}
        onPress={() => setCreateModalVisible(true)}
      >
        <Avatar uri={user?.profile?.profile_image} name={user?.name || ''} size={40} />
        <View style={styles.createPostInput}>
          <Text style={styles.createPostPlaceholder}>Share an update or idea...</Text>
        </View>
        <Ionicons name="create-outline" size={24} color="#6366F1" />
      </TouchableOpacity>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.post_id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onUserPress={(userId) => router.push(`/user/${userId}`)}
            onPostPress={(postId) => router.push(`/post/${postId}`)}
          />
        )}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to share something!</Text>
            <Button
              title="Create Post"
              onPress={() => setCreateModalVisible(true)}
              style={styles.emptyButton}
            />
          </View>
        }
      />

      {/* Create Post Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={28} color="#F9FAFB" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity 
                onPress={handleCreatePost}
                disabled={!newPostContent.trim() || submitting}
              >
                <Text style={[
                  styles.postButton,
                  (!newPostContent.trim() || submitting) && styles.postButtonDisabled
                ]}>
                  {submitting ? 'Posting...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.authorRow}>
                <Avatar uri={user?.profile?.profile_image} name={user?.name || ''} size={48} />
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{user?.name}</Text>
                  <Text style={styles.authorRole}>{user?.profile?.headline || user?.roles?.[0]}</Text>
                </View>
              </View>

              <TextInput
                style={styles.contentInput}
                placeholder="What's on your mind? Share an update, ask for advice, or celebrate a win..."
                placeholderTextColor="#6B7280"
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                autoFocus
              />

              {newPostImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: newPostImage }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setNewPostImage(null)}
                  >
                    <Ionicons name="close-circle" size={28} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              <TextInput
                style={styles.tagsInput}
                placeholder="Add tags (comma separated): startup, funding, advice..."
                placeholderTextColor="#6B7280"
                value={newPostTags}
                onChangeText={setNewPostTags}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#6366F1" />
                <Text style={styles.attachText}>Photo</Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  notificationButton: {
    padding: 8,
  },
  createPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    margin: 16,
    padding: 12,
    borderRadius: 16,
  },
  createPostInput: {
    flex: 1,
    marginHorizontal: 12,
  },
  createPostPlaceholder: {
    color: '#6B7280',
    fontSize: 15,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  postButtonDisabled: {
    color: '#4B5563',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  authorRole: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  contentInput: {
    fontSize: 18,
    color: '#F9FAFB',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tagsInput: {
    marginTop: 16,
    fontSize: 14,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937',
    borderRadius: 20,
  },
  attachText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
