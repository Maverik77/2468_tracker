import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
      // Determine orientation based on dimensions
      const isLandscape = window.width > window.height;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    });

    // Get initial orientation
    const getInitialOrientation = async () => {
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