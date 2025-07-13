import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export const modalStyles = StyleSheet.create({
  // Modal overlay background
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  
  // Modal content container
  content: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Modal title
  title: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  
  // Modal message/body text
  message: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  
  // Version info container
  versionInfoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  
  // Version info title
  versionInfoTitle: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  
  // Version info text
  versionInfoText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontSize: 12,
  },
  
  // Modal button container
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  
  // Modal button base
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  // Cancel/secondary modal button
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  // OK/primary modal button
  okButton: {
    backgroundColor: COLORS.primary,
  },
});

export const modalTextStyles = StyleSheet.create({
  // Cancel button text
  cancel: {
    color: COLORS.text,
    fontWeight: '600',
  },
  
  // OK button text
  ok: {
    color: COLORS.background,
    fontWeight: '600',
  },
  
  // Primary action text
  primary: {
    color: COLORS.background,
    fontWeight: '600',
  },
}); 