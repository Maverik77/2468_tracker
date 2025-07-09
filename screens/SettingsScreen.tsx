import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { storage, Settings } from '../utils/storage';
import * as Updates from 'expo-updates';

// Testing improved OTA update configuration
type NavigationProp = any;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isLandscape, isTablet } = useResponsive();
  const [settings, setSettings] = useState<Settings>({ defaultMultiplier: 1, winningAllFourPaysDouble: false });
  const [defaultMultiplierInput, setDefaultMultiplierInput] = useState('1');

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
      
      if (update.isAvailable) {
        Alert.alert(
          'Update Available', 
          'A new update is available. Download now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Update', 
              onPress: async () => {
                console.log('Downloading update...');
                await Updates.fetchUpdateAsync();
                console.log('Reloading app...');
                await Updates.reloadAsync();
              }
            }
          ]
        );
      } else {
        Alert.alert('No Updates', 'You already have the latest version.');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      Alert.alert('Error', 'Failed to check for updates: ' + error.message);
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
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer>
        <View style={[
          styles.content,
          isLandscape && styles.contentLandscape
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[FONTS.h2, styles.title]}>Settings</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Content */}
          <View style={styles.settingsContent}>
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
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[FONTS.caption, styles.versionText]}>
              Version {Constants.expoConfig?.version}
            </Text>
            <Text style={[FONTS.caption, styles.copyrightText]}>
              Copyright 2025 by Erik Wagner
            </Text>
            <Text style={[FONTS.caption, styles.debugText]}>
              Channel: {getUpdateDebugInfo().channel} | Update: {getUpdateDebugInfo().updateId}
            </Text>
          </View>
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  contentLandscape: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 24,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  settingsSection: {
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
  sectionTitle: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
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
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  saveButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  currentValue: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  copyrightText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  switchLabel: {
    color: COLORS.text,
    flex: 1,
  },
  versionText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  updateButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  debugText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
}); 