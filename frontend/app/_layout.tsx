import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, isLoading, checkAuth, needsOnboarding, exchangeSession } = useAuthStore();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          // Check for session_id in URL fragment (for OAuth callback)
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const hash = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            const sessionId = params.get('session_id');
            if (sessionId) {
              await exchangeSession(sessionId);
              setIsCheckingSession(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
      setIsCheckingSession(false);
    };

    handleDeepLink();
    checkAuth();
  }, []);

  useEffect(() => {
    if (!navigationState?.key || isLoading || isCheckingSession) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isAuthenticated) {
      if (needsOnboarding) {
        router.replace('/(auth)/onboarding');
      } else if (inAuthGroup || segments.length === 0 || segments[0] === 'index') {
        router.replace('/(tabs)/feed');
      }
    } else {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, segments, navigationState?.key, isLoading, isCheckingSession, needsOnboarding]);

  if (isLoading || isCheckingSession) {
    return <LoadingScreen message="Starting CoFounderBay..." />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#111827' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="events" options={{ headerShown: false }} />
        <Stack.Screen name="marketplace" options={{ headerShown: false }} />
        <Stack.Screen name="mentoring" options={{ headerShown: false }} />
        <Stack.Screen name="learning" options={{ headerShown: false }} />
        <Stack.Screen name="groups" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="matches" options={{ headerShown: false }} />
        <Stack.Screen name="communities" options={{ headerShown: false }} />
        <Stack.Screen name="milestones" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="pipeline" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
