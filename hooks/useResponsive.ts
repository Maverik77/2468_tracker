import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Device from 'expo-device';

export interface ResponsiveState {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
}

export const useResponsive = (): ResponsiveState => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    // Initialize orientation based on initial dimensions
    const initialDimensions = Dimensions.get('window');
    return initialDimensions.width > initialDimensions.height ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
      // Always use dimension-based detection for orientation
      const isLandscape = window.width > window.height;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    });

    // For web, always use dimension-based detection
    // For native platforms, try device orientation API with fallback
    const getInitialOrientation = async () => {
      if (Platform.OS === 'web') {
        // Web: Always use dimensions
        const isLandscape = dimensions.width > dimensions.height;
        setOrientation(isLandscape ? 'landscape' : 'portrait');
      } else {
        // Native: Try device orientation API, fallback to dimensions
        try {
          const currentOrientation = await ScreenOrientation.getOrientationAsync();
          const isLandscape = currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || 
                             currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
          setOrientation(isLandscape ? 'landscape' : 'portrait');
        } catch (error) {
          // Fallback to dimension-based detection
          const isLandscape = dimensions.width > dimensions.height;
          setOrientation(isLandscape ? 'landscape' : 'portrait');
        }
      }
    };

    getInitialOrientation();

    return () => subscription?.remove();
  }, [dimensions.width, dimensions.height]);

  const isTablet = Device.deviceType === Device.DeviceType.TABLET;
  const isPhone = Device.deviceType === Device.DeviceType.PHONE;
  const isLandscape = orientation === 'landscape';
  const isPortrait = orientation === 'portrait';

  return {
    width: dimensions.width,
    height: dimensions.height,
    orientation,
    isTablet,
    isPhone,
    isLandscape,
    isPortrait,
  };
}; 