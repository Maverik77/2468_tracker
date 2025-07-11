import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export const buttonStyles = StyleSheet.create({
  // Primary button (main actions)
  primary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  // Secondary button (secondary actions)
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  // Large button (for prominent actions like "New Game")
  large: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  
  // Large secondary button
  largeSecondary: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  
  // Close/Cancel button
  close: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  
  // Settings/Icon button
  icon: {
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Update button
  update: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
});

export const buttonTextStyles = StyleSheet.create({
  // Primary button text
  primary: {
    color: COLORS.background,
    fontWeight: '600',
  },
  
  // Secondary button text
  secondary: {
    color: COLORS.text,
    fontWeight: '600',
  },
  
  // Primary button text (colored)
  primaryColored: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Close button text
  close: {
    fontSize: 24,
    color: COLORS.text,
  },
  
  // Icon text
  icon: {
    fontSize: 24,
  },
}); 