import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Avatar } from '../src/components/Avatar';
import api from '../src/utils/api';
import { PipelineItem, PipelineStage } from '../src/types';

interface StageConfig {
  key: PipelineStage;
  label: string;
  color: string;
  icon: string;
}

const PIPELINE_STAGES: StageConfig[] = [
  { key: 'new', label: 'New', color: '#6366F1', icon: 'sparkles' },
  { key: 'contacted', label: 'Contacted', color: '#8B5CF6', icon: 'mail' },
  { key: 'meeting', label: 'Meeting', color: '#F59E0B', icon: 'calendar' },
  { key: 'due_diligence', label: 'Due Diligence', color: '#EC4899', icon: 'document-text' },
  { key: 'term_sheet', label: 'Term Sheet', color: '#10B981', icon: 'document' },
  { key: 'invested', label: 'Invested', color: '#059669', icon: 'checkmark-circle' },
  { key: 'pass', label: 'Pass', color: '#6B7280', icon: 'close-circle' },
];

export default function PipelineScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | 'all'>('all');
  const [selectedDeal, setSelectedDeal] = useState<PipelineItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editNextAction, setEditNextAction] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/investor/pipeline');
      setPipeline(response.data || []);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPipeline();
  };

  const handleDealPress = (deal: PipelineItem) => {
    setSelectedDeal(deal);
    setEditNotes(deal.notes || '');
    setEditNextAction(deal.next_action || '');
    setDetailModalVisible(true);
  };

  const handleStageChange = async (deal: PipelineItem, newStage: PipelineStage) => {
    try {
      setSaving(true);
      await api.patch(`/investor/pipeline/${deal.pipeline_id}`, {
        stage: newStage,
        notes: `Stage changed to ${newStage}`,
      });
      
      // Update local state
      setPipeline(prev =>
        prev.map(p =>
          p.pipeline_id === deal.pipeline_id
            ? { ...p, stage: newStage }
            : p
        )
      );
      
      Alert.alert('Success', `Deal moved to ${PIPELINE_STAGES.find(s => s.key === newStage)?.label}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update deal');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeal = async () => {
    if (!selectedDeal) return;
    
    try {
      setSaving(true);
      await api.patch(`/investor/pipeline/${selectedDeal.pipeline_id}`, {
        notes: editNotes,
        next_action: editNextAction,
      });
      
      // Update local state
      setPipeline(prev =>
        prev.map(p =>
          p.pipeline_id === selectedDeal.pipeline_id
            ? { ...p, notes: editNotes, next_action: editNextAction }
            : p
        )
      );
      
      setDetailModalVisible(false);
      Alert.alert('Success', 'Deal updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update deal');
    } finally {
      setSaving(false);
    }
  };

  const getStageColor = (stage: PipelineStage): string => {
    return PIPELINE_STAGES.find(s => s.key === stage)?.color || '#6B7280';
  };

  const getStageLabel = (stage: PipelineStage): string => {
    return PIPELINE_STAGES.find(s => s.key === stage)?.label || stage;
  };

  const filteredPipeline = selectedStage === 'all'
    ? pipeline
    : pipeline.filter(p => p.stage === selectedStage);

  // Count deals by stage
  const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.key] = pipeline.filter(p => p.stage === stage.key).length;
    return acc;
  }, {} as Record<PipelineStage, number>);

  const renderDealCard = (deal: PipelineItem) => (
    <TouchableOpacity
      key={deal.pipeline_id}
      style={styles.dealCard}
      onPress={() => handleDealPress(deal)}
    >
      <View style={styles.dealHeader}>
        <View style={styles.dealInfo}>
          <Text style={styles.dealName}>
            {deal.startup?.name || 'Unknown Startup'}
          </Text>
          <Text style={styles.dealDescription} numberOfLines={1}>
            {deal.startup?.description || 'No description'}
          </Text>
        </View>
        <View style={[styles.stageBadge, { backgroundColor: getStageColor(deal.stage) + '20' }]}>
          <Text style={[styles.stageBadgeText, { color: getStageColor(deal.stage) }]}>
            {getStageLabel(deal.stage)}
          </Text>
        </View>
      </View>

      {deal.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text-outline" size={14} color="#6B7280" />
          <Text style={styles.notesText} numberOfLines={2}>{deal.notes}</Text>
        </View>
      )}

      {deal.next_action && (
        <View style={styles.nextActionContainer}>
          <Ionicons name="flag-outline" size={14} color="#F59E0B" />
          <Text style={styles.nextActionText} numberOfLines={1}>
            Next: {deal.next_action}
          </Text>
        </View>
      )}

      <View style={styles.dealActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/user/${deal.startup_id}`)}
        >
          <Ionicons name="eye-outline" size={16} color="#6366F1" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        <View style={styles.stageButtons}>
          {deal.stage !== 'invested' && deal.stage !== 'pass' && (
            <>
              <TouchableOpacity
                style={[styles.miniButton, { backgroundColor: '#EF444420' }]}
                onPress={() => handleStageChange(deal, 'pass')}
              >
                <Ionicons name="close" size={16} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.miniButton, { backgroundColor: '#10B98120' }]}
                onPress={() => {
                  const currentIndex = PIPELINE_STAGES.findIndex(s => s.key === deal.stage);
                  if (currentIndex < PIPELINE_STAGES.length - 2) {
                    handleStageChange(deal, PIPELINE_STAGES[currentIndex + 1].key);
                  }
                }}
              >
                <Ionicons name="arrow-forward" size={16} color="#10B981" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="layers-outline" size={64} color="#4B5563" />
      </View>
      <Text style={styles.emptyTitle}>No deals in pipeline</Text>
      <Text style={styles.emptySubtitle}>
        Start scouting startups to build your deal pipeline
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/discover')}
      >
        <Ionicons name="search" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Discover Startups</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deal Pipeline</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#F9FAFB" />
        </TouchableOpacity>
      </View>

      {/* Stage Overview */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stageOverview}
        contentContainerStyle={styles.stageOverviewContent}
      >
        <TouchableOpacity
          style={[
            styles.stageTab,
            selectedStage === 'all' && styles.stageTabActive,
          ]}
          onPress={() => setSelectedStage('all')}
        >
          <Text style={[
            styles.stageTabCount,
            selectedStage === 'all' && styles.stageTabCountActive,
          ]}>
            {pipeline.length}
          </Text>
          <Text style={[
            styles.stageTabLabel,
            selectedStage === 'all' && styles.stageTabLabelActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {PIPELINE_STAGES.slice(0, -1).map((stage) => (
          <TouchableOpacity
            key={stage.key}
            style={[
              styles.stageTab,
              selectedStage === stage.key && styles.stageTabActive,
              selectedStage === stage.key && { borderColor: stage.color },
            ]}
            onPress={() => setSelectedStage(stage.key)}
          >
            <Text style={[
              styles.stageTabCount,
              selectedStage === stage.key && { color: stage.color },
            ]}>
              {stageCounts[stage.key] || 0}
            </Text>
            <Text style={[
              styles.stageTabLabel,
              selectedStage === stage.key && styles.stageTabLabelActive,
            ]}>
              {stage.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pipeline List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading pipeline...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
            />
          }
        >
          {filteredPipeline.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredPipeline.map(renderDealCard)
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Deal Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Deal Details</Text>
            <TouchableOpacity onPress={handleSaveDeal} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedDeal && (
              <>
                {/* Startup Info */}
                <View style={styles.startupSection}>
                  <Text style={styles.startupName}>
                    {selectedDeal.startup?.name || 'Unknown Startup'}
                  </Text>
                  <Text style={styles.startupDescription}>
                    {selectedDeal.startup?.description || 'No description available'}
                  </Text>
                </View>

                {/* Current Stage */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Current Stage</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.stageSelector}>
                      {PIPELINE_STAGES.map((stage) => (
                        <TouchableOpacity
                          key={stage.key}
                          style={[
                            styles.stageSelectorItem,
                            selectedDeal.stage === stage.key && {
                              backgroundColor: stage.color,
                              borderColor: stage.color,
                            },
                          ]}
                          onPress={() => {
                            setSelectedDeal({ ...selectedDeal, stage: stage.key });
                          }}
                        >
                          <Ionicons
                            name={stage.icon as any}
                            size={16}
                            color={selectedDeal.stage === stage.key ? '#FFFFFF' : stage.color}
                          />
                          <Text
                            style={[
                              styles.stageSelectorText,
                              selectedDeal.stage === stage.key && { color: '#FFFFFF' },
                            ]}
                          >
                            {stage.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Notes */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Notes</Text>
                  <TextInput
                    style={styles.textArea}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Add notes about this deal..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Next Action */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Next Action</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editNextAction}
                    onChangeText={setEditNextAction}
                    placeholder="e.g., Schedule follow-up call"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                {/* History */}
                {selectedDeal.history && selectedDeal.history.length > 0 && (
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>History</Text>
                    <View style={styles.historyList}>
                      {selectedDeal.history.map((entry, index) => (
                        <View key={index} style={styles.historyItem}>
                          <View
                            style={[
                              styles.historyDot,
                              { backgroundColor: getStageColor(entry.stage) },
                            ]}
                          />
                          <View style={styles.historyContent}>
                            <Text style={styles.historyStage}>
                              {getStageLabel(entry.stage)}
                            </Text>
                            <Text style={styles.historyDate}>
                              {new Date(entry.date).toLocaleDateString()}
                            </Text>
                            {entry.notes && (
                              <Text style={styles.historyNotes}>{entry.notes}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageOverview: {
    maxHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  stageOverviewContent: {
    padding: 12,
    gap: 8,
  },
  stageTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stageTabActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F115',
  },
  stageTabCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stageTabCountActive: {
    color: '#6366F1',
  },
  stageTabLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  stageTabLabelActive: {
    color: '#F9FAFB',
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
  content: {
    flex: 1,
    padding: 16,
  },
  dealCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealInfo: {
    flex: 1,
    marginRight: 12,
  },
  dealName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#D1D5DB',
    marginLeft: 8,
    lineHeight: 18,
  },
  nextActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextActionText: {
    flex: 1,
    fontSize: 13,
    color: '#F59E0B',
    marginLeft: 6,
    fontWeight: '500',
  },
  dealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#6366F120',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
    marginLeft: 6,
  },
  stageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  miniButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
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
  startupSection: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  startupName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  startupDescription: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
  },
  stageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  stageSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 6,
  },
  stageSelectorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  textArea: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#374151',
  },
  historyList: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyStage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
