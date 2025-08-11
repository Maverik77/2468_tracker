import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, SPACING, LAYOUT } from '../constants/theme';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  padding = 'medium',
  backgroundColor = COLORS.background,
}) => {
  const { isLandscape } = useResponsive();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return 
      case 'medium':
        return 
      case 'large':
        return 
      default:
        return LAYOUT.containerPadding;
    }
  };

  return (
    <View 
      style={[
        styles.container,
        {
          padding: getPadding(),
          backgroundColor,
          flexDirection: isLandscape ? 'row' : 'column',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 