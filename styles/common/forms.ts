import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export const formStyles = StyleSheet.create({
  // Input container (for input + button combinations)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  
  // Standard text input
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  
  // Switch container
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  // Switch label
  switchLabel: {
    color: COLORS.text,
    flex: 1,
  },
  
  // Form section title
  sectionTitle: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  
  // Form section description
  sectionDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
}); 