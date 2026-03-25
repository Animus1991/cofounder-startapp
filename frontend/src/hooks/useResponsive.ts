import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  columns: number;
  padding: number;
  cardWidth: number;
  sidebarWidth: number;
  showSidebar: boolean;
  contentMaxWidth: number;
}

const getDeviceType = (width: number): DeviceType => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getResponsiveValues = (dimensions: ScaledSize): ResponsiveInfo => {
  const { width, height } = dimensions;
  const deviceType = getDeviceType(width);
  const isLandscape = width > height;
  
  const config: ResponsiveInfo = {
    width,
    height,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isLandscape,
    columns: 1,
    padding: 16,
    cardWidth: width - 32,
    sidebarWidth: 0,
    showSidebar: false,
    contentMaxWidth: width,
  };
  
  if (deviceType === 'mobile') {
    config.columns = 1;
    config.padding = 16;
    config.cardWidth = width - 32;
    config.showSidebar = false;
    config.contentMaxWidth = width;
  } else if (deviceType === 'tablet') {
    config.columns = 2;
    config.padding = 24;
    config.sidebarWidth = 280;
    config.showSidebar = true;
    config.cardWidth = (width - config.sidebarWidth - 72) / 2;
    config.contentMaxWidth = width - config.sidebarWidth;
  } else {
    config.columns = 3;
    config.padding = 32;
    config.sidebarWidth = 280;
    config.showSidebar = true;
    config.cardWidth = Math.min(360, (width - config.sidebarWidth - 128) / 3);
    config.contentMaxWidth = Math.min(1400, width - config.sidebarWidth);
  }
  
  return config;
};

export function useResponsive(): ResponsiveInfo {
  const [responsive, setResponsive] = useState<ResponsiveInfo>(
    getResponsiveValues(Dimensions.get('window'))
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setResponsive(getResponsiveValues(window));
    });

    return () => subscription?.remove();
  }, []);

  return responsive;
}

export default useResponsive;
