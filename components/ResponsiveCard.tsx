import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, SPACING, LAYOUT, FONTS } from '../constants/theme';

interface ResponsiveCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  children,
  style,
  variant = 'default',
}) => {
  const { isLandscape } = useResponsive();

  const getCardStyle = () => {
    const baseStyle = {
      padding: SPACING.md,
      borderRadius: LAYOUT.borderRadius,
      margin: isLandscape ? SPACING.sm : SPACING.md,
      flex: isLandscape ? 1 : undefined,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: COLORS.surface,
          shadowColor: COLORS.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: COLORS.background,
          borderWidth: 1,
          borderColor: COLORS.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: COLORS.surface,
        };
    }
  };

  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {title && (
        <Text style={[FONTS.h3, styles.title]}>{title}</Text>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  title: {
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
}); 