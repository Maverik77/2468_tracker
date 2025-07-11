import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export const cardStyles = StyleSheet.create({
  // Standard card container
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Compact card for smaller content
  compact: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Debug/info card
  debug: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  
  // Card title
  title: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  
  // Card description/subtitle
  description: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  
  // Small description text
  smallDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  
  // Current value display
  currentValue: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
}); 