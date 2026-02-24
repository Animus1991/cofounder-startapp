import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MarketplaceTool } from '../src/types';
import { LoadingScreen } from '../src/components/LoadingScreen';
import api from '../src/utils/api';

const categories = ['all', 'Analytics', 'Productivity', 'Marketing', 'Design', 'Development', 'Finance'];

export default function MarketplaceScreen() {
  const router = useRouter();
  const [tools, setTools] = useState<MarketplaceTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchTools = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      const response = await api.get<MarketplaceTool[]>('/marketplace/tools', { params });
      setTools(response.data);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTools();
  }, [selectedCategory]);

  const handleVisitTool = (url: string) => {
    Linking.openURL(url);
  };

  const renderToolCard = ({ item }: { item: MarketplaceTool }) => (
    <TouchableOpacity 
      style={styles.toolCard}
      onPress={() => handleVisitTool(item.url)}
    >
      <View style={styles.toolHeader}>
        <View style={styles.toolLogo}>
          {item.logo ? (
            <Ionicons name="cube" size={28} color="#6366F1" />
          ) : (
            <Ionicons name="cube-outline" size={28} color="#6366F1" />
          )}
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.avg_rating.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.toolDescription} numberOfLines={2}>{item.description}</Text>

      {item.pricing && (
        <View style={styles.pricingBadge}>
          <Ionicons name="pricetag-outline" size={14} color="#10B981" />
          <Text style={styles.pricingText}>{item.pricing}</Text>
        </View>
      )}

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.toolFooter}>
        <Text style={styles.reviewCount}>{item.review_count} reviews</Text>
        <TouchableOpacity 
          style={styles.visitButton}
          onPress={() => handleVisitTool(item.url)}
        >
          <Text style={styles.visitText}>Visit</Text>
          <Ionicons name="open-outline" size={16} color="#6366F1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Loading tools..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={{ width: 24 }} />
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
        data={tools}
        keyExtractor={(item) => item.tool_id}
        renderItem={renderToolCard}
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
            <Ionicons name="storefront-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>No tools found</Text>
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
  filtersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
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
  toolCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366F120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
    marginLeft: 12,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  toolDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  pricingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  pricingText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
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
  toolFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  reviewCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitText: {
    fontSize: 14,
    color: '#6366F1',
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
