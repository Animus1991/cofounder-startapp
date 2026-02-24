import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Post, Comment } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { RoleBadge } from '../../src/components/RoleBadge';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { formatRelativeTime } from '../../src/utils/helpers';
import api from '../../src/utils/api';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get<Post>(`/posts/${id}`);
        setPost(response.data);
        setIsLiked(response.data.is_liked);
        setLikesCount(response.data.likes_count);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      await api.post(`/posts/${id}/like`);
    } catch (error) {
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await api.post<Comment>(`/posts/${id}/comment`, {
        content: commentText.trim(),
      });
      
      if (post) {
        setPost({
          ...post,
          comments: [...post.comments, response.data],
          comments_count: post.comments_count + 1,
        });
      }
      setCommentText('');
    } catch (error) {
      console.error('Error commenting:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !post) {
    return <LoadingScreen message="Loading post..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Post Content */}
        <View style={styles.postContainer}>
          {/* Author */}
          <TouchableOpacity 
            style={styles.authorRow}
            onPress={() => router.push(`/user/${post.user_id}`)}
          >
            <Avatar uri={post.user_image} name={post.user_name} size={48} />
            <View style={styles.authorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{post.user_name}</Text>
                <RoleBadge role={post.user_role as any} size="small" />
              </View>
              {post.user_headline && (
                <Text style={styles.authorHeadline} numberOfLines={1}>{post.user_headline}</Text>
              )}
              <Text style={styles.postTime}>{formatRelativeTime(post.created_at)}</Text>
            </View>
          </TouchableOpacity>

          {/* Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {likesCount} likes · {post.comments_count} comments
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={isLiked ? 'heart' : 'heart-outline'} 
                size={22} 
                color={isLiked ? '#EF4444' : '#9CA3AF'} 
              />
              <Text style={[styles.actionText, isLiked && styles.likedText]}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color="#9CA3AF" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({post.comments.length})</Text>
          
          {post.comments.map((comment) => (
            <View key={comment.comment_id} style={styles.commentCard}>
              <TouchableOpacity onPress={() => router.push(`/user/${comment.user_id}`)}>
                <Avatar uri={comment.user_image} name={comment.user_name} size={40} />
              </TouchableOpacity>
              <View style={styles.commentContent}>
                <TouchableOpacity onPress={() => router.push(`/user/${comment.user_id}`)}>
                  <Text style={styles.commentAuthor}>{comment.user_name}</Text>
                </TouchableOpacity>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>{formatRelativeTime(comment.created_at)}</Text>
              </View>
            </View>
          ))}

          {post.comments.length === 0 && (
            <View style={styles.noCommentsContainer}>
              <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <Avatar uri={currentUser?.profile_image} name={currentUser?.name || ''} size={40} />
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            placeholderTextColor="#6B7280"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!commentText.trim() || submitting) && styles.sendButtonDisabled
          ]} 
          onPress={handleComment}
          disabled={!commentText.trim() || submitting}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={commentText.trim() && !submitting ? '#FFFFFF' : '#6B7280'} 
          />
        </TouchableOpacity>
      </View>
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  authorHeadline: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6366F1',
  },
  statsRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  likedText: {
    color: '#EF4444',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  commentCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 12,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  noCommentsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    backgroundColor: '#111827',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    color: '#F9FAFB',
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
  },
});
