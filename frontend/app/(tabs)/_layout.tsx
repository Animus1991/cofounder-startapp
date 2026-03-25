import React from 'react';
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useResponsive } from '../../src/hooks/useResponsive';
import Sidebar from '../../src/components/layout/Sidebar';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const { showSidebar, sidebarWidth, isMobile } = useResponsive();
  const segments = useSegments();
  
  // Get current active route for sidebar highlighting
  const activeRoute = segments[1] || 'dashboard';
  
  // For desktop/tablet: Use sidebar layout
  if (showSidebar) {
    return (
      <View style={styles.desktopContainer}>
        <Sidebar width={sidebarWidth} activeRoute={activeRoute} />
        <View style={[styles.mainContent, { marginLeft: sidebarWidth }]}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' }, // Hide tab bar on desktop
            }}
          >
            <Tabs.Screen name="dashboard" />
            <Tabs.Screen name="discover" />
            <Tabs.Screen name="opportunities" />
            <Tabs.Screen name="messages" />
            <Tabs.Screen name="more" />
            <Tabs.Screen name="feed" options={{ href: null }} />
            <Tabs.Screen name="connections" options={{ href: null }} />
            <Tabs.Screen name="profile" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }
  
  // For mobile: Use bottom tab bar
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens that shouldn't show in tab bar */}
      <Tabs.Screen
        name="feed"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111827',
  },
  mainContent: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
