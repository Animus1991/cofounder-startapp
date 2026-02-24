import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Opportunity, OpportunityType, CompensationType, opportunityTypeLabels, compensationLabels } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import api from '../../src/utils/api';

const typeFilters: (OpportunityType | 'all')[] = ['all', 'cofounder', 'full_time', 'part_time', 'freelance', 'advisor'];

export default function OpportunitiesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<OpportunityType>('cofounder');
  const [formCompensation, setFormCompensation] = useState<CompensationType>('equity');
  const [formSkills, setFormSkills] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOpportunities = async () => {
    try {
      const params: any = { status: 'open' };
      if (selectedType !== 'all') params.type = selectedType;
      const response = await api.get<Opportunity[]>('/opportunities', { params });
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedType]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOpportunities();
  }, [selectedType]);

  const handleApply = async (opportunityId: string) => {
    try {
      await api.post(`/opportunities/${opportunityId}/apply`, {
        opportunity_id: opportunityId,
        message: "I'm interested in this opportunity!"
      });
      alert('Application submitted!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to apply');
    }
  };

  const handleCreateOpportunity = async () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const skills = formSkills.split(',').map(s => s.trim()).filter(s => s);
      await api.post('/opportunities', {
        type: formType,
        title: formTitle,
        description: formDescription,
        compensation_type: formCompensation,
        skills_required: skills,
        remote_ok: true
      });
      setCreateModalVisible(false);
      setFormTitle('');
      setFormDescription('');
      setFormSkills('');
      fetchOpportunities();
    } catch (error) {
      console.error('Error creating opportunity:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {}}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>
            {opportunityTypeLabels[item.type]}
          </Text>
        </View>
        <Text style={styles.compensation}>
          {compensationLabels[item.compensation_type]}
        </Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={3}>{item.description}</Text>

      {item.skills_required && item.skills_required.length > 0 && (
        <View style={styles.skillsContainer}>
          {item.skills_required.slice(0, 4).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.creatorInfo}>
          <Avatar 
            uri={item.creator?.profile?.profile_image} 
            name={item.creator?.name || 'Unknown'} 
            size={32} 
          />
          <Text style={styles.creatorName}>{item.creator?.name || 'Unknown'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => handleApply(item.opportunity_id)}
        >
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Loading opportunities..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Opportunities</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add-circle" size={28} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Type Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={typeFilters}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedType === item && styles.filterChipActive]}
              onPress={() => setSelectedType(item)}
            >
              <Text style={[styles.filterText, selectedType === item && styles.filterTextActive]}>
                {item === 'all' ? 'All' : opportunityTypeLabels[item as OpportunityType]}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={opportunities}
        keyExtractor={(item) => item.opportunity_id}
        renderItem={renderOpportunityCard}
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
            <Ionicons name="briefcase-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>No opportunities found</Text>
            <Text style={styles.emptyText}>Be the first to post an opportunity!</Text>
            <Button
              title="Post Opportunity"
              onPress={() => setCreateModalVisible(true)}
              style={styles.emptyButton}
            />
          </View>
        }
      />

      {/* Create Modal */}
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
              <Text style={styles.modalTitle}>Post Opportunity</Text>
              <TouchableOpacity onPress={handleCreateOpportunity} disabled={submitting}>
                <Text style={[styles.postButton, submitting && styles.postButtonDisabled]}>
                  {submitting ? 'Posting...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => 'form'}
              renderItem={() => (
                <View style={styles.modalContent}>
                  <Text style={styles.formLabel}>Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Looking for Technical Co-Founder"
                    placeholderTextColor="#6B7280"
                    value={formTitle}
                    onChangeText={setFormTitle}
                  />

                  <Text style={styles.formLabel}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the opportunity, requirements, and what you're offering..."
                    placeholderTextColor="#6B7280"
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={5}
                  />

                  <Text style={styles.formLabel}>Type</Text>
                  <View style={styles.typeSelector}>
                    {(['cofounder', 'full_time', 'part_time', 'freelance', 'advisor'] as OpportunityType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeOption, formType === type && styles.typeOptionActive]}
                        onPress={() => setFormType(type)}
                      >
                        <Text style={[styles.typeOptionText, formType === type && styles.typeOptionTextActive]}>
                          {opportunityTypeLabels[type]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.formLabel}>Compensation</Text>
                  <View style={styles.typeSelector}>
                    {(['equity', 'salary', 'mixed', 'unpaid'] as CompensationType[]).map((comp) => (
                      <TouchableOpacity
                        key={comp}
                        style={[styles.typeOption, formCompensation === comp && styles.typeOptionActive]}
                        onPress={() => setFormCompensation(comp)}
                      >
                        <Text style={[styles.typeOptionText, formCompensation === comp && styles.typeOptionTextActive]}>
                          {compensationLabels[comp]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.formLabel}>Required Skills (comma separated)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., React, Node.js, Product Management"
                    placeholderTextColor="#6B7280"
                    value={formSkills}
                    onChangeText={setFormSkills}
                  />
                </View>
              )}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getTypeColor = (type: OpportunityType) => {
  switch (type) {
    case 'cofounder': return '#6366F1';
    case 'full_time': return '#10B981';
    case 'part_time': return '#F59E0B';
    case 'freelance': return '#EC4899';
    case 'advisor': return '#8B5CF6';
    default: return '#6B7280';
  }
};

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
  addButton: {
    padding: 4,
  },
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  filtersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compensation: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  applyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  typeOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  typeOptionText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
});
