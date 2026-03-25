import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import Sidebar from './Sidebar';

interface ResponsiveLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  header?: ReactNode;
  scrollable?: boolean;
  activeRoute?: string;
}

export default function ResponsiveLayout({
  children,
  showHeader = true,
  header,
  scrollable = true,
  activeRoute,
}: ResponsiveLayoutProps) {
  const { showSidebar, sidebarWidth, contentMaxWidth, padding, isDesktop, isTablet } = useResponsive();

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { padding, maxWidth: contentMaxWidth },
        (isDesktop || isTablet) && styles.centeredContent,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { padding }]}>{children}</View>
  );

  if (!showSidebar) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {showHeader && header}
        {content}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.desktopContainer}>
        <Sidebar width={sidebarWidth} activeRoute={activeRoute} />
        <View style={[styles.mainContent, { marginLeft: sidebarWidth }]}>
          {showHeader && header}
          {content}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centeredContent: {
    alignSelf: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
  },
});
