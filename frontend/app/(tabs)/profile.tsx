import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/Avatar';
import { RoleBadge } from '../../src/components/RoleBadge';
import { Button } from '../../src/components/Button';
import { formatNumber, formatDate } from '../../src/utils/helpers';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const [imageLoading, setImageLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageLoading(true);
      try {
        await updateProfile({ cover_image: `data:image/jpeg;base64,${result.assets[0].base64}` });
      } finally {
        setImageLoading(false);
      }
    }
  };

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageLoading(true);
      try {
        await updateProfile({ profile_image: `data:image/jpeg;base64,${result.assets[0].base64}` });
      } finally {
        setImageLoading(false);
      }
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {/* Cover Image */}
          <TouchableOpacity onPress={pickCoverImage} style={styles.coverContainer}>
            {user.cover_image ? (
              <Image 
                source={{ uri: user.cover_image }} 
                style={styles.coverImage} 
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={32} color="#6B7280" />
                <Text style={styles.coverPlaceholderText}>Add cover photo</Text>
              </View>
            )}
            <View style={styles.coverEditBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Profile Info */}
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={pickProfileImage} style={styles.avatarContainer}>
              <Avatar uri={user.profile_image} name={user.name} size={100} />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

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

            <Button
              title="Edit Profile"
              onPress={() => router.push('/(auth)/onboarding')}
              variant="outline"
              style={styles.editButton}
            />
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

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>
          <View style={styles.linksContainer}>
            {user.linkedin_url && (
              <TouchableOpacity style={styles.linkButton}>
                <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                <Text style={styles.linkText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
            {user.website && (
              <TouchableOpacity style={styles.linkButton}>
                <Ionicons name="globe-outline" size={20} color="#6366F1" />
                <Text style={styles.linkText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountInfo}>
            <View style={styles.accountRow}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={styles.accountText}>{user.email}</Text>
            </View>
            <View style={styles.accountRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.accountText}>Joined {formatDate(user.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  coverContainer: {
    height: 140,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  coverEditBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#6366F1',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginTop: -50,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
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
  editButton: {
    marginTop: 20,
    width: '100%',
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
  linksContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  accountInfo: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  logoutSection: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
