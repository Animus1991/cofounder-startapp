import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingScreen } from '../src/components/LoadingScreen';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // This screen is just a redirect, handled by _layout.tsx
  }, []);

  return <LoadingScreen message="Welcome to CoFounder Connect" />;
}
