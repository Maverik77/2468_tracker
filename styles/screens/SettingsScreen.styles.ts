import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';

export const settingsStyles = StyleSheet.create({
  // Settings-specific title
  settingsTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  
  // Settings content scrollview
  settingsContent: {
    flex: 1,
  },
  
  // Version text styling
  versionText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontSize: 14,
  },
  
  // Copyright text
  copyrightText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  
  // Debug text
  debugText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  
  // Close button text
  closeButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
}); 