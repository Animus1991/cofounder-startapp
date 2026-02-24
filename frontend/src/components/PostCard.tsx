import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post, UserRole } from '../types';
import { Avatar } from './Avatar';
import { RoleBadge } from './RoleBadge';
import { formatRelativeTime, formatNumber } from '../utils/helpers';
import api from '../utils/api';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onUserPress: (userId: string) => void;
  onPostPress: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onComment, 
  onUserPress,
  onPostPress 
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleLike = async () => {
    try {
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
      onLike(post.post_id);
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    }
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(post.post_id, commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => onUserPress(post.user_id)}>
        <Avatar uri={post.user_image} name={post.user_name} size={48} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{post.user_name}</Text>
            <RoleBadge role={post.user_role as UserRole} size="small" />
          </View>
          {post.user_headline && (
            <Text style={styles.headline} numberOfLines={1}>{post.user_headline}</Text>
          )}
          <Text style={styles.time}>{formatRelativeTime(post.created_at)}</Text>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <TouchableOpacity onPress={() => onPostPress(post.post_id)}>
        <Text style={styles.content}>{post.content}</Text>
        {post.image && (
          <Image 
            source={{ uri: post.image.startsWith('data:') ? post.image : `data:image/jpeg;base64,${post.image}` }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

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
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {formatNumber(likesCount)} likes · {formatNumber(post.comments_count)} comments
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={22} 
            color={isLiked ? '#EF4444' : '#9CA3AF'} 
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowCommentInput(!showCommentInput)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#9CA3AF" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comment Input */}
      {showCommentInput && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#6B7280"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleComment}>
            <Ionicons name="send" size={20} color="#6366F1" />
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Comments */}
      {post.comments.length > 0 && (
        <View style={styles.commentsSection}>
          {post.comments.slice(0, 2).map((comment) => (
            <View key={comment.comment_id} style={styles.comment}>
              <Avatar uri={comment.user_image} name={comment.user_name} size={32} />
              <View style={styles.commentContent}>
                <Text style={styles.commentAuthor}>{comment.user_name}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
            </View>
          ))}
          {post.comments_count > 2 && (
            <TouchableOpacity onPress={() => onPostPress(post.post_id)}>
              <Text style={styles.viewMoreComments}>View all {post.comments_count} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  headline: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  stats: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  likedText: {
    color: '#EF4444',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#374151',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  commentInput: {
    flex: 1,
    color: '#F9FAFB',
    paddingVertical: 12,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
  },
  commentsSection: {
    marginTop: 12,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 10,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  viewMoreComments: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
});
