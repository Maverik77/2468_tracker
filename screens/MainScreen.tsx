import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { FixedModal } from '../components/FixedModal';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { storage, Game } from '../utils/storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;
type MainRouteProp = RouteProp<RootStackParamList, 'Main'>;

interface Area {
  id: string;
  baseValue: number;
  multiplier: number;
  label: string;
  selectedPlayers: string[];
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  selected: boolean;
}

interface PlayerPoints {
  [playerId: string]: number;
}

interface RoundState {
  areas: Area[];
  points: PlayerPoints;
}

export const MainScreen: React.FC = () => {
  const { isLandscape, isTablet } = useResponsive();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MainRouteProp>();
  
  // Handle both new games and loaded games
  const isNewGame = 'selectedPlayers' in route.params;
  const selectedPlayers = isNewGame ? route.params.selectedPlayers : route.params.game?.players || [];
  const currentGame = isNewGame ? null : route.params.game;
  
  const [gameId, setGameId] = useState<string>(currentGame?.id || Date.now().toString());
  const [areas, setAreas] = useState<Area[]>([]);
  const [defaultMultiplier, setDefaultMultiplier] = useState(1);
  
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [showMultiplierModal, setShowMultiplierModal] = useState(false);
  const [multiplierInput, setMultiplierInput] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [currentRound, setCurrentRound] = useState(currentGame?.currentRound || 1);
  const [rounds, setRounds] = useState<{ [roundNumber: number]: RoundState }>(currentGame?.rounds || {});

  // Load default multiplier and initialize areas
  useEffect(() => {
    const loadDefaultMultiplier = async () => {
      try {
        const settings = await storage.loadSettings();
        setDefaultMultiplier(settings.defaultMultiplier);
        
        // Initialize areas with default multiplier if no current game or no areas
        if (!currentGame || !currentGame.rounds[currentGame.currentRound]?.areas) {
          const initialAreas = [
            { id: '1', baseValue: 2, multiplier: settings.defaultMultiplier, label: (2 * settings.defaultMultiplier).toString(), selectedPlayers: [] },
            { id: '2', baseValue: 4, multiplier: settings.defaultMultiplier, label: (4 * settings.defaultMultiplier).toString(), selectedPlayers: [] },
            { id: '3', baseValue: 6, multiplier: settings.defaultMultiplier, label: (6 * settings.defaultMultiplier).toString(), selectedPlayers: [] },
            { id: '4', baseValue: 8, multiplier: settings.defaultMultiplier, label: (8 * settings.defaultMultiplier).toString(), selectedPlayers: [] },
          ];
          setAreas(initialAreas);
        } else {
          setAreas(currentGame.rounds[currentGame.currentRound].areas);
        }
      } catch (error) {
        console.error('Error loading default multiplier:', error);
        // Fallback to default areas with multiplier 1
        const fallbackAreas = [
          { id: '1', baseValue: 2, multiplier: 1, label: '2', selectedPlayers: [] },
          { id: '2', baseValue: 4, multiplier: 1, label: '4', selectedPlayers: [] },
          { id: '3', baseValue: 6, multiplier: 1, label: '6', selectedPlayers: [] },
          { id: '4', baseValue: 8, multiplier: 1, label: '8', selectedPlayers: [] },
        ];
        setAreas(fallbackAreas);
      }
    };
    
    loadDefaultMultiplier();
  }, [currentGame]);

  // Auto-save game when areas or rounds change
  useEffect(() => {
    if (gameId && selectedPlayers.length > 0) {
      saveGame();
    }
  }, [areas, rounds, currentRound, gameId, selectedPlayers]);

  // Load areas from current game when it changes
  useEffect(() => {
    if (currentGame && currentGame.rounds[currentRound]) {
      setAreas(currentGame.rounds[currentRound].areas);
    }
  }, [currentGame, currentRound]);

  // Calculate current points based on area selections
  const currentPoints = useMemo(() => {
    const points: PlayerPoints = {};
    
    // Initialize points for all selected players
    selectedPlayers.forEach(player => {
      points[player.id] = 0;
    });
    
    // Calculate points from current area selections
    areas.forEach(area => {
      const areaValue = area.baseValue * area.multiplier;
      const selectedCount = area.selectedPlayers.length;
      const totalPlayers = selectedPlayers.length;
      
      // If all players are selected, nobody gets points (bust)
      if (selectedCount === totalPlayers) {
        return; // Skip this area
      }
      
      // If some players are selected, they share the points equally
      if (selectedCount > 0) {
        const pointsPerPlayer = areaValue / selectedCount;
        area.selectedPlayers.forEach(playerId => {
          if (points[playerId] !== undefined) {
            points[playerId] += pointsPerPlayer;
          }
        });
      }
    });
    
    return points;
  }, [areas, selectedPlayers]);

  // State to track if doubling is enabled
  const [doublingEnabled, setDoublingEnabled] = useState(false);

  // Load doubling setting
  useEffect(() => {
    const loadDoublingSetting = async () => {
      try {
        const settings = await storage.loadSettings();
        setDoublingEnabled(settings.winningAllFourPaysDouble);
      } catch (error) {
        console.error('Error loading doubling setting:', error);
        setDoublingEnabled(false);
      }
    };
    
    loadDoublingSetting();
  }, []);

  // Calculate current points with doubling applied (for display)
  const currentPointsWithDoubling = useMemo(() => {
    const points = { ...currentPoints };
    
    if (doublingEnabled) {
      // Find all players who won all 4 hands ALONE (no sharing)
      const playersWinningAllFour: Player[] = [];
      
      selectedPlayers.forEach((player: Player) => {
        let wonAllFour = true;
        areas.forEach((area: Area) => {
          // Check if this player is the ONLY player selected in this area
          if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
            wonAllFour = false;
          }
        });
        
        if (wonAllFour) {
          playersWinningAllFour.push(player);
        }
      });
      
      // Only double points if exactly ONE player won all 4 hands alone (no tie, no sharing)
      if (playersWinningAllFour.length === 1) {
        const winner = playersWinningAllFour[0];
        if (points[winner.id] > 0) {
          points[winner.id] *= 2;
        }
      }
    }
    
    return points;
  }, [currentPoints, areas, selectedPlayers, doublingEnabled]);

  // Calculate total points across all rounds
  const totalPoints = useMemo(() => {
    const totals: PlayerPoints = {};
    
    selectedPlayers.forEach(player => {
      totals[player.id] = 0;
    });

    // Sum up points from all saved rounds
    Object.keys(rounds).forEach(roundNumber => {
      const round = parseInt(roundNumber);
      const roundState = rounds[round];
      
      selectedPlayers.forEach(player => {
        totals[player.id] += roundState.points[player.id] || 0;
      });
    });

    return totals;
  }, [rounds, selectedPlayers]);

  const handleAreaPress = (area: Area) => {
    setSelectedArea(area);
    setMultiplierInput(area.multiplier.toString());
    setShowMultiplierModal(true);
  };

  const handleSaveMultiplier = () => {
    if (!selectedArea) return;
    
    const newMultiplier = parseInt(multiplierInput);
    if (isNaN(newMultiplier) || newMultiplier < 1) {
      Alert.alert('Invalid Multiplier', 'Please enter a valid number greater than 0.');
      return;
    }

    const updatedAreas = areas.map(area => {
      if (applyToAll || area.id === selectedArea.id) {
        return {
          ...area,
          multiplier: newMultiplier,
          label: (area.baseValue * newMultiplier).toString()
        };
      }
      return area;
    });
    
    setAreas(updatedAreas);
    setShowMultiplierModal(false);
    setSelectedArea(null);
    setMultiplierInput('');
    setApplyToAll(false);
  };

  const handleCancelMultiplier = () => {
    setShowMultiplierModal(false);
    setSelectedArea(null);
    setMultiplierInput('');
    setApplyToAll(false);
  };

  const handleBackToPlayers = () => {
    navigation.navigate('Player');
  };

  const handleGoHome = () => {
    navigation.navigate('Startup');
  };

  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX > 50) { // Swipe from left to right
        navigation.navigate('Player');
      }
    }
  };

  const handlePlayerToggle = (areaId: string, playerId: string) => {
    const updatedAreas = areas.map(area => {
      if (area.id === areaId) {
        const isPlayerSelected = area.selectedPlayers.includes(playerId);
        const updatedSelectedPlayers = isPlayerSelected
          ? area.selectedPlayers.filter(id => id !== playerId)
          : [...area.selectedPlayers, playerId];
        
        return {
          ...area,
          selectedPlayers: updatedSelectedPlayers
        };
      }
      return area;
    });
    
    setAreas(updatedAreas);
  };

  const saveGame = async () => {
    const game: Game = {
      id: gameId,
      players: selectedPlayers,
      createdAt: currentGame?.createdAt || new Date().toISOString(),
      rounds: rounds,
      currentRound: currentRound,
    };
    
    try {
      await storage.saveGame(game);
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleNextRound = async () => {
    // Load settings to check if "winning all four pays double" is enabled
    let settings;
    try {
      settings = await storage.loadSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      settings = { winningAllFourPaysDouble: false };
    }

    // Check if any player won all 4 hands and apply doubling if setting is enabled
    let finalPoints = { ...currentPoints };
    
    if (settings.winningAllFourPaysDouble) {
      // Find all players who won all 4 hands ALONE (no sharing)
      const playersWinningAllFour: Player[] = [];
      
      selectedPlayers.forEach((player: Player) => {
        let wonAllFour = true;
        areas.forEach((area: Area) => {
          // Check if this player is the ONLY player selected in this area
          if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
            wonAllFour = false;
          }
        });
        
        if (wonAllFour) {
          playersWinningAllFour.push(player);
        }
      });
      
      // Only double points if exactly ONE player won all 4 hands alone (no tie, no sharing)
      if (playersWinningAllFour.length === 1) {
        const winner = playersWinningAllFour[0];
        if (finalPoints[winner.id] > 0) {
          finalPoints[winner.id] *= 2;
          console.log(`Player ${winner.firstName} ${winner.lastName} won all 4 hands alone, doubling points from ${currentPoints[winner.id]} to ${finalPoints[winner.id]}`);
        }
      } else if (playersWinningAllFour.length > 1) {
        console.log(`Multiple players won all 4 hands alone (tie), no doubling applied`);
      } else {
        console.log(`No player won all 4 hands alone (sharing or no complete wins), no doubling applied`);
      }
    }

    // Save current round state with potentially doubled points
    const roundState: RoundState = {
      areas: [...areas],
      points: finalPoints
    };
    
    setRounds(prev => ({
      ...prev,
      [currentRound]: roundState
    }));
    
    // Find the highest round number and jump to the next one
    const roundNumbers = Object.keys(rounds).map(Number);
    const highestRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0;
    const nextRoundNumber = Math.max(highestRound, currentRound) + 1;
    
    setCurrentRound(nextRoundNumber);
    
    // Clear all area selections for new round
    setAreas(areas.map(area => ({
      ...area,
      selectedPlayers: []
    })));
    
    // Save game after round change
    await saveGame();
  };

  const handlePreviousRound = async () => {
    if (currentRound > 1) {
      // Load settings to check if "winning all four pays double" is enabled
      let settings;
      try {
        settings = await storage.loadSettings();
      } catch (error) {
        console.error('Error loading settings:', error);
        settings = { winningAllFourPaysDouble: false };
      }

      // Save current round state if it has any selections
      const hasSelections = areas.some(area => area.selectedPlayers.length > 0);
      if (hasSelections) {
        // Check if any player won all 4 hands and apply doubling if setting is enabled
        let finalPoints = { ...currentPoints };
        
        if (settings.winningAllFourPaysDouble) {
          // Find all players who won all 4 hands ALONE (no sharing)
          const playersWinningAllFour: Player[] = [];
          
          selectedPlayers.forEach((player: Player) => {
            let wonAllFour = true;
            areas.forEach((area: Area) => {
              // Check if this player is the ONLY player selected in this area
              if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
                wonAllFour = false;
              }
            });
            
            if (wonAllFour) {
              playersWinningAllFour.push(player);
            }
          });
          
          // Only double points if exactly ONE player won all 4 hands alone (no tie, no sharing)
          if (playersWinningAllFour.length === 1) {
            const winner = playersWinningAllFour[0];
            if (finalPoints[winner.id] > 0) {
              finalPoints[winner.id] *= 2;
              console.log(`Player ${winner.firstName} ${winner.lastName} won all 4 hands alone, doubling points from ${currentPoints[winner.id]} to ${finalPoints[winner.id]}`);
            }
          }
        }

        const roundState: RoundState = {
          areas: [...areas],
          points: finalPoints
        };
        
        setRounds(prev => ({
          ...prev,
          [currentRound]: roundState
        }));
      }
      
      // Load previous round state
      const previousRound = currentRound - 1;
      const previousRoundState = rounds[previousRound];
      
      if (previousRoundState) {
        setAreas(previousRoundState.areas);
      } else {
        // If no previous round state, reset to initial state
        setAreas(areas.map(area => ({
          ...area,
          selectedPlayers: []
        })));
      }
      
      setCurrentRound(previousRound);
      
      // Save game after round change
      await saveGame();
    }
  };

  const handleNextRoundNav = async () => {
    if (rounds[currentRound + 1]) {
      // Load settings to check if "winning all four pays double" is enabled
      let settings;
      try {
        settings = await storage.loadSettings();
      } catch (error) {
        console.error('Error loading settings:', error);
        settings = { winningAllFourPaysDouble: false };
      }

      // Save current round state if it has any selections
      const hasSelections = areas.some(area => area.selectedPlayers.length > 0);
      if (hasSelections) {
        // Check if any player won all 4 hands and apply doubling if setting is enabled
        let finalPoints = { ...currentPoints };
        
        if (settings.winningAllFourPaysDouble) {
          // Find all players who won all 4 hands ALONE (no sharing)
          const playersWinningAllFour: Player[] = [];
          
          selectedPlayers.forEach((player: Player) => {
            let wonAllFour = true;
            areas.forEach((area: Area) => {
              // Check if this player is the ONLY player selected in this area
              if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
                wonAllFour = false;
              }
            });
            
            if (wonAllFour) {
              playersWinningAllFour.push(player);
            }
          });
          
          // Only double points if exactly ONE player won all 4 hands alone (no tie, no sharing)
          if (playersWinningAllFour.length === 1) {
            const winner = playersWinningAllFour[0];
            if (finalPoints[winner.id] > 0) {
              finalPoints[winner.id] *= 2;
              console.log(`Player ${winner.firstName} ${winner.lastName} won all 4 hands alone, doubling points from ${currentPoints[winner.id]} to ${finalPoints[winner.id]}`);
            }
          }
        }

        const roundState: RoundState = {
          areas: [...areas],
          points: finalPoints
        };
        
        setRounds(prev => ({
          ...prev,
          [currentRound]: roundState
        }));
      }
      
      // Load next round state
      const nextRound = currentRound + 1;
      const nextRoundState = rounds[nextRound];
      
      if (nextRoundState) {
        setAreas(nextRoundState.areas);
        setCurrentRound(nextRound);
      }
    }
  };

  const handleSaveCurrentRound = async () => {
    // Load settings to check if "winning all four pays double" is enabled
    let settings;
    try {
      settings = await storage.loadSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      settings = { winningAllFourPaysDouble: false };
    }

    // Check if any player won all 4 hands and apply doubling if setting is enabled
    let finalPoints = { ...currentPoints };
    
    if (settings.winningAllFourPaysDouble) {
      // Find all players who won all 4 hands ALONE (no sharing)
      const playersWinningAllFour: Player[] = [];
      
      selectedPlayers.forEach((player: Player) => {
        let wonAllFour = true;
        areas.forEach((area: Area) => {
          // Check if this player is the ONLY player selected in this area
          if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
            wonAllFour = false;
          }
        });
        
        if (wonAllFour) {
          playersWinningAllFour.push(player);
        }
      });
      
      // Only double points if exactly ONE player won all 4 hands alone (no tie, no sharing)
      if (playersWinningAllFour.length === 1) {
        const winner = playersWinningAllFour[0];
        if (finalPoints[winner.id] > 0) {
          finalPoints[winner.id] *= 2;
          console.log(`Player ${winner.firstName} ${winner.lastName} won all 4 hands alone, doubling points from ${currentPoints[winner.id]} to ${finalPoints[winner.id]}`);
        }
      }
    }

    // Save current round state with potentially doubled points
    const roundState: RoundState = {
      areas: [...areas],
      points: finalPoints
    };
    
    setRounds(prev => ({
      ...prev,
      [currentRound]: roundState
    }));
    
    // Save game after updating round
    await saveGame();
    
    // Show success feedback
    Alert.alert('Success', `Round ${currentRound} saved successfully!`);
  };

  const handleDeleteRound = (roundNumber: number) => {
    Alert.alert(
      'Delete Round',
      `Are you sure you want to delete Round ${roundNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRounds(prev => {
              const newRounds: { [roundNumber: number]: RoundState } = {};
              const roundNumbers = Object.keys(prev)
                .map(Number)
                .sort((a, b) => a - b);
              
              let newRoundIndex = 1;
              for (const oldRoundNumber of roundNumbers) {
                if (oldRoundNumber !== roundNumber) {
                  newRounds[newRoundIndex] = prev[oldRoundNumber];
                  newRoundIndex++;
                }
              }
              
              return newRounds;
            });
            
            // Navigate to appropriate round after deletion
            const roundNumbers = Object.keys(rounds)
              .map(Number)
              .sort((a, b) => a - b);
            
            if (roundNumbers.length > 0) {
              // Find the next round after the deleted one, or the previous one
              const nextRound = roundNumbers.find(r => r > roundNumber);
              const previousRound = roundNumbers.filter(r => r < roundNumber).pop();
              
              if (nextRound) {
                // Load the next round (which will now have a new index)
                const nextRoundIndex = roundNumbers.indexOf(nextRound) + 1;
                const nextRoundState = rounds[nextRound];
                if (nextRoundState) {
                  setAreas(nextRoundState.areas);
                  setCurrentRound(nextRoundIndex);
                }
              } else if (previousRound) {
                // Load the previous round
                const previousRoundIndex = roundNumbers.indexOf(previousRound) + 1;
                const previousRoundState = rounds[previousRound];
                if (previousRoundState) {
                  setAreas(previousRoundState.areas);
                  setCurrentRound(previousRoundIndex);
                }
              } else {
                // No other rounds, reset to round 1
                setAreas(areas.map(area => ({
                  ...area,
                  selectedPlayers: []
                })));
                setCurrentRound(1);
              }
            } else {
              // No rounds left, reset to round 1
              setAreas(areas.map(area => ({
                ...area,
                selectedPlayers: []
              })));
              setCurrentRound(1);
            }
          },
        },
      ]
    );
  };

  const getPlayerInitials = (player: Player) => {
    return `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`;
  };

  const getPlayerName = (player: Player) => {
    return `${player.firstName} ${player.lastName}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <PanGestureHandler onGestureEvent={handleSwipeGesture}>
        <View style={{ flex: 1 }}>
          <ResponsiveContainer>
            {/* Main Content - Title, Areas and Points */}
            <View style={[
              styles.mainContent,
              isLandscape && styles.mainContentLandscape
            ]}>
              {/* Left Side - Title and Areas */}
              <View style={[
                styles.leftSide,
                isLandscape && styles.leftSideLandscape
              ]}>
                {/* Title Section */}
                <View style={[
                  styles.titleSection,
                  isLandscape && styles.titleSectionLandscape
                ]}>
                  <Text style={[FONTS.h1, styles.title]}>2468</Text>
                  <View style={styles.titleButtons}>
                    <TouchableOpacity 
                      style={styles.homeButton}
                      onPress={handleGoHome}
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

                {/* Areas Grid */}
                <View style={[
                  styles.areasContainer,
                  isLandscape && styles.areasContainerLandscape
                ]}>
                  {areas.map((area) => (
                    <View
                      key={area.id}
                      style={[
                        styles.areaCard,
                        isTablet && styles.areaCardTablet,
                        isLandscape && styles.areaCardLandscape,
                        isLandscape && isTablet && styles.areaCardLandscapeTablet
                      ]}
                    >
                      {/* Top Left - Area Label */}
                      <View style={styles.topLeftSection}>
                        <TouchableOpacity
                          style={styles.areaLabelButton}
                          onPress={() => handleAreaPress(area)}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            FONTS.h1,
                            styles.areaLabel,
                            isTablet && styles.areaLabelTablet
                          ]}>
                            {area.label}
                          </Text>
                          {area.multiplier > 1 && (
                            <Text style={[
                              FONTS.caption,
                              styles.multiplierText,
                              isTablet && styles.multiplierTextTablet
                            ]}>
                              ×{area.multiplier}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Top Right - Player Button */}
                      <View style={styles.topRightSection}>
                        {selectedPlayers.length > 0 && (
                          <TouchableOpacity
                            style={[
                              styles.playerButton,
                              area.selectedPlayers.includes(selectedPlayers[0].id) && styles.playerButtonSelected,
                              isTablet && styles.playerButtonTablet,
                              isLandscape && styles.playerButtonLandscape,
                              isLandscape && isTablet && styles.playerButtonLandscapeTablet
                            ]}
                            onPress={() => handlePlayerToggle(area.id, selectedPlayers[0].id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.playerButtonText,
                              area.selectedPlayers.includes(selectedPlayers[0].id) && styles.playerButtonTextSelected,
                              isTablet && styles.playerButtonTextTablet,
                              isLandscape && styles.playerButtonTextLandscape,
                              isLandscape && isTablet && styles.playerButtonTextLandscapeTablet
                            ]}>
                              {getPlayerInitials(selectedPlayers[0])}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Bottom Left - Player Button */}
                      <View style={styles.bottomLeftSection}>
                        {selectedPlayers.length > 1 && (
                          <TouchableOpacity
                            style={[
                              styles.playerButton,
                              area.selectedPlayers.includes(selectedPlayers[1].id) && styles.playerButtonSelected,
                              isTablet && styles.playerButtonTablet,
                              isLandscape && styles.playerButtonLandscape,
                              isLandscape && isTablet && styles.playerButtonLandscapeTablet
                            ]}
                            onPress={() => handlePlayerToggle(area.id, selectedPlayers[1].id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.playerButtonText,
                              area.selectedPlayers.includes(selectedPlayers[1].id) && styles.playerButtonTextSelected,
                              isTablet && styles.playerButtonTextTablet,
                              isLandscape && styles.playerButtonTextLandscape,
                              isLandscape && isTablet && styles.playerButtonTextLandscapeTablet
                            ]}>
                              {getPlayerInitials(selectedPlayers[1])}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Bottom Right - Player Button */}
                      <View style={styles.bottomRightSection}>
                        {selectedPlayers.length > 2 && (
                          <TouchableOpacity
                            style={[
                              styles.playerButton,
                              area.selectedPlayers.includes(selectedPlayers[2].id) && styles.playerButtonSelected,
                              isTablet && styles.playerButtonTablet,
                              isLandscape && styles.playerButtonLandscape,
                              isLandscape && isTablet && styles.playerButtonLandscapeTablet
                            ]}
                            onPress={() => handlePlayerToggle(area.id, selectedPlayers[2].id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.playerButtonText,
                              area.selectedPlayers.includes(selectedPlayers[2].id) && styles.playerButtonTextSelected,
                              isTablet && styles.playerButtonTextTablet,
                              isLandscape && styles.playerButtonTextLandscape,
                              isLandscape && isTablet && styles.playerButtonTextLandscapeTablet
                            ]}>
                              {getPlayerInitials(selectedPlayers[2])}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Right Side - Points and Footer */}
              <View style={[
                styles.rightSide,
                isLandscape && styles.rightSideLandscape
              ]}>
                {/* Points Tracking Section */}
                <View style={[
                  styles.pointsContainer,
                  isTablet && styles.pointsContainerTablet,
                  isLandscape && styles.pointsContainerLandscape,
                  isLandscape && isTablet && styles.pointsContainerLandscapeTablet
                ]}>
                  <View style={[
                    styles.pointsHeader,
                    isLandscape && styles.pointsHeaderLandscape
                  ]}>
                    <View style={styles.pointsHeaderTop}>
                      <View style={styles.roundNavigation}>
                        <TouchableOpacity
                          style={[
                            styles.roundNavButton,
                            currentRound <= 1 && styles.roundNavButtonDisabled
                          ]}
                          onPress={handlePreviousRound}
                          disabled={currentRound <= 1}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.roundNavButtonText,
                            currentRound <= 1 && styles.roundNavButtonTextDisabled
                          ]}>←</Text>
                        </TouchableOpacity>
                        
                        <Text style={[FONTS.h3, styles.roundNumber]}>Rd {currentRound}</Text>
                        
                        <TouchableOpacity
                          style={[
                            styles.roundNavButton,
                            !rounds[currentRound + 1] && styles.roundNavButtonDisabled
                          ]}
                          onPress={handleNextRoundNav}
                          disabled={!rounds[currentRound + 1]}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.roundNavButtonText,
                            !rounds[currentRound + 1] && styles.roundNavButtonTextDisabled
                          ]}>→</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.pointsHeaderButtons}>
                        <TouchableOpacity
                          style={styles.saveRoundButton}
                          onPress={handleSaveCurrentRound}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.saveRoundButtonText}>💾</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.payoutButton}
                          onPress={() => {
                            // Create current game state from current data
                            const currentGameState: Game = {
                              id: gameId,
                              players: selectedPlayers,
                              createdAt: currentGame?.createdAt || new Date().toISOString(),
                              rounds: rounds,
                              currentRound: currentRound,
                            };
                            navigation.navigate('Cashout', { game: currentGameState });
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.payoutButtonText}>💰</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.newRoundIconButton}
                          onPress={handleNextRound}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.newRoundIconButtonText}>➕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  
                  {/* Fixed Header */}
                  <View style={[
                    styles.pointsTableHeader,
                    isLandscape && styles.pointsTableHeaderLandscape
                  ]}>
                    <View style={styles.pointsRow}>
                      <View style={[styles.pointsCell, styles.pointsCellHeader]}>
                        <Text style={[FONTS.caption, styles.pointsCellTextSmall]}>Round</Text>
                      </View>
                      {selectedPlayers.map((player, index) => (
                        <View key={player.id} style={[styles.pointsCell, styles.pointsCellHeader]}>
                          <Text style={[FONTS.caption, styles.pointsCellTextSmall]}>
                            {getPlayerName(player)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Scrollable Content */}
                  <ScrollView 
                    style={styles.pointsTableScroll}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.pointsTable}>
                      {/* Historical Rounds */}
                      {Object.keys(rounds).map(roundNumber => {
                        const round = parseInt(roundNumber);
                        const roundState = rounds[round];
                        return (
                          <View key={round} style={styles.pointsRow}>
                            <View style={styles.pointsCell}>
                              <View style={styles.roundCellContent}>
                                <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.roundText]}>
                                  {round}
                                </Text>
                                <TouchableOpacity
                                  style={styles.deleteButton}
                                  onPress={() => handleDeleteRound(round)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.deleteButtonText}>🗑️</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                            {selectedPlayers.map((player) => (
                              <View key={player.id} style={styles.pointsCell}>
                                <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.pointsText]}>
                                  {roundState.points[player.id] || 0}
                                </Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                      
                      {/* Current Round Row */}
                      <View style={styles.pointsRow}>
                        <View style={styles.pointsCell}>
                          <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.roundText]}>
                            {currentRound}
                          </Text>
                        </View>
                        {selectedPlayers.map((player) => (
                          <View key={player.id} style={styles.pointsCell}>
                            <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.pointsText]}>
                              {currentPointsWithDoubling[player.id] || 0}
                            </Text>
                          </View>
                        ))}
                      </View>
                      
                      {/* Total Row */}
                      <View style={[styles.pointsRow, styles.totalRow]}>
                        <View style={styles.pointsCell}>
                          <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.totalText]}>
                            Total
                          </Text>
                        </View>
                        {selectedPlayers.map((player) => (
                          <View key={player.id} style={styles.pointsCell}>
                            <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.totalText]}>
                              {totalPoints[player.id] || 0}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>

                {/* Instructions */}
                <View style={[
                  styles.instructionsContainer,
                  isLandscape && styles.instructionsContainerLandscape
                ]}>
                  <Text style={[FONTS.caption, styles.instructionsText]}>
                    Tap any area to set its multiplier
                  </Text>
                </View>
              </View>
            </View>

            {/* Multiplier Modal */}
            <FixedModal
              visible={showMultiplierModal}
              onRequestClose={handleCancelMultiplier}
            >
              <Text style={[FONTS.h2, styles.modalTitle]}>
                Set Multiplier for {selectedArea?.baseValue}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[FONTS.caption, styles.inputLabel]}>Multiplier</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    isTablet && styles.modalInputTablet
                  ]}
                  value={multiplierInput}
                  onChangeText={setMultiplierInput}
                  placeholder="Enter multiplier (e.g., 5)"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.previewContainer}>
                <Text style={[FONTS.caption, styles.previewLabel]}>Preview:</Text>
                <Text style={[FONTS.h3, styles.previewValue]}>
                  {selectedArea?.baseValue} × {multiplierInput || '1'} = {selectedArea ? (selectedArea.baseValue * (parseInt(multiplierInput) || 1)).toString() : '0'}
                </Text>
              </View>

              <View style={styles.applyToAllContainer}>
                <Text style={[FONTS.body, styles.applyToAllLabel]}>Apply to all areas</Text>
                <Switch
                  value={applyToAll}
                  onValueChange={setApplyToAll}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.background}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelMultiplier}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    (!multiplierInput.trim() || parseInt(multiplierInput) < 1) && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveMultiplier}
                  disabled={!multiplierInput.trim() || parseInt(multiplierInput) < 1}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
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
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  homeButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  mainContentLandscape: {
    flexDirection: 'row',
    gap: SPACING.lg,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  leftSide: {
    flex: 1,
  },
  leftSideLandscape: {
    width: '55%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  rightSide: {
    flex: 1,
  },
  rightSideLandscape: {
    width: '40%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleSectionLandscape: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  titleButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'stretch',
    height: '40%',
    marginBottom: SPACING.sm,
    flex: 1,
  },
  areasContainerLandscape: {
    gap: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    height: '90%',
  },
  areaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    width: '48%',
    height: '48%',
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  topLeftSection: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    zIndex: 1,
  },
  areaLabelButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightSection: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  bottomLeftSection: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  bottomRightSection: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  playerButton: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  playerButtonTablet: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minWidth: 60,
    minHeight: 60,
    borderRadius: 20,
  },
  playerButtonLandscape: {
    width: '35%',
    height: '35%',
    maxWidth: '40%',
    maxHeight: '40%',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    aspectRatio: 1,
  },
  playerButtonLandscapeTablet: {
    width: '38%',
    height: '38%',
    maxWidth: '42%',
    maxHeight: '42%',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 10,
    aspectRatio: 1,
  },
  playerButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerButtonTextSelected: {
    color: COLORS.background,
  },
  playerButtonTextTablet: {
    fontSize: 20,
  },
  playerButtonTextLandscape: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerButtonTextLandscapeTablet: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  areaCardTablet: {
    padding: SPACING.xxl,
    borderRadius: 20,
  },
  areaCardLandscape: {
    width: '45%',
    height: '45%',
    padding: SPACING.lg,
  },
  areaCardLandscapeTablet: {
    width: '48%',
    height: '48%',
    padding: SPACING.xl,
  },
  areaLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  areaLabelTablet: {
    fontSize: 48,
  },
  multiplierText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  multiplierTextTablet: {
    fontSize: 18,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    height: '4%',
    justifyContent: 'center',
  },
  instructionsContainerLandscape: {
    height: '4%',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  instructionsText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 10,
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
  previewContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  previewLabel: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  previewValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  applyToAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  applyToAllLabel: {
    color: COLORS.text,
    flex: 1,
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
  pointsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    height: '50%',
    flex: 1,
  },
  pointsContainerTablet: {
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  pointsContainerLandscape: {
    height: '75%',
    marginTop: SPACING.lg,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pointsContainerLandscapeTablet: {
    height: '80%',
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  pointsHeader: {
    marginBottom: SPACING.sm,
    flex: 0,
  },
  pointsHeaderLandscape: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  pointsTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  pointsHeaderButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pointsTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    flex: 1,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pointsCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  pointsCellHeader: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pointsCellText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  roundText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  pointsText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  totalRow: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  roundNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pointsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roundNavButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNavButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  roundNavButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  roundNavButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  roundNumber: {
    color: COLORS.text,
    fontWeight: 'bold',
    marginHorizontal: SPACING.sm,
  },
  payoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  newRoundIconButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newRoundIconButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  roundCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteButton: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  deleteButtonText: {
    fontSize: 12,
  },
  pointsTableScroll: {
    flex: 1,
    maxHeight: '100%',
  },
  pointsCellTextSmall: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  pointsTableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pointsTableHeaderLandscape: {
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  settingsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveRoundButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveRoundButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 