import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LoadingScreen } from '../src/components/LoadingScreen';
import api from '../src/utils/api';

interface Course {
  course_id: string;
  title: string;
  description: string;
  instructor: string;
  instructor_image?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  lessons_count: number;
  enrolled_count: number;
  avg_rating: number;
  thumbnail?: string;
  tags: string[];
  price: number;
  is_free: boolean;
}

const categories = ['all', 'Fundraising', 'Product', 'Growth', 'Engineering', 'Leadership', 'Finance', 'Marketing'];

export default function LearningScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);

  const fetchCourses = async () => {
    try {
      const response = await api.get<Course[]>('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, []);

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  const handleEnroll = (courseId: string) => {
    if (enrolledCourses.includes(courseId)) {
      // Already enrolled - open course
      alert('Opening course... (Demo mode)');
    } else {
      setEnrolledCourses([...enrolledCourses, courseId]);
      alert('Successfully enrolled!');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderCourseCard = ({ item }: { item: Course }) => {
    const isEnrolled = enrolledCourses.includes(item.course_id);
    
    return (
      <TouchableOpacity 
        style={styles.courseCard}
        onPress={() => handleEnroll(item.course_id)}
      >
        {/* Thumbnail placeholder */}
        <View style={styles.thumbnail}>
          <Ionicons name="play-circle" size={48} color="#6366F1" />
        </View>

        <View style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) + '20' }
            ]}>
              <Text style={[
                styles.difficultyText,
                { color: getDifficultyColor(item.difficulty) }
              ]}>
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>
            {item.is_free ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.price}>${item.price}</Text>
            )}
          </View>

          <Text style={styles.courseTitle}>{item.title}</Text>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.instructorRow}>
            <View style={styles.instructorAvatar}>
              <Text style={styles.instructorInitial}>
                {item.instructor.charAt(0)}
              </Text>
            </View>
            <Text style={styles.instructorName}>{item.instructor}</Text>
          </View>

          <View style={styles.courseStats}>
            <View style={styles.courseStat}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.courseStatText}>{item.avg_rating}</Text>
            </View>
            <View style={styles.courseStat}>
              <Ionicons name="people-outline" size={14} color="#9CA3AF" />
              <Text style={styles.courseStatText}>{item.enrolled_count.toLocaleString()}</Text>
            </View>
            <View style={styles.courseStat}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.courseStatText}>{item.duration_hours}h</Text>
            </View>
            <View style={styles.courseStat}>
              <Ionicons name="book-outline" size={14} color="#9CA3AF" />
              <Text style={styles.courseStatText}>{item.lessons_count} lessons</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.enrollButton, isEnrolled && styles.enrolledButton]}
            onPress={() => handleEnroll(item.course_id)}
          >
            <Ionicons 
              name={isEnrolled ? 'play' : 'add-circle-outline'} 
              size={18} 
              color="#FFFFFF" 
            />
            <Text style={styles.enrollButtonText}>
              {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading courses..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning</Text>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#F9FAFB" />
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.bannerStat}>
          <Text style={styles.bannerStatValue}>{enrolledCourses.length}</Text>
          <Text style={styles.bannerStatLabel}>Enrolled</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={styles.bannerStatValue}>0</Text>
          <Text style={styles.bannerStatLabel}>Completed</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={styles.bannerStatValue}>0</Text>
          <Text style={styles.bannerStatLabel}>Certificates</Text>
        </View>
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
              {item === 'all' ? 'All Courses' : item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filtersList}
      />

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.course_id}
        renderItem={renderCourseCard}
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
            <Ionicons name="book-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptyText}>Try a different category</Text>
          </View>
        }
      />
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
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
  },
  bannerStat: {
    flex: 1,
    alignItems: 'center',
  },
  bannerStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  bannerStatLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  bannerDivider: {
    width: 1,
    backgroundColor: '#374151',
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
  courseCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    height: 140,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseContent: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  freeBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructorName: {
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 8,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
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
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  enrolledButton: {
    backgroundColor: '#10B981',
  },
  enrollButtonText: {
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
  },
});
