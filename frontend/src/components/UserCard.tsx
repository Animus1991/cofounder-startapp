import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, UserRole } from '../types';
import { Avatar } from './Avatar';
import { RoleBadge } from './RoleBadge';

interface UserCardProps {
  user: User;
  onPress: () => void;
  onConnect?: () => void;
  showConnectButton?: boolean;
  matchScore?: number;
  matchReason?: string;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onPress, 
  onConnect,
  showConnectButton = true,
  matchScore,
  matchReason
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Avatar uri={user.profile_image} name={user.name} size={60} />
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          <RoleBadge role={user.role as UserRole} size="small" />
          {user.headline && (
            <Text style={styles.headline} numberOfLines={2}>{user.headline}</Text>
          )}
        </View>
      </View>

      {/* Match Score */}
      {matchScore !== undefined && (
        <View style={styles.matchSection}>
          <View style={styles.matchBar}>
            <View style={[styles.matchFill, { width: `${matchScore * 100}%` }]} />
          </View>
          <Text style={styles.matchScore}>{Math.round(matchScore * 100)}% match</Text>
        </View>
      )}

      {/* Match Reason */}
      {matchReason && (
        <View style={styles.matchReasonContainer}>
          <Ionicons name="sparkles" size={14} color="#F59E0B" />
          <Text style={styles.matchReason}>{matchReason}</Text>
        </View>
      )}

      {/* Skills/Interests Preview */}
      {(user.skills.length > 0 || user.interests.length > 0) && (
        <View style={styles.tagsContainer}>
          {user.skills.slice(0, 3).map((skill, index) => (
            <View key={`skill-${index}`} style={styles.tag}>
              <Text style={styles.tagText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.connection_count}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.post_count}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        {user.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={styles.location}>{user.location}</Text>
          </View>
        )}
      </View>

      {/* Connect Button */}
      {showConnectButton && onConnect && (
        <TouchableOpacity style={styles.connectButton} onPress={(e) => {
          e.stopPropagation();
          onConnect();
        }}>
          <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  headline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  matchSection: {
    marginBottom: 12,
  },
  matchBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginBottom: 4,
  },
  matchFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  matchScore: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  matchReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchReason: {
    fontSize: 13,
    color: '#F59E0B',
    marginLeft: 6,
    flex: 1,
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
    color: '#9CA3AF',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  stat: {
    marginRight: 20,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  location: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
  },
  connectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
