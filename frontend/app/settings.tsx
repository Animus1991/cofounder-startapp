import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Avatar } from '../src/components/Avatar';
import api from '../src/utils/api';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  type: 'toggle' | 'navigate' | 'action' | 'link';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  
  // Settings state
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    connections: true,
    messages: true,
    opportunities: true,
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showLocation: true,
  });
  
  // Edit profile form
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    headline: user?.profile?.headline || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Account deletion will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const response = await api.patch('/users/me', {
        name: editForm.name,
        profile: {
          headline: editForm.headline,
          bio: editForm.bio,
          location: editForm.location,
        },
      });
      
      if (response.data) {
        setUser(response.data);
        setEditProfileModal(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (passwordForm.new.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      setSavingPassword(true);
      // API call would go here
      Alert.alert('Coming Soon', 'Password change will be available in a future update.');
      setChangePasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'edit_profile',
          title: 'Edit Profile',
          subtitle: 'Update your name, bio, and more',
          icon: 'person-outline',
          iconColor: '#6366F1',
          type: 'navigate' as const,
          onPress: () => setEditProfileModal(true),
        },
        {
          id: 'change_password',
          title: 'Change Password',
          subtitle: 'Update your account password',
          icon: 'lock-closed-outline',
          iconColor: '#10B981',
          type: 'navigate' as const,
          onPress: () => setChangePasswordModal(true),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push_notifications',
          title: 'Push Notifications',
          subtitle: 'Receive push notifications',
          icon: 'notifications-outline',
          iconColor: '#F59E0B',
          type: 'toggle' as const,
          value: notifications.push,
          onToggle: (value: boolean) => setNotifications(prev => ({ ...prev, push: value })),
        },
        {
          id: 'email_notifications',
          title: 'Email Notifications',
          subtitle: 'Receive email updates',
          icon: 'mail-outline',
          iconColor: '#EC4899',
          type: 'toggle' as const,
          value: notifications.email,
          onToggle: (value: boolean) => setNotifications(prev => ({ ...prev, email: value })),
        },
        {
          id: 'connection_notifications',
          title: 'Connection Requests',
          subtitle: 'New connection requests',
          icon: 'people-outline',
          iconColor: '#8B5CF6',
          type: 'toggle' as const,
          value: notifications.connections,
          onToggle: (value: boolean) => setNotifications(prev => ({ ...prev, connections: value })),
        },
        {
          id: 'message_notifications',
          title: 'Messages',
          subtitle: 'New messages',
          icon: 'chatbubble-outline',
          iconColor: '#06B6D4',
          type: 'toggle' as const,
          value: notifications.messages,
          onToggle: (value: boolean) => setNotifications(prev => ({ ...prev, messages: value })),
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          id: 'profile_visible',
          title: 'Public Profile',
          subtitle: 'Others can view your profile',
          icon: 'eye-outline',
          iconColor: '#10B981',
          type: 'toggle' as const,
          value: privacy.profileVisible,
          onToggle: (value: boolean) => setPrivacy(prev => ({ ...prev, profileVisible: value })),
        },
        {
          id: 'show_email',
          title: 'Show Email',
          subtitle: 'Display email on profile',
          icon: 'at-outline',
          iconColor: '#6366F1',
          type: 'toggle' as const,
          value: privacy.showEmail,
          onToggle: (value: boolean) => setPrivacy(prev => ({ ...prev, showEmail: value })),
        },
        {
          id: 'show_location',
          title: 'Show Location',
          subtitle: 'Display location on profile',
          icon: 'location-outline',
          iconColor: '#F59E0B',
          type: 'toggle' as const,
          value: privacy.showLocation,
          onToggle: (value: boolean) => setPrivacy(prev => ({ ...prev, showLocation: value })),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with the app',
          icon: 'help-circle-outline',
          iconColor: '#6366F1',
          type: 'navigate' as const,
          onPress: () => Alert.alert('Help', 'Contact us at support@cofounderbay.com'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve',
          icon: 'chatbubble-ellipses-outline',
          iconColor: '#10B981',
          type: 'navigate' as const,
          onPress: () => Alert.alert('Feedback', 'We appreciate your feedback!'),
        },
        {
          id: 'privacy_policy',
          title: 'Privacy Policy',
          icon: 'document-text-outline',
          iconColor: '#9CA3AF',
          type: 'link' as const,
          onPress: () => Alert.alert('Privacy Policy', 'View our privacy policy at cofounderbay.com/privacy'),
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'document-outline',
          iconColor: '#9CA3AF',
          type: 'link' as const,
          onPress: () => Alert.alert('Terms', 'View our terms at cofounderbay.com/terms'),
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          icon: 'log-out-outline',
          iconColor: '#EF4444',
          type: 'action' as const,
          onPress: handleLogout,
        },
        {
          id: 'delete_account',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          icon: 'trash-outline',
          iconColor: '#EF4444',
          type: 'action' as const,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={[styles.settingIcon, { backgroundColor: item.iconColor + '20' }]}>
        <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingTitle,
          item.id.includes('logout') || item.id.includes('delete') ? styles.dangerText : null
        ]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: '#374151', true: '#6366F1' }}
          thumbColor={item.value ? '#F9FAFB' : '#9CA3AF'}
        />
      )}
      {(item.type === 'navigate' || item.type === 'link') && (
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Avatar uri={user?.profile?.profile_image} name={user?.name || ''} size={60} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>CoFounderBay v2.0.0</Text>
          <Text style={styles.versionSubtext}>Built for the startup ecosystem</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditProfileModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditProfileModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile}>
                <Text style={[styles.modalSave, savingProfile && styles.modalSaveDisabled]}>
                  {savingProfile ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholderTextColor="#6B7280"
                  placeholder="Your name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Headline</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.headline}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, headline: text }))}
                  placeholderTextColor="#6B7280"
                  placeholder="e.g. Founder @ TechStartup"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                  placeholderTextColor="#6B7280"
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
                  placeholderTextColor="#6B7280"
                  placeholder="e.g. San Francisco, CA"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChangePasswordModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setChangePasswordModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={handleChangePassword} disabled={savingPassword}>
                <Text style={[styles.modalSave, savingPassword && styles.modalSaveDisabled]}>
                  {savingPassword ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordForm.current}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, current: text }))}
                  placeholderTextColor="#6B7280"
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordForm.new}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, new: text }))}
                  placeholderTextColor="#6B7280"
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordForm.confirm}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirm: text }))}
                  placeholderTextColor="#6B7280"
                  placeholder="Confirm new password"
                  secureTextEntry
                />
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1F2937',
    borderRadius: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  profileEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F9FAFB',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dangerText: {
    color: '#EF4444',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    padding: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
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
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  modalSaveDisabled: {
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
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
    fontSize: 16,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#374151',
  },
  formTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
});
