import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Alert, Switch, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { storage, Settings } from '../utils/storage';
import * as Updates from 'expo-updates';

// Import separated styles
import { 
  layoutStyles, 
  buttonStyles, 
  buttonTextStyles, 
  cardStyles, 
  formStyles, 
  modalStyles, 
  modalTextStyles 
} from '../styles/common';
import { settingsStyles } from '../styles/screens/SettingsScreen.styles';

// Testing improved OTA update configuration
type NavigationProp = any;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isLandscape, isTablet } = useResponsive();
  const [settings, setSettings] = useState<Settings>({ defaultMultiplier: 1, winningAllFourPaysDouble: false });
  const [defaultMultiplierInput, setDefaultMultiplierInput] = useState('1');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    currentVersion: string;
    updateId: string;
    channel: string;
    runtimeVersion: string;
    isEmbedded: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await storage.loadSettings();
      setSettings(loadedSettings);
      setDefaultMultiplierInput(loadedSettings.defaultMultiplier.toString());
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveDefaultMultiplier = async () => {
    const newMultiplier = parseInt(defaultMultiplierInput);
    if (isNaN(newMultiplier) || newMultiplier < 1) {
      Alert.alert('Invalid Multiplier', 'Please enter a valid number greater than 0.');
      return;
    }

    const updatedSettings = { ...settings, defaultMultiplier: newMultiplier };
    setSettings(updatedSettings);
    
    try {
      await storage.saveSettings(updatedSettings);
      Alert.alert('Success', 'Default multiplier saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const handleToggleWinningAllFour = async () => {
    const updatedSettings = { ...settings, winningAllFourPaysDouble: !settings.winningAllFourPaysDouble };
    setSettings(updatedSettings);
    
    try {
      await storage.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleManualUpdate = async () => {
    try {
      console.log('Checking for updates...');
      const update = await Updates.checkForUpdateAsync();
      
      const debugInfo = getUpdateDebugInfo();
      const currentVersion = Constants.expoConfig?.version || 'Unknown';
      const runtimeVersion = Constants.expoConfig?.runtimeVersion || 'Unknown';
      
      if (update.isAvailable) {
        setUpdateInfo({
          hasUpdate: true,
          currentVersion,
          updateId: debugInfo.updateId,
          channel: debugInfo.channel,
          runtimeVersion: runtimeVersion.toString(),
          isEmbedded: debugInfo.isEmbedded,
          message: 'A new update is available and ready to download!'
        });
      } else {
        setUpdateInfo({
          hasUpdate: false,
          currentVersion,
          updateId: debugInfo.updateId,
          channel: debugInfo.channel,
          runtimeVersion: runtimeVersion.toString(),
          isEmbedded: debugInfo.isEmbedded,
          message: 'You already have the latest version.'
        });
      }
      
      setUpdateModalVisible(true);
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateInfo({
        hasUpdate: false,
        currentVersion: Constants.expoConfig?.version || 'Unknown',
        updateId: 'Error',
        channel: 'Unknown',
        runtimeVersion: 'Unknown',
        isEmbedded: false,
        message: 'Failed to check for updates: ' + (error instanceof Error ? error.message : String(error))
      });
      setUpdateModalVisible(true);
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      setUpdateModalVisible(false);
      // Show a loading state or progress indicator here if needed
      console.log('Downloading update...');
      await Updates.fetchUpdateAsync();
      console.log('Reloading app...');
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Update download failed:', error);
      Alert.alert('Error', 'Failed to download update: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const getUpdateDebugInfo = () => {
    return {
      updateId: Updates.updateId?.substring(0, 8) || 'embedded',
      channel: Updates.channel || 'default',
      isEmbedded: Updates.isEmbeddedLaunch
    };
  };

  return (
    <SafeAreaView style={layoutStyles.container}>
      <ResponsiveContainer>
        <View style={[
          layoutStyles.content,
          isLandscape && layoutStyles.contentLandscape
        ]}>
          {/* Header */}
          <View style={layoutStyles.header}>
            <Text style={[FONTS.h2, { color: COLORS.text, fontWeight: 'bold' }]}>Settings</Text>
            <TouchableOpacity 
              style={buttonStyles.close}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={settingsStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Content */}
          <ScrollView 
            style={styles.settingsContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={[FONTS.h3, styles.settingsTitle]}>App Settings</Text>
            
            {/* Default Multiplier Setting */}
            <View style={styles.settingsSection}>
              <Text style={[FONTS.body, styles.sectionTitle]}>Default Multiplier</Text>
              <Text style={[FONTS.caption, styles.sectionDescription]}>
                Set the default multiplier for new games. This will be applied to all areas (2, 4, 6, 8) when starting a new game.
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={defaultMultiplierInput}
                  onChangeText={setDefaultMultiplierInput}
                  placeholder="Enter multiplier"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveDefaultMultiplier}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={[FONTS.caption, styles.currentValue]}>
                Current: {settings.defaultMultiplier}
              </Text>
            </View>

            {/* Winning All Four Hands Setting */}
            <View style={styles.settingsSection}>
              <Text style={[FONTS.body, styles.sectionTitle]}>Winning All 4 Hands Pays Double</Text>
              <Text style={[FONTS.caption, styles.sectionDescription]}>
                When enabled, if a player wins all 4 hands (2, 4, 6, 8) in a round, their winnings for that round will be doubled.
              </Text>
              
              <View style={styles.switchContainer}>
                <Text style={[FONTS.body, styles.switchLabel]}>
                  {settings.winningAllFourPaysDouble ? 'Enabled' : 'Disabled'}
                </Text>
                <Switch
                  value={settings.winningAllFourPaysDouble}
                  onValueChange={handleToggleWinningAllFour}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.background}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleManualUpdate}
              activeOpacity={0.7}
            >
              <Text style={styles.updateButtonText}>Check for Updates</Text>
            </TouchableOpacity>

            {/* Debug Info Section - Now scrollable */}
            <View style={styles.debugSection}>
              <Text style={[FONTS.caption, styles.debugText]}>
                Channel: {getUpdateDebugInfo().channel}
              </Text>
              <Text style={[FONTS.caption, styles.debugText]}>
                Update ID: {getUpdateDebugInfo().updateId}
              </Text>
              <Text style={[FONTS.caption, styles.debugText]}>
                Version: {Constants.expoConfig?.version}
              </Text>
            </View>
            
            {/* Simplified Footer */}
            <View style={styles.footer}>
              <Text style={[FONTS.caption, styles.copyrightText]}>
                Copyright 2025 by Erik Wagner
              </Text>
            </View>
          </ScrollView>
        </View>
      </ResponsiveContainer>

      {/* Update Info Modal */}
      <Modal
        visible={updateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[FONTS.h3, styles.modalTitle]}>
              {updateInfo?.hasUpdate ? '🚀 Update Available' : '✅ Up to Date'}
            </Text>
            
            <Text style={[FONTS.body, styles.modalMessage]}>
              {updateInfo?.message}
            </Text>
            
            <View style={styles.versionInfoContainer}>
              <Text style={[FONTS.caption, styles.versionInfoTitle]}>Version Information:</Text>
              <Text style={[FONTS.caption, styles.versionInfoText]}>
                Current Version: {updateInfo?.currentVersion}
              </Text>
              <Text style={[FONTS.caption, styles.versionInfoText]}>
                Runtime Version: {updateInfo?.runtimeVersion}
              </Text>
              <Text style={[FONTS.caption, styles.versionInfoText]}>
                Channel: {updateInfo?.channel}
              </Text>
              <Text style={[FONTS.caption, styles.versionInfoText]}>
                Update ID: {updateInfo?.updateId}
              </Text>
              <Text style={[FONTS.caption, styles.versionInfoText]}>
                Build Type: {updateInfo?.isEmbedded ? 'Embedded' : 'OTA'}
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              {updateInfo?.hasUpdate ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setUpdateModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Later</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.updateButton]}
                    onPress={handleDownloadUpdate}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.updateButtonText}>Update Now</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.okButton]}
                  onPress={() => setUpdateModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Styles are now imported from separated style files
// No local StyleSheet.create needed!