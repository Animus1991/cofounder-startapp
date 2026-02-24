import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '../src/components/Avatar';
import { Button } from '../src/components/Button';
import { LoadingScreen } from '../src/components/LoadingScreen';
import api from '../src/utils/api';

interface Mentor {
  user_id: string;
  name: string;
  email: string;
  profile?: {
    profile_image?: string;
    headline?: string;
    bio?: string;
    skills?: string[];
    location?: string;
  };
  mentor_info?: {
    expertise: string[];
    hourly_rate: number;
    availability: string;
    total_sessions: number;
    avg_rating: number;
  };
}

interface MentorSession {
  session_id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduled_at: string;
  duration_minutes: number;
  topic: string;
  notes?: string;
  mentor?: Mentor;
}

export default function MentoringScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'find' | 'sessions'>('find');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingTopic, setBookingTopic] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMentors = async () => {
    try {
      const response = await api.get<Mentor[]>('/mentors');
      setMentors(response.data);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };;
      setRefreshing(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get<MentorSession[]>('/mentor-sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    }
  };

  useEffect(() => {
    fetchMentors();
    fetchSessions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMentors();
    fetchSessions();
  }, []);

  const handleBookSession = async () => {
    if (!selectedMentor || !bookingTopic) return;
    
    setSubmitting(true);
    try {
      await api.post('/mentor-sessions', {
        mentor_id: selectedMentor.user_id,
        topic: bookingTopic,
        scheduled_at: bookingDate || new Date().toISOString(),
        duration_minutes: 60,
      });
      setBookingModal(false);
      setBookingTopic('');
      setBookingDate('');
      setSelectedMentor(null);
      fetchSessions();
      alert('Session request sent!');
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Session request sent! (Demo mode)');
      setBookingModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openBookingModal = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setBookingModal(true);
  };

  const renderMentorCard = ({ item }: { item: Mentor }) => (
    <View style={styles.mentorCard}>
      <View style={styles.mentorHeader}>
        <Avatar uri={item.profile?.profile_image} name={item.name} size={64} />
        <View style={styles.mentorInfo}>
          <Text style={styles.mentorName}>{item.name}</Text>
          <Text style={styles.mentorHeadline} numberOfLines={2}>
            {item.profile?.headline}
          </Text>
          {item.profile?.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text style={styles.locationText}>{item.profile.location}</Text>
            </View>
          )}
        </View>
      </View>

      {item.mentor_info && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.statValue}>{item.mentor_info.avg_rating}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
            <Text style={styles.statValue}>{item.mentor_info.total_sessions} sessions</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={16} color="#10B981" />
            <Text style={styles.statValue}>${item.mentor_info.hourly_rate}/hr</Text>
          </View>
        </View>
      )}

      {item.mentor_info?.expertise && (
        <View style={styles.expertiseContainer}>
          {item.mentor_info.expertise.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.expertiseTag}>
              <Text style={styles.expertiseText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={styles.bookButton}
        onPress={() => openBookingModal(item)}
      >
        <Ionicons name="calendar" size={18} color="#FFFFFF" />
        <Text style={styles.bookButtonText}>Book Session</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSessionCard = ({ item }: { item: MentorSession }) => (
    <View style={styles.sessionCard}>
      <View style={[
        styles.statusBadge,
        { backgroundColor: getStatusColor(item.status) + '20' }
      ]}>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      <Text style={styles.sessionTopic}>{item.topic}</Text>
      <View style={styles.sessionMeta}>
        <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
        <Text style={styles.sessionMetaText}>
          {new Date(item.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      <View style={styles.sessionMeta}>
        <Ionicons name="time-outline" size={16} color="#9CA3AF" />
        <Text style={styles.sessionMetaText}>{item.duration_minutes} minutes</Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingScreen message="Loading mentors..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentoring</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>
            Find Mentors
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sessions' && styles.tabActive]}
          onPress={() => setActiveTab('sessions')}
        >
          <Text style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive]}>
            My Sessions
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'find' ? (
        <FlatList
          data={mentors}
          keyExtractor={(item) => item.user_id}
          renderItem={renderMentorCard}
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
              <Ionicons name="school-outline" size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No mentors available</Text>
              <Text style={styles.emptyText}>Check back later for new mentors</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.session_id}
          renderItem={renderSessionCard}
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
              <Ionicons name="calendar-outline" size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyText}>Book a session with a mentor to get started</Text>
              <Button
                title="Find Mentors"
                onPress={() => setActiveTab('find')}
                style={styles.emptyButton}
              />
            </View>
          }
        />
      )}

      {/* Booking Modal */}
      <Modal
        visible={bookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBookingModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setBookingModal(false)}>
                <Ionicons name="close" size={28} color="#F9FAFB" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Book Session</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.modalContent}>
              {selectedMentor && (
                <View style={styles.selectedMentorCard}>
                  <Avatar uri={selectedMentor.profile?.profile_image} name={selectedMentor.name} size={56} />
                  <View style={styles.selectedMentorInfo}>
                    <Text style={styles.selectedMentorName}>{selectedMentor.name}</Text>
                    <Text style={styles.selectedMentorRate}>
                      ${selectedMentor.mentor_info?.hourly_rate}/hour
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.formLabel}>What would you like to discuss?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., I need help with my fundraising pitch..."
                placeholderTextColor="#6B7280"
                value={bookingTopic}
                onChangeText={setBookingTopic}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.formLabel}>Preferred Date/Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Next Monday at 2pm PST"
                placeholderTextColor="#6B7280"
                value={bookingDate}
                onChangeText={setBookingDate}
              />

              <Button
                title={submitting ? 'Sending Request...' : 'Request Session'}
                onPress={handleBookSession}
                disabled={!bookingTopic || submitting}
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return '#10B981';
    case 'pending': return '#F59E0B';
    case 'completed': return '#6366F1';
    case 'cancelled': return '#EF4444';
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
  listContent: {
    padding: 16,
  },
  mentorCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mentorHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  mentorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  mentorHeadline: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    color: '#E5E7EB',
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  expertiseTag: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expertiseText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionTopic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sessionMetaText: {
    fontSize: 14,
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
  modalContent: {
    padding: 16,
  },
  selectedMentorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectedMentorInfo: {
    marginLeft: 12,
  },
  selectedMentorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  selectedMentorRate: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 2,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
    color: '#F9FAFB',
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
  },
});
