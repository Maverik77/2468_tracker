import React from 'react';
import { Modal, View, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, SPACING } from '../constants/theme';

interface FixedModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export const FixedModal: React.FC<FixedModalProps> = ({
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
      statusBarTranslucent={Platform.OS === 'android'}
      hardwareAccelerated={Platform.OS === 'android'}
      supportedOrientations={['portrait', 'landscape']}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
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
  content: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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