import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { ResponsiveCard } from '../components/ResponsiveCard';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export const HomeScreen: React.FC = () => {
  const { isLandscape , width, height, orientation } = useResponsive();

  return (
    <ResponsiveContainer>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[FONTS.h1, styles.title]}>
            Responsive App
          </Text>
          <Text style={[FONTS.body, styles.subtitle]}>
            Adapts to {orientation} mode on {isTablet ? 'tablet' : 'phone'}
          </Text>
          <Text style={[FONTS.caption, styles.dimensions]}>
            Screen: {width} × {height}
          </Text>
          
          {/* Orientation Indicator */}
          <View style={[
            styles.orientationIndicator,
            isLandscape && styles.orientationIndicatorLandscape
          ]}>
            <Text style={[FONTS.caption, styles.orientationText]}>
              {isLandscape ? '🔄 Landscape' : '📱 Portrait'}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={[
          styles.content,
          isLandscape ? styles.contentLandscape : styles.contentPortrait
        ]}>
          {/* Left Column */}
          <ResponsiveCard 
            title="Features" 
            variant="elevated"
            style={isLandscape ? styles.landscapeCard : styles.portraitCard}
          >
            <Text style={[FONTS.body, styles.cardText]}>
              This app demonstrates responsive design principles:
            </Text>
            <View style={styles.featureList}>
              <Text style={[FONTS.caption, styles.featureItem]}>
                • Adapts to portrait and landscape modes
              </Text>
              <Text style={[FONTS.caption, styles.featureItem]}>
                • Responsive to different screen sizes
              </Text>
              <Text style={[FONTS.caption, styles.featureItem]}>
                • Optimized for phones and tablets
              </Text>
              <Text style={[FONTS.caption, styles.featureItem]}>
                • Cross-platform compatibility
              </Text>
            </View>
          </ResponsiveCard>

          {/* Right Column */}
          <ResponsiveCard 
            title="Layout Info" 
            variant="outlined"
            style={isLandscape ? styles.landscapeCard : styles.portraitCard}
          >
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[FONTS.caption, styles.infoLabel]}>Orientation</Text>
                <Text style={[FONTS.body, styles.infoValue]}>{orientation}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[FONTS.caption, styles.infoLabel]}>Device Type</Text>
                <Text style={[FONTS.body, styles.infoValue]}>
                  {isTablet ? 'Tablet' : 'Phone'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[FONTS.caption, styles.infoLabel]}>Width</Text>
                <Text style={[FONTS.body, styles.infoValue]}>{width}px</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[FONTS.caption, styles.infoLabel]}>Height</Text>
                <Text style={[FONTS.body, styles.infoValue]}>{height}px</Text>
              </View>
            </View>
          </ResponsiveCard>
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  title: {
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  dimensions: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  orientationIndicator: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginTop: SPACING.sm,
  },
  orientationIndicatorLandscape: {
    backgroundColor: COLORS.secondary,
  },
  orientationText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  contentPortrait: {
    flexDirection: 'column',
  },
  contentLandscape: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  portraitCard: {
    marginBottom: SPACING.md,
  },
  landscapeCard: {
    flex: 1,
  },
  cardText: {
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  featureList: {
    marginTop: SPACING.sm,
  },
  featureItem: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  infoItem: {
    flex: 1,
    minWidth: 120,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    color: COLORS.text,
    fontWeight: '600',
  },
}); 