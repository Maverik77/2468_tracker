import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, SPACING } from '../constants/theme';

interface OrientationAwareModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export const OrientationAwareModal: React.FC<OrientationAwareModalProps> = ({
  visible,
  onRequestClose,
  children,
}) => {
  const { isLandscape, isTablet } = useResponsive();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onRequestClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={[
        styles.overlay,
        isLandscape && styles.overlayLandscape
      ]}>
        <View style={[
          styles.content,
          isTablet && styles.contentTablet,
          isLandscape && styles.contentLandscape
        ]}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  overlayLandscape: {
    paddingHorizontal: SPACING.xl,
  },
  content: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  contentTablet: {
    maxWidth: 500,
    padding: SPACING.xl,
  },
  contentLandscape: {
    maxWidth: 600,
    padding: SPACING.xl,
  },
}); 