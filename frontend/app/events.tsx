import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event } from '../src/types';
import { Avatar } from '../src/components/Avatar';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { formatDate } from '../src/utils/helpers';
import api from '../src/utils/api';

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await api.get<Event[]>('/events', { params: { upcoming: true } });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  const handleRSVP = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/rsvp`);
      alert('RSVP successful!');
      fetchEvents();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to RSVP');
    }
  };

  const formatEventDate = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const date = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const time = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    return { date, time };
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const { date, time } = formatEventDate(item.start_time, item.end_time);
    
    return (
      <TouchableOpacity style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(item.event_type) + '20' }]}>
            <Ionicons 
              name={getEventTypeIcon(item.event_type)} 
              size={14} 
              color={getEventTypeColor(item.event_type)} 
            />
            <Text style={[styles.typeBadgeText, { color: getEventTypeColor(item.event_type) }]}>
              {item.event_type.charAt(0).toUpperCase() + item.event_type.slice(1)}
            </Text>
          </View>
          <Text style={styles.attendeesCount}>{item.attendees_count} attending</Text>
        </View>

        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
            <Text style={styles.metaText}>{date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text style={styles.metaText}>{time}</Text>
          </View>
          {item.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          )}
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.organizerInfo}>
            <Avatar 
              uri={item.organizer?.profile?.profile_image} 
              name={item.organizer?.name || 'Unknown'} 
              size={32} 
            />
            <Text style={styles.organizerName}>by {item.organizer?.name || 'Unknown'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.rsvpButton}
            onPress={() => handleRSVP(item.event_id)}
          >
            <Text style={styles.rsvpText}>RSVP</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading events..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.event_id}
        renderItem={renderEventCard}
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
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptyText}>Check back later for new events</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'online': return '#10B981';
    case 'offline': return '#6366F1';
    case 'hybrid': return '#F59E0B';
    default: return '#6B7280';
  }
};

const getEventTypeIcon = (type: string): any => {
  switch (type) {
    case 'online': return 'videocam-outline';
    case 'offline': return 'location-outline';
    case 'hybrid': return 'git-merge-outline';
    default: return 'calendar-outline';
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
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendeesCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventMeta: {
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
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
    color: '#6366F1',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerName: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  rsvpButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rsvpText: {
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
  },
});
