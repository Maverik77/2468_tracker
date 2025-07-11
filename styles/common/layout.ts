import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export const layoutStyles = StyleSheet.create({
  // Screen container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Main content area
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  
  // Content with landscape adjustments
  contentLandscape: {
    paddingHorizontal: SPACING.lg,
  },
  
  // Centered content
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  
  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  // Title section
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  
  // Title container (for multi-part titles)
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  
  // Button section
  buttonSection: {
    alignItems: 'center',
  },
  
  // Footer
  footer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  
  // Footer with landscape adjustments
  footerLandscape: {
    alignItems: 'center',
  },
  
  // Footer positioned at end
  footerEnd: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'flex-end',
  },
  
  // Scroll content padding
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
}); 