import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Modal,
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { SwipeablePlayerItem } from '../components/SwipeablePlayerItem';
import { FixedModal } from '../components/FixedModal';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { storage, Player, Game } from '../utils/storage';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

export const PlayerScreen: React.FC = () => {
  const { isLandscape, isTablet } = useResponsive();
  const navigation = useNavigation<NavigationProp>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '', initials: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Load players from storage on component mount
  useEffect(() => {
    loadPlayersFromStorage();
  }, []);

  const loadPlayersFromStorage = async () => {
    try {
      const storedPlayers = await storage.loadPlayers();
      setPlayers(storedPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter players based on search text
  const filteredPlayers = players.filter(player => {
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    return fullName.includes(searchText.toLowerCase());
  });

  const handleAddPlayer = async () => {
    if (newPlayer.firstName.trim() && newPlayer.lastName.trim()) {
      const player: Player = {
        id: Date.now().toString(),
        firstName: newPlayer.firstName.trim(),
        lastName: newPlayer.lastName.trim(),
        initials: newPlayer.initials.trim() || `${newPlayer.firstName.trim()[0]}${newPlayer.lastName.trim()[0]}`,
        selected: false,
      };
      
      await storage.addPlayer(player);
      setNewPlayer({ firstName: '', lastName: '', initials: '' });
      setShowModal(false);
      
      // Force reload the players list
      await loadPlayersFromStorage();
    }
  };

  const handleEditPlayer = async () => {
    if (editingPlayer && newPlayer.firstName.trim() && newPlayer.lastName.trim()) {
      const updatedPlayer: Player = {
        ...editingPlayer,
        firstName: newPlayer.firstName.trim(),
        lastName: newPlayer.lastName.trim(),
        initials: newPlayer.initials.trim() || `${newPlayer.firstName.trim()[0]}${newPlayer.lastName.trim()[0]}`,
      };
      
      await storage.updatePlayer(updatedPlayer);
      setNewPlayer({ firstName: '', lastName: '', initials: '' });
      setEditingPlayer(null);
      setShowModal(false);
      
      // Force reload the players list
      await loadPlayersFromStorage();
    }
  };

  const handleOpenEditModal = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayer({ 
      firstName: player.firstName, 
      lastName: player.lastName, 
      initials: player.initials || `${player.firstName[0]}${player.lastName[0]}`
    });
    setShowModal(true);
  };

  const handlePlayerToggle = async (playerId: string) => {
    const selectedCount = players.filter(player => player.selected).length;
    const playerToToggle = players.find(player => player.id === playerId);
    
    let updatedPlayers: Player[];
    
    if (playerToToggle?.selected) {
      // Always allow deselection
      updatedPlayers = players.map(player => 
        player.id === playerId 
          ? { ...player, selected: false }
          : player
      );
    } else if (selectedCount < 3) {
      // Only allow selection if less than 3 are selected
      updatedPlayers = players.map(player => 
        player.id === playerId 
          ? { ...player, selected: true }
          : player
      );
    } else {
      return; // Don't update if trying to select more than 3
    }
    
    setPlayers(updatedPlayers);
    
    // Save to storage
    try {
      await storage.savePlayers(updatedPlayers);
    } catch (error) {
      console.error('Error saving players:', error);
    }
  };

  const handlePlayerDelete = async (playerId: string) => {
    const updatedPlayers = players.filter(player => player.id !== playerId);
    setPlayers(updatedPlayers);
    
    // Save to storage
    try {
      await storage.savePlayers(updatedPlayers);
    } catch (error) {
      console.error('Error saving players after delete:', error);
    }
  };

  const handleStartGame = async () => {
    const selectedPlayers = players.filter(player => player.selected);
    if (selectedPlayers.length > 0) {
      console.log('Starting game with players:', selectedPlayers);
      
      // Create a new game and save it
      const newGame: Game = {
        id: Date.now().toString(),
        players: selectedPlayers,
        createdAt: new Date().toISOString(),
        rounds: {},
        currentRound: 1,
      };
      
      try {
        await storage.saveGame(newGame);
        navigation.navigate('Main', { game: newGame });
      } catch (error) {
        console.error('Error creating game:', error);
        // Fallback to old navigation if save fails
        navigation.navigate('Main', { selectedPlayers });
      }
    }
  };

  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX > 50) { // Swipe from left to right - go to Startup
        navigation.navigate('Startup');
      } else if (translationX < -50) { // Swipe from right to left - check for active game
        // Check if there are any saved rounds to resume
        // For now, just navigate to Main with selected players if any
        const selectedPlayers = players.filter(player => player.selected);
        if (selectedPlayers.length > 0) {
          navigation.navigate('Main', { selectedPlayers });
        }
      }
    }
  };

  const selectedCount = players.filter(player => player.selected).length;

  return (
    <SafeAreaView style={styles.container}>
      <PanGestureHandler onGestureEvent={handleSwipeGesture}>
        <View style={{ flex: 1 }}>
          <ResponsiveContainer>
            <View style={[
              styles.content,
              isLandscape && styles.contentLandscape
            ]}>
              {/* Left Section - New Player Form */}
              <View style={[
                styles.leftSection,
                isLandscape && styles.leftSectionLandscape
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

                {/* Search Input */}
                <View style={styles.searchSection}>
                  <View style={styles.searchInputContainer}>
                    <TextInput
                      style={[
                        styles.searchInput,
                        isTablet && styles.searchInputTablet
                      ]}
                      placeholder="Search players..."
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={() => setSearchText('')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearSearchText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Start Game Button */}
                {selectedCount > 0 && (
                  <View style={styles.startGameSection}>
                    <TouchableOpacity 
                      style={[
                        styles.startGameButton,
                        isTablet && styles.startGameButtonTablet
                      ]}
                      onPress={handleStartGame}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        FONTS.h3, 
                        styles.startGameButtonText,
                        isTablet && styles.startGameButtonTextTablet
                      ]}>
                        Start Game ({selectedCount} selected)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Player List - Shows immediately below in portrait mode */}
                {!isLandscape && (
                  <View style={styles.playerListSection}>
                    <View style={styles.listTitleRow}>
                      <Text style={[FONTS.h3, styles.listTitle]}>
                        Available Players ({filteredPlayers.length})
                      </Text>
                      <TouchableOpacity 
                        style={styles.addPlayerIconButton}
                        onPress={() => setShowModal(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.addPlayerIconButtonText}>➕</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView 
                      style={styles.playerList}
                      showsVerticalScrollIndicator={false}
                    >
                      {filteredPlayers.map(player => (
                        <SwipeablePlayerItem
                          key={player.id}
                          player={player}
                          onToggle={handlePlayerToggle}
                          onDelete={handlePlayerDelete}
                          onEdit={handleOpenEditModal}
                          isTablet={isTablet}
                        />
                      ))}
                      {filteredPlayers.length === 0 && (
                        <Text style={[FONTS.caption, styles.noPlayersText]}>
                          {searchText ? 'No players found' : 'No players added yet'}
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Right Section - Player List (Landscape only) */}
              {isLandscape && (
                <View style={styles.rightSection}>
                  <View style={styles.listTitleRow}>
                    <Text style={[FONTS.h3, styles.listTitle]}>
                      Available Players ({filteredPlayers.length})
                    </Text>
                    <TouchableOpacity 
                      style={styles.addPlayerIconButton}
                      onPress={() => setShowModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addPlayerIconButtonText}>➕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView 
                    style={styles.playerList}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredPlayers.map(player => (
                      <SwipeablePlayerItem
                        key={player.id}
                        player={player}
                        onToggle={handlePlayerToggle}
                        onDelete={handlePlayerDelete}
                        onEdit={handleOpenEditModal}
                        isTablet={isTablet}
                      />
                    ))}
                    {filteredPlayers.length === 0 && (
                      <Text style={[FONTS.caption, styles.noPlayersText]}>
                        {searchText ? 'No players found' : 'No players added yet'}
                      </Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* New Player Modal */}
            <FixedModal
              visible={showModal}
              onRequestClose={() => setShowModal(false)}
            >
              <Text style={[FONTS.h2, styles.modalTitle]}>
                {editingPlayer ? 'Edit Player' : 'Add New Player'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[FONTS.caption, styles.inputLabel]}>First Name</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    isTablet && styles.modalInputTablet
                  ]}
                  value={newPlayer.firstName}
                  onChangeText={(text) => setNewPlayer({...newPlayer, firstName: text})}
                  placeholder="Enter first name"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[FONTS.caption, styles.inputLabel]}>Last Name</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    isTablet && styles.modalInputTablet
                  ]}
                  value={newPlayer.lastName}
                  onChangeText={(text) => setNewPlayer({...newPlayer, lastName: text})}
                  placeholder="Enter last name"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[FONTS.caption, styles.inputLabel]}>Initials</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    isTablet && styles.modalInputTablet
                  ]}
                  value={newPlayer.initials}
                  onChangeText={(text) => setNewPlayer({...newPlayer, initials: text})}
                  placeholder="Enter initials (optional)"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setNewPlayer({ firstName: '', lastName: '', initials: '' });
                    setEditingPlayer(null);
                    setShowModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    (!newPlayer.firstName.trim() || !newPlayer.lastName.trim()) && styles.saveButtonDisabled
                  ]}
                  onPress={editingPlayer ? handleEditPlayer : handleAddPlayer}
                  disabled={!newPlayer.firstName.trim() || !newPlayer.lastName.trim()}
                >
                  <Text style={styles.saveButtonText}>
                    {editingPlayer ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </FixedModal>
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
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  leftSection: {
    flex: 1,
  },
  leftSectionLandscape: {
    flex: 1,
  },
  rightSection: {
    flex: 1,
    marginTop: SPACING.lg,
  },
  rightSectionLandscape: {
    flex: 1,
    marginTop: 0,
  },
  playerListSection: {
    flex: 1,
    marginTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  newPlayerButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  newPlayerButtonTablet: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  newPlayerButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  newPlayerButtonTextTablet: {
    fontSize: 18,
  },
  clearButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  clearButtonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 14,
  },
  searchSection: {
    marginBottom: SPACING.lg,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingRight: 40, // Space for clear button
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },
  clearSearchButton: {
    position: 'absolute',
    right: SPACING.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  clearSearchText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchInputTablet: {
    paddingVertical: SPACING.md,
    fontSize: 18,
  },
  startGameSection: {
    marginBottom: SPACING.lg,
  },
  startGameButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  startGameButtonTablet: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  startGameButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  startGameButtonTextTablet: {
    fontSize: 20,
  },
  listTitle: {
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  listTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addPlayerIconButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  addPlayerIconButtonText: {
    fontSize: 24,
  },
  playerList: {
    flex: 1,
  },
  noPlayersText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },

  modalTitle: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },
  modalInputTablet: {
    paddingVertical: SPACING.md,
    fontSize: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  homeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  homeButtonText: {
    fontSize: 24,
  },
  settingsButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
}); 