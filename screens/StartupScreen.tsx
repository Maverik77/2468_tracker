import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Startup'>;

export const StartupScreen: React.FC = () => {
  const { isLandscape, isTablet } = useResponsive();
  const navigation = useNavigation<NavigationProp>();

  const handleNewGame = () => {
    navigation.navigate('Player');
  };

  const handleSavedGames = () => {
    navigation.navigate('Games');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image 
              source={require('../assets/new_logo.jpg')} 
              style={[
                styles.logo,
                isTablet && styles.logoTablet
              ]}
              resizeMode="contain"
            />
          </View>

          {/* App Title */}
          <View style={styles.titleSection}>
            <View style={styles.titleContainer}>
              <Text style={[FONTS.h1, styles.title]}>
                2468{' '}
              </Text>
              <Text style={[FONTS.h1, styles.scorekeeperTitle]}>
                Scorekeeper
              </Text>
            </View>
            <Text style={[FONTS.body, styles.subtitle]}>
              Keep track of your 2468 games!
            </Text>
          </View>

          {/* Game Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={[
                styles.newGameButton,
                isTablet && styles.newGameButtonTablet
              ]}
              onPress={handleNewGame}
              activeOpacity={0.8}
            >
              <Text style={[
                FONTS.h2, 
                styles.newGameButtonText,
                isTablet && styles.newGameButtonTextTablet
              ]}>
                New Game
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.savedGamesButton,
                isTablet && styles.savedGamesButtonTablet
              ]}
              onPress={handleSavedGames}
              activeOpacity={0.8}
            >
              <Text style={[
                FONTS.h2, 
                styles.savedGamesButtonText,
                isTablet && styles.savedGamesButtonTextTablet
              ]}>
                Saved Games
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer with Settings */}
        <View style={[
          styles.footer,
          isLandscape && styles.footerLandscape
        ]}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
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
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoTablet: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontSize: 42,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 18,
  },
  buttonSection: {
    alignItems: 'center',
  },
  newGameButton: {
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
  },
  newGameButtonTablet: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xl,
    minWidth: 280,
  },
  newGameButtonText: {
    color: COLORS.background,
    textAlign: 'center',
    fontWeight: '600',
  },
  newGameButtonTextTablet: {
    fontSize: 24,
  },
  savedGamesButton: {
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
    marginTop: SPACING.lg,
  },
  savedGamesButtonTablet: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xl,
    minWidth: 280,
  },
  savedGamesButtonText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  savedGamesButtonTextTablet: {
    fontSize: 24,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'flex-end',
  },
  footerLandscape: {
    alignItems: 'center',
  },
  settingsButton: {
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  scorekeeperTitle: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
  },
}); 