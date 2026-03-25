import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { User, UserRole, Connection } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { RoleBadge } from '../../src/components/RoleBadge';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { formatNumber, formatDate } from '../../src/utils/helpers';
import api from '../../src/utils/api';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'connected'>('none');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchUser = async () => {
    try {
      const [userResponse, connectionsResponse] = await Promise.all([
        api.get<User>(`/users/${id}`),
        api.get<Connection[]>('/connections'),
      ]);
      
      setUser(userResponse.data);
      
      // Check connection status
      const connection = connectionsResponse.data?.find(
        (c) => c.connected_user_id === id || c.other_user?.user_id === id
      );
      
      if (connection) {
        setConnectionId(connection.connection_id);
        if (connection.status === 'accepted') {
          setConnectionStatus('connected');
        } else if (connection.status === 'pending') {
          setConnectionStatus(connection.is_sender ? 'pending_sent' : 'pending_received');
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleConnect = () => {
    setConnectMessage(`Hi ${user?.name}, I'd like to connect with you!`);
    setConnectModalVisible(true);
  };

  const sendConnectionRequest = async () => {
    try {
      setSending(true);
      await api.post('/intro-requests', {
        to_user_id: id,
        message: connectMessage,
      });
      setConnectionStatus('pending_sent');
      setConnectModalVisible(false);
      Alert.alert('Request Sent', 'Your connection request has been sent!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!connectionId) return;
    try {
      await api.put(`/connections/${connectionId}/accept`);
      setConnectionStatus('connected');
      Alert.alert('Connected', `You are now connected with ${user?.name}!`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept request');
    }
  };

  const handleMessage = async () => {
    try {
      // Create or get existing conversation
      const response = await api.post('/conversations', {
        participant_ids: [id]
      });
      router.push(`/chat/${response.data.conversation_id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorState}>
          <Ionicons name="person-outline" size={64} color="#374151" />
          <Text style={styles.errorTitle}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profile = user.profile || {};
  const role = user.roles?.[0] as UserRole || 'founder';
  const isOwnProfile = currentUser?.user_id === user.user_id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color="#F9FAFB" />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Cover Image */}
          <View style={styles.coverContainer}>
            {profile.cover_image ? (
              <Image source={{ uri: profile.cover_image }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder} />
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileSection}>
            <Avatar uri={profile.profile_image} name={user.name} size={100} />

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

            {/* Action Buttons */}
            {!isOwnProfile && (
              <View style={styles.actionButtons}>
                {connectionStatus === 'none' && (
                  <Button
                    title="Connect"
                    onPress={handleConnect}
                    style={styles.connectButton}
                  />
                )}
                {connectionStatus === 'pending_sent' && (
                  <Button
                    title="Request Sent"
                    variant="outline"
                    disabled
                    onPress={() => {}}
                    style={styles.connectButton}
                  />
                )}
                {connectionStatus === 'pending_received' && (
                  <Button
                    title="Accept Request"
                    onPress={handleAcceptRequest}
                    style={styles.connectButton}
                  />
                )}
                {connectionStatus === 'connected' && (
                  <Button
                    title="Connected"
                    variant="outline"
                    onPress={() => {}}
                    style={styles.connectButton}
                    disabled
                  />
                )}
                <Button
                  title="Message"
                  variant={connectionStatus === 'connected' ? 'primary' : 'outline'}
                  onPress={handleMessage}
                  style={styles.messageButton}
                />
              </View>
            )}
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
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Connect Request Modal */}
      <Modal
        visible={connectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setConnectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setConnectModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Connect</Text>
              <TouchableOpacity onPress={sendConnectionRequest} disabled={sending}>
                <Text style={[styles.modalSend, sending && styles.modalSendDisabled]}>
                  {sending ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalUserInfo}>
                <Avatar uri={user?.profile?.profile_image} name={user?.name || ''} size={60} />
                <Text style={styles.modalUserName}>{user?.name}</Text>
                <Text style={styles.modalUserHeadline}>{user?.profile?.headline}</Text>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Add a personalized message</Text>
                <TextInput
                  style={styles.modalTextArea}
                  value={connectMessage}
                  onChangeText={setConnectMessage}
                  placeholder="Write a brief message..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                  maxLength={300}
                />
                <Text style={styles.charCount}>{connectMessage.length}/300</Text>
              </View>

              <View style={styles.modalTip}>
                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                <Text style={styles.modalTipText}>
                  Personalized messages increase your chance of connecting by 3x!
                </Text>
              </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  profileHeader: {
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  coverContainer: {
    height: 140,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: '#374151',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginTop: -50,
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
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  connectButton: {
    flex: 1,
  },
  messageButton: {
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
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalSafeArea: {
    flex: 1,
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
  modalCancel: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalSend: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  modalSendDisabled: {
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalUserInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginTop: 12,
  },
  modalUserHeadline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  modalFormGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  modalTextArea: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 6,
  },
  modalTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F59E0B10',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  modalTipText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
    lineHeight: 20,
  },
});
