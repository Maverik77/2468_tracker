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

export const BREAKPOINTS = {
  phone: 480,
  tablet: 768,
  desktop: 1024,
};

export const isPhone = screenWidth < BREAKPOINTS.phone;
export const isTablet = screenWidth >= BREAKPOINTS.phone && screenWidth < BREAKPOINTS.tablet;
export const isDesktop = screenWidth >= BREAKPOINTS.tablet;

export const FONTS = {
  h1: {
    fontSize: isPhone ? 24 : isTablet ? 32 : 40,
    fontWeight: 'bold' as const,
  },
  h2: {
    fontSize: isPhone ? 20 : isTablet ? 28 : 32,
    fontWeight: 'bold' as const,
  },
  h3: {
    fontSize: isPhone ? 18 : isTablet ? 24 : 28,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: isPhone ? 16 : isTablet ? 18 : 20,
    fontWeight: 'normal' as const,
  },
  caption: {
    fontSize: isPhone ? 14 : isTablet ? 16 : 18,
    fontWeight: 'normal' as const,
  },
};

export const LAYOUT = {
  containerPadding: isPhone ? SPACING.md : isTablet ? SPACING.lg : SPACING.xl,
  cardPadding: isPhone ? SPACING.sm : isTablet ? SPACING.md : SPACING.lg,
  borderRadius: isPhone ? 8 : isTablet ? 12 : 16,
}; 