import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
};

export const SPACING = {
  xs: 4,  // Keep numeric for React Native compatibility, but use responsively
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Responsive spacing helpers for scalable layouts
export const FLUID_SPACING = {
  xs: 'clamp(0.25rem, 1vw, 0.5rem)',    // 4-8px fluid
  sm: 'clamp(0.5rem, 2vw, 1rem)',      // 8-16px fluid  
  md: 'clamp(1rem, 3vw, 2rem)',        // 16-32px fluid
  lg: 'clamp(1.5rem, 4vw, 3rem)',      // 24-48px fluid
  xl: 'clamp(2rem, 5vw, 4rem)',        // 32-64px fluid
};

// Simplified responsive system - only orientation matters now

export const FONTS = {
  h1: {
    fontSize: 28, // Simplified - one size fits all
    fontWeight: 'bold' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
  },
};

export const LAYOUT = {
  containerPadding: SPACING.lg,
  cardPadding: SPACING.md,
  borderRadius: 12,
};

// Responsive sizing helpers for React Native
export const RESPONSIVE = {
  // Button sizes that scale with screen size
  buttonSizeSmall: Math.min(screenWidth, screenHeight) * 0.08, // ~40-48px on most devices
  buttonSizeMedium: Math.min(screenWidth, screenHeight) * 0.1,  // ~48-60px on most devices
  buttonSizeLarge: Math.min(screenWidth, screenHeight) * 0.12,  // ~60-72px on most devices
  
  // Icon sizes that scale with screen
  iconSmall: Math.min(screenWidth, screenHeight) * 0.04,  // ~20-24px
  iconMedium: Math.min(screenWidth, screenHeight) * 0.05, // ~24-30px
  iconLarge: Math.min(screenWidth, screenHeight) * 0.06,  // ~30-36px
}; 