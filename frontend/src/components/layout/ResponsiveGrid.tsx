import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveGridProps {
  children: ReactNode;
  minItemWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export default function ResponsiveGrid({
  children,
  minItemWidth = 300,
  gap = 16,
  style,
}: ResponsiveGridProps) {
  const { width, sidebarWidth, showSidebar, padding } = useResponsive();
  
  const availableWidth = showSidebar ? width - sidebarWidth - padding * 2 : width - padding * 2;
  const columns = Math.max(1, Math.floor(availableWidth / minItemWidth));
  const itemWidth = (availableWidth - gap * (columns - 1)) / columns;

  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, { gap }, style]}>
      {childArray.map((child, index) => (
        <View key={index} style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
