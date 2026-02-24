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
import { UserRole } from '../../src/types';
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

  const profile = user.profile || {};
  const role = user.roles?.[0] as UserRole || 'founder';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {/* Cover Image */}
          <TouchableOpacity onPress={pickCoverImage} style={styles.coverContainer}>
            {profile.cover_image ? (
              <Image 
                source={{ uri: profile.cover_image }} 
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
              <Avatar uri={profile.profile_image} name={user.name} size={100} />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.nameSection}>
              <Text style={styles.name}>{user.name}</Text>
              <RoleBadge role={role} size="medium" />
            </View>

            {profile.headline && (
              <Text style={styles.headline}>{profile.headline}</Text>
            )}

            {profile.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                <Text style={styles.location}>{profile.location}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{formatNumber(user.connection_count || 0)}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{formatNumber(user.post_count || 0)}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.trust_score || 0}</Text>
                <Text style={styles.statLabel}>Trust Score</Text>
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
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Looking For */}
        {profile.looking_for && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <View style={styles.lookingForCard}>
              <Ionicons name="search" size={20} color="#6366F1" />
              <Text style={styles.lookingForText}>{profile.looking_for}</Text>
            </View>
          </View>
        )}

        {/* Intent Cards */}
        {user.intent_cards && user.intent_cards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intent Cards</Text>
            {user.intent_cards.map((card, index) => (
              <View key={card.intent_id || index} style={styles.intentCard}>
                <View style={[styles.intentBadge, { backgroundColor: card.type === 'looking_for' ? '#6366F120' : '#10B98120' }]}>
                  <Text style={[styles.intentBadgeText, { color: card.type === 'looking_for' ? '#6366F1' : '#10B981' }]}>
                    {card.type === 'looking_for' ? 'Looking For' : 'Offering'}
                  </Text>
                </View>
                <Text style={styles.intentTitle}>{card.title}</Text>
                <Text style={styles.intentDescription}>{card.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.tagsContainer}>
              {profile.skills.map((skill, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.tagsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={[styles.tag, styles.interestTag]}>
                  <Text style={[styles.tagText, styles.interestTagText]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sectors */}
        {profile.sectors && profile.sectors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sectors</Text>
            <View style={styles.tagsContainer}>
              {profile.sectors.map((sector, index) => (
                <View key={index} style={[styles.tag, styles.sectorTag]}>
                  <Text style={[styles.tagText, styles.sectorTagText]}>{sector}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>
          <View style={styles.linksContainer}>
            {profile.linkedin_url && (
              <TouchableOpacity style={styles.linkButton}>
                <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                <Text style={styles.linkText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
            {profile.website && (
              <TouchableOpacity style={styles.linkButton}>
                <Ionicons name="globe-outline" size={20} color="#6366F1" />
                <Text style={styles.linkText}>Website</Text>
              </TouchableOpacity>
            )}
            {profile.twitter_url && (
              <TouchableOpacity style={styles.linkButton}>
                <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                <Text style={styles.linkText}>Twitter</Text>
              </TouchableOpacity>
            )}
            {profile.github_url && (
              <TouchableOpacity style={styles.linkButton}>
                <Ionicons name="logo-github" size={20} color="#F9FAFB" />
                <Text style={styles.linkText}>GitHub</Text>
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
            <View style={styles.accountRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
              <Text style={styles.accountText}>Verification: {profile.verification_status || 'unverified'}</Text>
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
    paddingHorizontal: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statLabel: {
    fontSize: 12,
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
  intentCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  intentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  intentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  intentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  intentDescription: {
    fontSize: 14,
    color: '#9CA3AF',
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
  sectorTag: {
    backgroundColor: '#F59E0B20',
  },
  sectorTagText: {
    color: '#F59E0B',
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
