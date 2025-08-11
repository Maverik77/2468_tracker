import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { storage, Game } from '../utils/storage';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const GamesScreen: React.FC = () => {
  const { isLandscape  } = useResponsive();
  const navigation = useNavigation<NavigationProp>();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const loadedGames = await storage.loadGames();
      setGames(loadedGames.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGamePress = (game: Game) => {
    navigation.navigate('Main', { game });
  };

  const handleDeleteGame = async (gameId: string) => {
    Alert.alert(
      'Delete Game',
      'Are you sure you want to delete this game? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteGame(gameId);
              await loadGames();
            } catch (error) {
              console.error('Error deleting game:', error);
            }
          }
        }
      ]
    );
  };

  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX > 50) { // Swipe from left to right - go to Startup
        navigation.navigate('Startup');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPlayerNames = (players: any[]) => {
    return players.map(player => `${player.firstName} ${player.lastName}`).join(', ');
  };

  const getTotalRounds = (game: Game) => {
    return Object.keys(game.rounds).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <PanGestureHandler onGestureEvent={handleSwipeGesture}>
        <View style={{ flex: 1 }}>
          <ResponsiveContainer>
            <View style={[
              styles.content,
              isLandscape && styles.contentLandscape
            ]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[FONTS.h2, styles.title]}>2468</Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Startup')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.homeButtonText}>🏠</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.settingsButtonText}>⚙️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Games List */}
              <ScrollView 
                style={styles.gamesList}
                showsVerticalScrollIndicator={false}
              >
                {isLoading ? (
                  <Text style={[FONTS.body, styles.loadingText]}>Loading games...</Text>
                ) : games.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[FONTS.h3, styles.emptyStateTitle]}>No saved games</Text>
                    <Text style={[FONTS.body, styles.emptyStateText]}>
                      Start a new game to see it here
                    </Text>
                    <TouchableOpacity 
                      style={styles.startFirstGameButton}
                      onPress={() => navigation.navigate('Player')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.startFirstGameButtonText}>Start Your First Game</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  games.map((game) => (
                    <TouchableOpacity
                      key={game.id}
                      style={[
                        styles.gameCard,
                        
                      ]}
                      onPress={() => handleGamePress(game)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.gameCardHeader}>
                        <Text style={[FONTS.h3, styles.gameDate]}>
                          {formatDate(game.createdAt)}
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteGame(game.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={[FONTS.body, styles.playerNames]}>
                        {getPlayerNames(game.players)}
                      </Text>
                      
                      <View style={styles.gameStats}>
                        <Text style={[FONTS.caption, styles.gameStat]}>
                          {game.players.length} players
                        </Text>
                        <Text style={[FONTS.caption, styles.gameStat]}>
                          {getTotalRounds(game)} rounds
                        </Text>
                        <Text style={[FONTS.caption, styles.gameStat]}>
                          Round {game.currentRound}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </ResponsiveContainer>
        </View>
      </PanGestureHandler>
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
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  homeButton: {
    padding: SPACING.xs,
  },
  homeButtonText: {
    fontSize: 24,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  newGameButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  newGameButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  gamesList: {
    flex: 1,
  },
  loadingText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateTitle: {
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  startFirstGameButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  startFirstGameButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  gameCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
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
  gameCardTablet: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gameDate: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  playerNames: {
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  gameStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gameStat: {
    color: COLORS.textSecondary,
  },
}); 