import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '../src/components/Avatar';
import { Button } from '../src/components/Button';
import { LoadingScreen } from '../src/components/LoadingScreen';
import api from '../src/utils/api';

interface Group {
  group_id: string;
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  member_count: number;
  post_count: number;
  cover_image?: string;
  tags: string[];
  created_by: string;
  is_member: boolean;
  admins: string[];
}

const categories = ['all', 'Founders', 'Investors', 'Engineering', 'Product', 'Marketing', 'Industry'];

export default function GroupsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Founders');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = async () => {
    try {
      const response = await api.get<Group[]>('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups();
  }, []);

  const handleJoinGroup = (groupId: string) => {
    setGroups(groups.map(g => 
      g.group_id === groupId 
        ? { ...g, is_member: !g.is_member, member_count: g.is_member ? g.member_count - 1 : g.member_count + 1 }
        : g
    ));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName || !newGroupDescription) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/groups', {
        name: newGroupName,
        description: newGroupDescription,
        category: newGroupCategory,
        privacy: newGroupPrivacy,
      });
      setCreateModalVisible(false);
      setNewGroupName('');
      setNewGroupDescription('');
      fetchGroups();
    } catch (error) {
      // Demo mode
      const newGroup: Group = {
        group_id: `new-${Date.now()}`,
        name: newGroupName,
        description: newGroupDescription,
        category: newGroupCategory,
        privacy: newGroupPrivacy,
        member_count: 1,
        post_count: 0,
        tags: [],
        created_by: 'me',
        is_member: true,
        admins: ['me'],
      };
      setGroups([newGroup, ...groups]);
      setCreateModalVisible(false);
      setNewGroupName('');
      setNewGroupDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGroups = groups.filter(g => {
    const categoryMatch = selectedCategory === 'all' || g.category === selectedCategory;
    const membershipMatch = activeTab === 'discover' ? true : g.is_member;
    return categoryMatch && membershipMatch;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Founders': '#6366F1',
      'Investors': '#10B981',
      'Engineering': '#F59E0B',
      'Product': '#EC4899',
      'Marketing': '#8B5CF6',
      'Industry': '#06B6D4',
    };
    return colors[category] || '#6B7280';
  };

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity style={styles.groupCard}>
      {/* Cover */}
      <View style={[styles.groupCover, { backgroundColor: getCategoryColor(item.category) + '30' }]}>
        <Ionicons name="people" size={40} color={getCategoryColor(item.category)} />
      </View>

      <View style={styles.groupContent}>
        <View style={styles.groupHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
              {item.category}
            </Text>
          </View>
          <View style={styles.privacyBadge}>
            <Ionicons 
              name={item.privacy === 'private' ? 'lock-closed' : 'globe-outline'} 
              size={12} 
              color="#9CA3AF" 
            />
            <Text style={styles.privacyText}>
              {item.privacy.charAt(0).toUpperCase() + item.privacy.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.groupStats}>
          <View style={styles.groupStat}>
            <Ionicons name="people-outline" size={16} color="#9CA3AF" />
            <Text style={styles.groupStatText}>{item.member_count.toLocaleString()} members</Text>
          </View>
          <View style={styles.groupStat}>
            <Ionicons name="chatbubbles-outline" size={16} color="#9CA3AF" />
            <Text style={styles.groupStatText}>{item.post_count} posts</Text>
          </View>
        </View>

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.joinButton, item.is_member && styles.memberButton]}
          onPress={() => handleJoinGroup(item.group_id)}
        >
          <Ionicons 
            name={item.is_member ? 'checkmark-circle' : 'add-circle-outline'} 
            size={18} 
            color="#FFFFFF" 
          />
          <Text style={styles.joinButtonText}>
            {item.is_member ? 'Joined' : 'Join Group'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Loading groups..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add-circle" size={28} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-groups' && styles.tabActive]}
          onPress={() => setActiveTab('my-groups')}
        >
          <Text style={[styles.tabText, activeTab === 'my-groups' && styles.tabTextActive]}>
            My Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === item && styles.filterChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.filterText, selectedCategory === item && styles.filterTextActive]}>
              {item === 'all' ? 'All' : item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filtersList}
      />

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.group_id}
        renderItem={renderGroupCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'my-groups' ? 'No groups joined yet' : 'No groups found'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'my-groups' 
                ? 'Join some groups to connect with like-minded people'
                : 'Try a different category or create your own group'
              }
            </Text>
            {activeTab === 'my-groups' && (
              <Button
                title="Discover Groups"
                onPress={() => setActiveTab('discover')}
                style={styles.emptyButton}
              />
            )}
          </View>
        }
      />

      {/* Create Group Modal */}
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
              <Text style={styles.modalTitle}>Create Group</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.formLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., AI Startup Founders"
                placeholderTextColor="#6B7280"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />

              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this group about?"
                placeholderTextColor="#6B7280"
                value={newGroupDescription}
                onChangeText={setNewGroupDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categorySelector}>
                {['Founders', 'Investors', 'Engineering', 'Product', 'Marketing', 'Industry'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      newGroupCategory === cat && styles.categoryOptionActive
                    ]}
                    onPress={() => setNewGroupCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newGroupCategory === cat && styles.categoryOptionTextActive
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Privacy</Text>
              <View style={styles.privacySelector}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    newGroupPrivacy === 'public' && styles.privacyOptionActive
                  ]}
                  onPress={() => setNewGroupPrivacy('public')}
                >
                  <Ionicons name="globe-outline" size={20} color={newGroupPrivacy === 'public' ? '#6366F1' : '#9CA3AF'} />
                  <Text style={[
                    styles.privacyOptionText,
                    newGroupPrivacy === 'public' && styles.privacyOptionTextActive
                  ]}>
                    Public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    newGroupPrivacy === 'private' && styles.privacyOptionActive
                  ]}
                  onPress={() => setNewGroupPrivacy('private')}
                >
                  <Ionicons name="lock-closed" size={20} color={newGroupPrivacy === 'private' ? '#6366F1' : '#9CA3AF'} />
                  <Text style={[
                    styles.privacyOptionText,
                    newGroupPrivacy === 'private' && styles.privacyOptionTextActive
                  ]}>
                    Private
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={submitting ? 'Creating...' : 'Create Group'}
                onPress={handleCreateGroup}
                disabled={!newGroupName || !newGroupDescription || submitting}
                size="large"
                style={styles.submitButton}
              />
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
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#6366F120',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#6366F1',
  },
  filtersList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  groupCover: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupContent: {
    padding: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  groupStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupStatText: {
    fontSize: 13,
    color: '#9CA3AF',
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
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  memberButton: {
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    textAlign: 'center',
    paddingHorizontal: 32,
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
  modalContent: {
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
    color: '#F9FAFB',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
  },
  privacySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 8,
  },
  privacyOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F120',
  },
  privacyOptionText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  privacyOptionTextActive: {
    color: '#6366F1',
  },
  submitButton: {
    marginTop: 24,
  },
});
