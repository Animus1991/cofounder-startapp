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

interface Milestone {
  milestone_id: string;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  notes?: string;
  created_at: string;
}

const CATEGORIES = [
  { id: 'product', label: 'Product', icon: 'cube', color: '#6366F1' },
  { id: 'fundraising', label: 'Fundraising', icon: 'cash', color: '#10B981' },
  { id: 'team', label: 'Team', icon: 'people', color: '#F59E0B' },
  { id: 'growth', label: 'Growth', icon: 'trending-up', color: '#EC4899' },
  { id: 'legal', label: 'Legal', icon: 'document-text', color: '#8B5CF6' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: '#6B7280', icon: 'ellipse-outline' },
  in_progress: { label: 'In Progress', color: '#F59E0B', icon: 'time' },
  completed: { label: 'Completed', color: '#10B981', icon: 'checkmark-circle' },
  blocked: { label: 'Blocked', color: '#EF4444', icon: 'alert-circle' },
};

export default function MilestonesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop, isTablet, padding } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [creating, setCreating] = useState(false);
  
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    category: 'product',
    target_date: '',
    status: 'not_started' as const,
  });

  // Mock data for milestones (since backend may not have this endpoint)
  const mockMilestones: Milestone[] = [
    {
      milestone_id: 'm1',
      title: 'Launch MVP',
      description: 'Release the minimum viable product to early adopters',
      category: 'product',
      target_date: '2025-07-01',
      status: 'in_progress',
      notes: 'On track, finishing last features',
      created_at: '2025-01-15',
    },
    {
      milestone_id: 'm2',
      title: 'Close Seed Round',
      description: 'Secure $500K seed funding',
      category: 'fundraising',
      target_date: '2025-08-15',
      status: 'not_started',
      notes: 'Starting outreach next month',
      created_at: '2025-01-20',
    },
    {
      milestone_id: 'm3',
      title: 'Hire First Engineer',
      description: 'Bring on a full-stack developer',
      category: 'team',
      target_date: '2025-06-01',
      status: 'completed',
      notes: 'John joined the team!',
      created_at: '2025-02-01',
    },
    {
      milestone_id: 'm4',
      title: 'Reach 100 Users',
      description: 'Get first 100 active users on platform',
      category: 'growth',
      target_date: '2025-07-15',
      status: 'in_progress',
      notes: 'Currently at 45 users',
      created_at: '2025-03-01',
    },
  ];

  const fetchMilestones = useCallback(async () => {
    try {
      setLoading(true);
      // Use mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      setMilestones(mockMilestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMilestones();
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    
    try {
      setCreating(true);
      const newM: Milestone = {
        milestone_id: `m${Date.now()}`,
        ...newMilestone,
        created_at: new Date().toISOString(),
      };
      setMilestones(prev => [newM, ...prev]);
      setShowCreateModal(false);
      setNewMilestone({
        title: '',
        description: '',
        category: 'product',
        target_date: '',
        status: 'not_started',
      });
    } catch (error) {
      console.error('Error creating milestone:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = (milestone: Milestone, newStatus: Milestone['status']) => {
    setMilestones(prev =>
      prev.map(m =>
        m.milestone_id === milestone.milestone_id
          ? { ...m, status: newStatus }
          : m
      )
    );
  };

  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[5];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredMilestones = selectedCategory
    ? milestones.filter(m => m.category === selectedCategory)
    : milestones;

  // Calculate progress stats
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    inProgress: milestones.filter(m => m.status === 'in_progress').length,
    blocked: milestones.filter(m => m.status === 'blocked').length,
  };

  const renderMilestoneCard = (milestone: Milestone) => {
    const category = getCategoryConfig(milestone.category);
    const statusConfig = STATUS_CONFIG[milestone.status];
    const daysRemaining = getDaysRemaining(milestone.target_date);

    return (
      <TouchableOpacity
        key={milestone.milestone_id}
        style={[styles.milestoneCard, isDesktop && styles.milestoneCardDesktop]}
        onPress={() => setEditingMilestone(milestone)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <Ionicons name={category.icon as any} size={20} color={category.color} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
        {milestone.description && (
          <Text style={styles.milestoneDescription} numberOfLines={2}>
            {milestone.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.dateText}>{formatDate(milestone.target_date)}</Text>
          </View>
          {daysRemaining !== null && milestone.status !== 'completed' && (
            <Text style={[
              styles.daysRemaining,
              daysRemaining < 0 && styles.daysOverdue,
              daysRemaining <= 7 && daysRemaining >= 0 && styles.daysSoon,
            ]}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
            </Text>
          )}
        </View>

        {milestone.notes && (
          <View style={styles.notesSection}>
            <Ionicons name="document-text-outline" size={14} color="#6B7280" />
            <Text style={styles.notesText} numberOfLines={1}>{milestone.notes}</Text>
          </View>
        )}

        {/* Quick status change */}
        <View style={styles.quickActions}>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.quickAction,
                milestone.status === key && styles.quickActionActive,
                milestone.status === key && { borderColor: config.color }
              ]}
              onPress={() => handleUpdateStatus(milestone, key as Milestone['status'])}
            >
              <Ionicons
                name={config.icon as any}
                size={16}
                color={milestone.status === key ? config.color : '#6B7280'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Milestones</Text>
            <Text style={styles.headerSubtitle}>Track your startup progress</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          {isDesktop && <Text style={styles.createButtonText}>Add Milestone</Text>}
        </TouchableOpacity>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{stats.completed}</Text>
            <Text style={styles.progressStatLabel}>Completed</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressStatValue, { color: '#F59E0B' }]}>{stats.inProgress}</Text>
            <Text style={styles.progressStatLabel}>In Progress</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressStatValue, { color: '#EF4444' }]}>{stats.blocked}</Text>
            <Text style={styles.progressStatLabel}>Blocked</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressStatValue, { color: '#6366F1' }]}>{stats.total}</Text>
            <Text style={styles.progressStatLabel}>Total</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }
            ]}
          />
        </View>
      </View>

      {/* Categories Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Ionicons name="grid" size={16} color={!selectedCategory ? '#FFFFFF' : '#9CA3AF'} />
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
              selectedCategory === cat.id && { backgroundColor: cat.color }
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

      {/* Milestones List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading milestones...</Text>
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
            styles.milestonesGrid,
            isDesktop && styles.milestonesGridDesktop
          ]}>
            {filteredMilestones.map(renderMilestoneCard)}
          </View>
          
          {filteredMilestones.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flag" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>No milestones yet</Text>
              <Text style={styles.emptySubtitle}>Add your first milestone to track progress</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add Milestone</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Create Milestone Modal */}
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
              <Text style={styles.createModalTitle}>New Milestone</Text>
              <TouchableOpacity onPress={handleCreateMilestone} disabled={creating}>
                <Text style={[
                  styles.createText,
                  (!newMilestone.title.trim() || creating) && styles.createTextDisabled
                ]}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.createForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMilestone.title}
                  onChangeText={(text) => setNewMilestone({ ...newMilestone, title: text })}
                  placeholder="e.g., Launch MVP"
                  placeholderTextColor="#6B7280"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={newMilestone.description}
                  onChangeText={(text) => setNewMilestone({ ...newMilestone, description: text })}
                  placeholder="What does this milestone involve?"
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryOptions}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        newMilestone.category === cat.id && styles.categoryOptionActive,
                        newMilestone.category === cat.id && { borderColor: cat.color }
                      ]}
                      onPress={() => setNewMilestone({ ...newMilestone, category: cat.id })}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={18}
                        color={newMilestone.category === cat.id ? cat.color : '#6B7280'}
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        newMilestone.category === cat.id && { color: cat.color }
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMilestone.target_date}
                  onChangeText={(text) => setNewMilestone({ ...newMilestone, target_date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6B7280"
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
  progressSummary: {
    padding: 16,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginTop: 16,
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
  milestonesGrid: {
    gap: 16,
  },
  milestonesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  milestoneCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  milestoneCardDesktop: {
    width: '48%',
    marginRight: '2%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  milestoneTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  daysRemaining: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  daysOverdue: {
    color: '#EF4444',
  },
  daysSoon: {
    color: '#F59E0B',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#D1D5DB',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quickActionActive: {
    backgroundColor: '#37415180',
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
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
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
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 6,
  },
  categoryOptionActive: {
    backgroundColor: '#37415180',
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
});
