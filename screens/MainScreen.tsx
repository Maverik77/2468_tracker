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
  Switch,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { FixedModal } from '../components/FixedModal';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, FONTS, SPACING, RESPONSIVE } from '../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { storage, Game } from '../utils/storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;
type MainRouteProp = RouteProp<RootStackParamList, 'Main'>;

interface DualHandCondition {
  name: string;
  value: number;
  selectedPlayers: string[];
}

interface Area {
  id: string;
  baseValue: number;
  multiplier: number;
  label: string;
  selectedPlayers: string[];
  // For 8-point area dual hand support
  isDualHandMode?: boolean;
  dualHandConditions?: {
    highHand: DualHandCondition;
    lowHand: DualHandCondition;
  };
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
  const { isLandscape } = useResponsive();
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
  const [isPointsExpanded, setIsPointsExpanded] = useState(false);
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
            createArea('1', 2, settings.defaultMultiplier),
            createArea('2', 4, settings.defaultMultiplier),
            createArea('3', 6, settings.defaultMultiplier),
            createArea('4', 8, settings.defaultMultiplier),
          ];
          setAreas(initialAreas);
        } else {
          setAreas(currentGame.rounds[currentGame.currentRound].areas);
        }
      } catch (error) {
        console.error('Error loading default multiplier:', error);
        // Fallback to default areas with multiplier 1
        const fallbackAreas = [
          createArea('1', 2, 1),
          createArea('2', 4, 1),
          createArea('3', 6, 1),
          createArea('4', 8, 1),
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

  // Helper function to create dual hand conditions for 8-point area
  const createDualHandConditions = (multiplier: number): { highHand: DualHandCondition; lowHand: DualHandCondition } => ({
    highHand: {
      name: "High Hand",
      value: (4 * multiplier), // Half of 8 points
      selectedPlayers: []
    },
    lowHand: {
      name: "Low Hand", 
      value: (4 * multiplier), // Half of 8 points
      selectedPlayers: []
    }
  });

  // Helper function to initialize area with dual hand support
  const createArea = (id: string, baseValue: number, multiplier: number): Area => {
    const area: Area = {
      id,
      baseValue,
      multiplier,
      label: (baseValue * multiplier).toString(),
      selectedPlayers: [],
      isDualHandMode: false
    };
    
    // Add dual hand conditions for 8-point area
    if (baseValue === 8) {
      area.dualHandConditions = createDualHandConditions(multiplier);
    }
    
    return area;
  };

  // Calculate current points based on area selections
  const currentPoints = useMemo(() => {
    const points: PlayerPoints = {};
    
    // Initialize points for all selected players
    selectedPlayers.forEach(player => {
      points[player.id] = 0;
    });
    
    // Calculate points from current area selections
    areas.forEach(area => {
      // Handle dual hand mode for 8-point area
      if (area.isDualHandMode && area.dualHandConditions) {
        // Calculate current values using the area's current multiplier
        const currentHighHandValue = (area.baseValue / 2) * area.multiplier; // Half of base value * multiplier
        const currentLowHandValue = (area.baseValue / 2) * area.multiplier;  // Half of base value * multiplier
        
        // Calculate points for High Hand
        const highHandCount = area.dualHandConditions.highHand.selectedPlayers.length;
        if (highHandCount > 0 && highHandCount < selectedPlayers.length) {
          const pointsPerPlayer = currentHighHandValue / highHandCount;
          area.dualHandConditions.highHand.selectedPlayers.forEach(playerId => {
            if (points[playerId] !== undefined) {
              points[playerId] += pointsPerPlayer;
            }
          });
        }
        
        // Calculate points for Low Hand
        const lowHandCount = area.dualHandConditions.lowHand.selectedPlayers.length;
        if (lowHandCount > 0 && lowHandCount < selectedPlayers.length) {
          const pointsPerPlayer = currentLowHandValue / lowHandCount;
          area.dualHandConditions.lowHand.selectedPlayers.forEach(playerId => {
            if (points[playerId] !== undefined) {
              points[playerId] += pointsPerPlayer;
            }
          });
        }
      } else {
        // Standard single-selection logic
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
          if (area.isDualHandMode && area.dualHandConditions) {
            // For dual hand mode (8-point area), check if player won BOTH high and low hands ALONE
            const wonHighHand = area.dualHandConditions.highHand.selectedPlayers.length === 1 && 
                               area.dualHandConditions.highHand.selectedPlayers.includes(player.id);
            const wonLowHand = area.dualHandConditions.lowHand.selectedPlayers.length === 1 && 
                              area.dualHandConditions.lowHand.selectedPlayers.includes(player.id);
            
            if (!(wonHighHand && wonLowHand)) {
              wonAllFour = false;
            }
          } else {
            // Standard single-selection logic: check if this player is the ONLY player selected in this area
            if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
              wonAllFour = false;
            }
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

  // Toggle dual hand mode for 8-point area
  const handleDualHandToggle = (areaId: string) => {
    const updatedAreas = areas.map(area => {
      if (area.id === areaId && area.baseValue === 8) {
        const newDualHandMode = !area.isDualHandMode;
        
        if (newDualHandMode) {
          // Switching to dual mode: copy single mode selections to High Hand
          return {
            ...area,
            isDualHandMode: true,
            selectedPlayers: [], // Clear standard selections
            dualHandConditions: area.dualHandConditions ? {
              ...area.dualHandConditions,
              highHand: { ...area.dualHandConditions.highHand, selectedPlayers: [...area.selectedPlayers] }, // Copy from single mode
              lowHand: { ...area.dualHandConditions.lowHand, selectedPlayers: [] } // Clear Low Hand
            } : {
              ...createDualHandConditions(area.multiplier),
              highHand: { ...createDualHandConditions(area.multiplier).highHand, selectedPlayers: [...area.selectedPlayers] } // Copy from single mode
            }
          };
        } else {
          // Switching to single mode: copy High Hand selections to single mode
          const highHandPlayers = area.dualHandConditions?.highHand.selectedPlayers || [];
          return {
            ...area,
            isDualHandMode: false,
            selectedPlayers: [...highHandPlayers], // Copy from High Hand
            dualHandConditions: area.dualHandConditions ? {
              ...area.dualHandConditions,
              highHand: { ...area.dualHandConditions.highHand, selectedPlayers: [] }, // Clear High Hand
              lowHand: { ...area.dualHandConditions.lowHand, selectedPlayers: [] } // Clear Low Hand
            } : area.dualHandConditions
          };
        }
      }
      return area;
    });
    
    setAreas(updatedAreas);
  };

  // Handle dual hand player selection
  const handleDualHandPlayerToggle = (areaId: string, handType: 'highHand' | 'lowHand', playerId: string) => {
    const updatedAreas = areas.map(area => {
      if (area.id === areaId && area.dualHandConditions) {
        const currentHand = area.dualHandConditions[handType];
        const isPlayerSelected = currentHand.selectedPlayers.includes(playerId);
        const updatedSelectedPlayers = isPlayerSelected
          ? currentHand.selectedPlayers.filter(id => id !== playerId)
          : [...currentHand.selectedPlayers, playerId];
        
        return {
          ...area,
          dualHandConditions: {
            ...area.dualHandConditions,
            [handType]: {
              ...currentHand,
              selectedPlayers: updatedSelectedPlayers
            }
          }
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
          if (area.isDualHandMode && area.dualHandConditions) {
            // For dual hand mode (8-point area), check if player won BOTH high and low hands ALONE
            const wonHighHand = area.dualHandConditions.highHand.selectedPlayers.length === 1 && 
                               area.dualHandConditions.highHand.selectedPlayers.includes(player.id);
            const wonLowHand = area.dualHandConditions.lowHand.selectedPlayers.length === 1 && 
                              area.dualHandConditions.lowHand.selectedPlayers.includes(player.id);
            
            if (!(wonHighHand && wonLowHand)) {
              wonAllFour = false;
            }
          } else {
            // Standard single-selection logic: check if this player is the ONLY player selected in this area
            if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
              wonAllFour = false;
            }
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
              if (area.isDualHandMode && area.dualHandConditions) {
                // For dual hand mode (8-point area), check if player won BOTH high and low hands ALONE
                const wonHighHand = area.dualHandConditions.highHand.selectedPlayers.length === 1 && 
                                   area.dualHandConditions.highHand.selectedPlayers.includes(player.id);
                const wonLowHand = area.dualHandConditions.lowHand.selectedPlayers.length === 1 && 
                                  area.dualHandConditions.lowHand.selectedPlayers.includes(player.id);
                
                if (!(wonHighHand && wonLowHand)) {
                  wonAllFour = false;
                }
              } else {
                // Standard single-selection logic: check if this player is the ONLY player selected in this area
                if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
                  wonAllFour = false;
                }
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

  const handleJumpToRound = async (targetRound: number) => {
    if (targetRound === currentRound) return; // Already on this round
    
    // Minimize points section to show the areas after jumping to a round
    setIsPointsExpanded(false);
    
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
            if (area.isDualHandMode && area.dualHandConditions) {
              // For dual hand mode (8-point area), check if player won BOTH high and low hands ALONE
              const wonHighHand = area.dualHandConditions.highHand.selectedPlayers.length === 1 && 
                                 area.dualHandConditions.highHand.selectedPlayers.includes(player.id);
              const wonLowHand = area.dualHandConditions.lowHand.selectedPlayers.length === 1 && 
                                area.dualHandConditions.lowHand.selectedPlayers.includes(player.id);
              
              if (!(wonHighHand && wonLowHand)) {
                wonAllFour = false;
              }
            } else {
              // Standard single-selection logic: check if this player is the ONLY player selected in this area
              if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
                wonAllFour = false;
              }
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
    
    // Navigate to target round
    const targetRoundState = rounds[targetRound];
    
    if (targetRoundState) {
      // Load existing round state
      setAreas(targetRoundState.areas);
    } else {
      // Create new round with fresh state
      setAreas(areas.map(area => ({
        ...area,
        selectedPlayers: [],
        dualHandConditions: area.dualHandConditions ? {
          highHand: { ...area.dualHandConditions.highHand, selectedPlayers: [] },
          lowHand: { ...area.dualHandConditions.lowHand, selectedPlayers: [] }
        } : undefined
      })));
    }
    
    setCurrentRound(targetRound);
    
    // Save game after round change
    await saveGame();
  };

  const handleNextRoundNav = async () => {
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
            if (area.isDualHandMode && area.dualHandConditions) {
              // For dual hand mode (8-point area), check if player won BOTH high and low hands ALONE
              const wonHighHand = area.dualHandConditions.highHand.selectedPlayers.length === 1 && 
                                 area.dualHandConditions.highHand.selectedPlayers.includes(player.id);
              const wonLowHand = area.dualHandConditions.lowHand.selectedPlayers.length === 1 && 
                                area.dualHandConditions.lowHand.selectedPlayers.includes(player.id);
              
              if (!(wonHighHand && wonLowHand)) {
                wonAllFour = false;
              }
            } else {
              // Standard single-selection logic: check if this player is the ONLY player selected in this area
              if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
                wonAllFour = false;
              }
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
    
    // Navigate to next round (either existing or new)
    const nextRound = currentRound + 1;
    const nextRoundState = rounds[nextRound];
    
    if (nextRoundState) {
      // Load existing next round state
      setAreas(nextRoundState.areas);
    } else {
      // Create new round with fresh state
      setAreas(areas.map(area => ({
        ...area,
        selectedPlayers: [],
        dualHandConditions: area.dualHandConditions ? {
          highHand: { ...area.dualHandConditions.highHand, selectedPlayers: [] },
          lowHand: { ...area.dualHandConditions.lowHand, selectedPlayers: [] }
        } : undefined
      })));
    }
    
    setCurrentRound(nextRound);
    
    // Save game after round change
    await saveGame();
  };

  const handleSaveRound = async () => {
    await handleSaveCurrentRound();
  };

  const handleNewRound = async () => {
    await handleNextRound();
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
          if (area.isDualHandMode && area.dualHandConditions) {
            // For dual hand mode (8-point area), check if player won BOTH high and low hands ALONE
            const wonHighHand = area.dualHandConditions.highHand.selectedPlayers.length === 1 && 
                               area.dualHandConditions.highHand.selectedPlayers.includes(player.id);
            const wonLowHand = area.dualHandConditions.lowHand.selectedPlayers.length === 1 && 
                              area.dualHandConditions.lowHand.selectedPlayers.includes(player.id);
            
            if (!(wonHighHand && wonLowHand)) {
              wonAllFour = false;
            }
          } else {
            // Standard single-selection logic: check if this player is the ONLY player selected in this area
            if (area.selectedPlayers.length !== 1 || !area.selectedPlayers.includes(player.id)) {
              wonAllFour = false;
            }
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
            {isLandscape ? (
              /* Landscape Mode - Keep existing layout */
              <View style={styles.mainContentLandscape}>
                <View style={styles.leftSideLandscape}>
                  <View style={styles.titleSectionLandscape}>
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
                        
                        isLandscape && styles.areaCardLandscape,
                        
                      ]}
                    >
                      {/* Top Left - Area Label */}
                      <View style={styles.topLeftSection}>
                        <View style={styles.areaLabelContainer}>
                          <TouchableOpacity
                            style={styles.areaLabelButton}
                            onPress={() => handleAreaPress(area)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.areaLabelRow}>
                              <Text style={[
                                FONTS.h1,
                                styles.areaLabel,
                                
                                isLandscape && styles.areaLabelLandscape,
                                
                              ]}>
                                {area.label}
                              </Text>
                              {area.multiplier > 1 && (
                                <Text style={[
                                  FONTS.caption,
                                  styles.multiplierText,
                                  
                                  isLandscape && styles.multiplierTextLandscape,
                                  
                                ]}>
                                  ×{area.multiplier}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          
                          {/* Dual Hand Toggle for 8-point area */}
                          {area.baseValue === 8 && (
                            <TouchableOpacity
                              style={styles.dualHandToggle}
                              onPress={() => handleDualHandToggle(area.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.dualHandToggleIcon}>
                                {area.isDualHandMode ? '⚡' : '↕️'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                                            {/* Conditional rendering: Dual Hand Mode vs Standard Mode */}
                      {area.isDualHandMode && area.dualHandConditions ? (
                        /* Dual Hand Mode - High Hand and Low Hand sections */
                        <View style={[
                          styles.dualHandContainer,
                          isLandscape && styles.dualHandContainerLandscape,
                          
                        ]}>
                          {/* High Hand Section (Top Half) */}
                          <View style={styles.dualHandSection}>
                            <View style={styles.dualHandPlayers}>
                              {selectedPlayers.slice(0, 3).map((player, index) => (
                                <TouchableOpacity
                                  key={`high-${player.id}`}
                                  style={[
                                    styles.dualHandPlayerButton,
                                    area.dualHandConditions!.highHand.selectedPlayers.includes(player.id) && styles.playerButtonSelected,
                                    
                                    isLandscape && styles.dualHandPlayerButtonLandscape,
                                    
                                  ]}
                                  onPress={() => handleDualHandPlayerToggle(area.id, 'highHand', player.id)}
                                  activeOpacity={0.7}
                                >
                                  <Text 
                                    style={[
                                      styles.dualHandPlayerButtonText,
                                      area.dualHandConditions!.highHand.selectedPlayers.includes(player.id) && styles.playerButtonTextSelected,
                                      
                                      isLandscape && styles.dualHandPlayerButtonTextLandscape,
                                      
                                    ]}
                                    adjustsFontSizeToFit
                                    numberOfLines={1}
                                  >
                                    {getPlayerInitials(player)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                                                                               {/* Low Hand Section (Bottom Half) */}
                          <View style={[styles.dualHandSection, styles.dualHandSectionLowBackground]}>
                            <View style={styles.dualHandPlayers}>
                              {selectedPlayers.slice(0, 3).map((player, index) => (
                                <TouchableOpacity
                                  key={`low-${player.id}`}
                                  style={[
                                    styles.dualHandPlayerButton,
                                    area.dualHandConditions!.lowHand.selectedPlayers.includes(player.id) && styles.playerButtonSelected,
                                    
                                    isLandscape && styles.dualHandPlayerButtonLandscape,
                                    
                                  ]}
                                  onPress={() => handleDualHandPlayerToggle(area.id, 'lowHand', player.id)}
                                  activeOpacity={0.7}
                                >
                                  <Text 
                                    style={[
                                      styles.dualHandPlayerButtonText,
                                      area.dualHandConditions!.lowHand.selectedPlayers.includes(player.id) && styles.playerButtonTextSelected,
                                      
                                      isLandscape && styles.dualHandPlayerButtonTextLandscape,
                                      
                                    ]}
                                    adjustsFontSizeToFit
                                    numberOfLines={1}
                                  >
                                    {getPlayerInitials(player)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </View>
                      ) : (
                        /* Standard Mode - Corner positioned player buttons */
                        <>
                          {/* Top Right - Player Button */}
                          <View style={[
                            styles.topRightSection,
                            isLandscape && styles.topRightSectionLandscape
                          ]}>
                            {selectedPlayers.length > 0 && (
                              <TouchableOpacity
                                style={[
                                  styles.playerButton,
                                  area.selectedPlayers.includes(selectedPlayers[0].id) && styles.playerButtonSelected,
                                  
                                  isLandscape && styles.playerButtonLandscape,
                                  
                                ]}
                                onPress={() => handlePlayerToggle(area.id, selectedPlayers[0].id)}
                                activeOpacity={0.7}
                              >
                                <Text style={[
                                  styles.playerButtonText,
                                  area.selectedPlayers.includes(selectedPlayers[0].id) && styles.playerButtonTextSelected,
                                  
                                  isLandscape && styles.playerButtonTextLandscape,
                                  
                                ]}>
                                  {getPlayerInitials(selectedPlayers[0])}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Bottom Left - Player Button */}
                          <View style={[
                            styles.bottomLeftSection,
                            isLandscape && styles.bottomLeftSectionLandscape
                          ]}>
                            {selectedPlayers.length > 1 && (
                              <TouchableOpacity
                                style={[
                                  styles.playerButton,
                                  area.selectedPlayers.includes(selectedPlayers[1].id) && styles.playerButtonSelected,
                                  
                                  isLandscape && styles.playerButtonLandscape,
                                  
                                ]}
                                onPress={() => handlePlayerToggle(area.id, selectedPlayers[1].id)}
                                activeOpacity={0.7}
                              >
                                <Text style={[
                                  styles.playerButtonText,
                                  area.selectedPlayers.includes(selectedPlayers[1].id) && styles.playerButtonTextSelected,
                                  
                                  isLandscape && styles.playerButtonTextLandscape,
                                  
                                ]}>
                                  {getPlayerInitials(selectedPlayers[1])}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Bottom Right - Player Button */}
                          <View style={[
                            styles.bottomRightSection,
                            isLandscape && styles.bottomRightSectionLandscape
                          ]}>
                            {selectedPlayers.length > 2 && (
                              <TouchableOpacity
                                style={[
                                  styles.playerButton,
                                  area.selectedPlayers.includes(selectedPlayers[2].id) && styles.playerButtonSelected,
                                  
                                  isLandscape && styles.playerButtonLandscape,
                                  
                                ]}
                                onPress={() => handlePlayerToggle(area.id, selectedPlayers[2].id)}
                                activeOpacity={0.7}
                              >
                                <Text style={[
                                  styles.playerButtonText,
                                  area.selectedPlayers.includes(selectedPlayers[2].id) && styles.playerButtonTextSelected,
                                  
                                  isLandscape && styles.playerButtonTextLandscape,
                                  
                                ]}>
                                  {getPlayerInitials(selectedPlayers[2])}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </>
                      )}
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
                  
                  isLandscape && styles.pointsContainerLandscape,
                  
                ]}>
                  {/* Points Header Section */}
                  <View style={styles.pointsHeaderSection}>
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
                          ]} adjustsFontSizeToFit numberOfLines={1}>←</Text>
                        </TouchableOpacity>
                        
                        <Text style={[FONTS.h3, styles.roundNumber]}>Rd {currentRound}</Text>
                        
                        <TouchableOpacity
                          style={[
                            styles.roundNavButton,
                            currentRound >= Object.keys(rounds).length && Object.keys(rounds).length > 0 && styles.roundNavButtonDisabled
                          ]}
                          onPress={handleNextRoundNav}
                          disabled={currentRound >= Object.keys(rounds).length && Object.keys(rounds).length > 0}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.roundNavButtonText,
                            currentRound >= Object.keys(rounds).length && Object.keys(rounds).length > 0 && styles.roundNavButtonTextDisabled
                          ]} adjustsFontSizeToFit numberOfLines={1}>→</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.pointsHeaderButtons}>
                        <TouchableOpacity
                          style={styles.saveRoundButton}
                          onPress={handleSaveCurrentRound}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.saveRoundButtonText} adjustsFontSizeToFit numberOfLines={1}>💾</Text>
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
                          <Text style={styles.payoutButtonText} adjustsFontSizeToFit numberOfLines={1}>💰</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.newRoundIconButton}
                          onPress={handleNextRound}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.newRoundIconButtonText} adjustsFontSizeToFit numberOfLines={1}>➕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  
                  {/* Table Header Section */}
                  <View style={styles.pointsTableHeaderSection}>
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

                  {/* Scrollable Content Section */}
                  <View style={styles.pointsTableContentSection}>
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
                                <TouchableOpacity
                                  onPress={() => handleJumpToRound(round)}
                                  activeOpacity={0.7}
                                  style={styles.roundNumberButton}
                                >
                                  <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.roundText, round === currentRound && styles.currentRoundText]}>
                                    {round}
                                  </Text>
                                </TouchableOpacity>
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
          ) : (
              /* Portrait Mode - New Vertical Layout */
              <View style={styles.portraitContainer}>
                {/* Fixed Title Bar */}
                <View style={styles.titleBarFixed}>
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

                {/* Flexible Areas Grid */}
                {!isPointsExpanded && (
                  <View style={styles.areasFlexContainer}>
                    <View style={styles.areasList}>
                      {areas.map((area) => (
                        <View key={area.id} style={[styles.areaRowCard, area.baseValue === 8 && styles.specialFourthRow]}>
                          {area.baseValue === 8 && area.isDualHandMode && area.dualHandConditions ? (
                            <>
                              {/* High hand row */}
                              <View style={styles.areaRow}>
                                <View style={styles.areaLeft}>
                                  <TouchableOpacity
                                    style={styles.areaLabelButton}
                                    onPress={() => handleAreaPress(area)}
                                    activeOpacity={0.8}
                                  >
                                    <View style={styles.areaLabelColumn}>
                                      <View style={styles.areaLabelRow}>
                                        <Text style={[FONTS.h1, styles.areaLabel]}>{((area.baseValue / 2) * (area.multiplier || 1))}</Text>
                                        {area.multiplier > 1 && (
                                          <Text style={[FONTS.caption, styles.multiplierText]}>×{area.multiplier}</Text>
                                        )}
                                      </View>
                                      <Text style={styles.handSubLabel}>High</Text>
                                    </View>
                                  </TouchableOpacity>
                                </View>
                                <View style={styles.areaRightButtons}>
                                  {selectedPlayers.slice(0,3).map((player) => (
                                    <TouchableOpacity
                                      key={`high-${player.id}`}
                                      style={[
                                        styles.playerButton,
                                        area.dualHandConditions!.highHand.selectedPlayers.includes(player.id) && styles.playerButtonSelected,
                                      ]}
                                      onPress={() => handleDualHandPlayerToggle(area.id, 'highHand', player.id)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={[
                                        styles.playerButtonText,
                                        area.dualHandConditions!.highHand.selectedPlayers.includes(player.id) && styles.playerButtonTextSelected,
                                      ]}>
                                        {getPlayerInitials(player)}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>

                              {/* Low hand row */}
                              <View style={[styles.areaRow, styles.dualLowRow]}>
                                <View style={styles.areaLeft}>
                                  <View style={styles.areaLabelColumn}>
                                    <View style={styles.areaLabelRow}>
                                      <Text style={[FONTS.h1, styles.areaLabel]}>{((area.baseValue / 2) * (area.multiplier || 1))}</Text>
                                      {area.multiplier > 1 && (
                                        <Text style={[FONTS.caption, styles.multiplierText]}>×{area.multiplier}</Text>
                                      )}
                                    </View>
                                    <Text style={styles.handSubLabel}>Low</Text>
                                  </View>
                                </View>
                                <View style={styles.areaRightButtons}>
                                  {selectedPlayers.slice(0,3).map((player) => (
                                    <TouchableOpacity
                                      key={`low-${player.id}`}
                                      style={[
                                        styles.playerButton,
                                        area.dualHandConditions!.lowHand.selectedPlayers.includes(player.id) && styles.playerButtonSelected,
                                      ]}
                                      onPress={() => handleDualHandPlayerToggle(area.id, 'lowHand', player.id)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={[
                                        styles.playerButtonText,
                                        area.dualHandConditions!.lowHand.selectedPlayers.includes(player.id) && styles.playerButtonTextSelected,
                                      ]}>
                                        {getPlayerInitials(player)}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>

                              {/* Clickable bottom border to merge/split */}
                              <TouchableOpacity 
                                onPress={() => handleDualHandToggle(area.id)} 
                                activeOpacity={0.7} 
                                style={styles.splitToggleTouchArea} 
                              >
                                <View style={styles.arrowPatternContainer}>
                                  {/* Up arrows pattern for dual mode (merge) */}
                                  <View style={[styles.arrowUp, { left: '10%' }]} />
                                  <View style={[styles.arrowUp, { left: '25%' }]} />
                                  <View style={[styles.arrowUp, { left: '40%' }]} />
                                  <View style={[styles.arrowUp, { left: '55%' }]} />
                                  <View style={[styles.arrowUp, { left: '70%' }]} />
                                  <View style={[styles.arrowUp, { left: '85%' }]} />
                                </View>
                              </TouchableOpacity>
                            </>
                          ) : (
                            // Standard single row
                            <View style={styles.areaRow}>
                              <View style={styles.areaLeft}>
                                <TouchableOpacity
                                  style={styles.areaLabelButton}
                                  onPress={() => handleAreaPress(area)}
                                  activeOpacity={0.8}
                                >
                                  <View style={styles.areaLabelColumn}>
                                    <View style={styles.areaLabelRow}>
                                      <Text style={[FONTS.h1, styles.areaLabel]}>{(area.baseValue * (area.multiplier || 1))}</Text>
                                      {area.multiplier > 1 && (
                                        <Text style={[FONTS.caption, styles.multiplierText]}>×{area.multiplier}</Text>
                                      )}
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              </View>
                              <View style={styles.areaRightButtons}>
                                {selectedPlayers[0] && (
                                  <TouchableOpacity
                                    style={[
                                      styles.playerButton,
                                      area.selectedPlayers.includes(selectedPlayers[0].id) && styles.playerButtonSelected,
                                    ]}
                                    onPress={() => handlePlayerToggle(area.id, selectedPlayers[0].id)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[
                                      styles.playerButtonText,
                                      area.selectedPlayers.includes(selectedPlayers[0].id) && styles.playerButtonTextSelected,
                                    ]}>
                                      {getPlayerInitials(selectedPlayers[0])}
                                    </Text>
                                  </TouchableOpacity>
                                )}
                                {selectedPlayers[1] && (
                                  <TouchableOpacity
                                    style={[
                                      styles.playerButton,
                                      area.selectedPlayers.includes(selectedPlayers[1].id) && styles.playerButtonSelected,
                                    ]}
                                    onPress={() => handlePlayerToggle(area.id, selectedPlayers[1].id)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[
                                      styles.playerButtonText,
                                      area.selectedPlayers.includes(selectedPlayers[1].id) && styles.playerButtonTextSelected,
                                    ]}>
                                      {getPlayerInitials(selectedPlayers[1])}
                                    </Text>
                                  </TouchableOpacity>
                                )}
                                {selectedPlayers[2] && (
                                  <TouchableOpacity
                                    style={[
                                      styles.playerButton,
                                      area.selectedPlayers.includes(selectedPlayers[2].id) && styles.playerButtonSelected,
                                    ]}
                                    onPress={() => handlePlayerToggle(area.id, selectedPlayers[2].id)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[
                                      styles.playerButtonText,
                                      area.selectedPlayers.includes(selectedPlayers[2].id) && styles.playerButtonTextSelected,
                                    ]}>
                                      {getPlayerInitials(selectedPlayers[2])}
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          )}
                          
                          {/* Clickable bottom border for 8-point area when not in dual mode */}
                          {area.baseValue === 8 && !area.isDualHandMode && (
                            <TouchableOpacity 
                              onPress={() => handleDualHandToggle(area.id)} 
                              activeOpacity={0.7} 
                              style={styles.splitToggleTouchArea} 
                            >
                              <View style={styles.arrowPatternContainer}>
                                {/* Down arrows pattern for single mode (split) */}
                                <View style={[styles.arrowDown, { left: '10%' }]} />
                                <View style={[styles.arrowDown, { left: '25%' }]} />
                                <View style={[styles.arrowDown, { left: '40%' }]} />
                                <View style={[styles.arrowDown, { left: '55%' }]} />
                                <View style={[styles.arrowDown, { left: '70%' }]} />
                                <View style={[styles.arrowDown, { left: '85%' }]} />
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Compact/Expandable Points Section */}
                <View style={[
                  styles.pointsBottomSection,
                  isPointsExpanded ? styles.pointsBottomSectionExpanded : styles.pointsBottomSectionCompact
                ]}>
                  {/* Points Header - Always Visible */}
                  <TouchableOpacity
                    style={styles.pointsToggleHeader}
                    onPress={() => setIsPointsExpanded(!isPointsExpanded)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pointsHeaderCompact}>
                      <View style={styles.roundNavigationCompact}>
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
                          ]} adjustsFontSizeToFit numberOfLines={1}>←</Text>
                        </TouchableOpacity>
                        
                        <Text style={[FONTS.h3, styles.roundNumber]}>Rd {currentRound}</Text>
                        
                        <TouchableOpacity
                          style={[
                            styles.roundNavButton,
                            currentRound >= Object.keys(rounds).length && Object.keys(rounds).length > 0 && styles.roundNavButtonDisabled
                          ]}
                          onPress={handleNextRoundNav}
                          disabled={currentRound >= Object.keys(rounds).length && Object.keys(rounds).length > 0}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.roundNavButtonText,
                            currentRound >= Object.keys(rounds).length && Object.keys(rounds).length > 0 && styles.roundNavButtonTextDisabled
                          ]} adjustsFontSizeToFit numberOfLines={1}>→</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.pointsHeaderButtons}>
                        <TouchableOpacity
                          style={styles.saveRoundButton}
                          onPress={handleSaveRound}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.saveRoundButtonText} adjustsFontSizeToFit numberOfLines={1}>💾</Text>
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
                          <Text style={styles.payoutButtonText} adjustsFontSizeToFit numberOfLines={1}>💰</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.newRoundIconButton}
                          onPress={handleNewRound}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.newRoundIconButtonText} adjustsFontSizeToFit numberOfLines={1}>➕</Text>
                        </TouchableOpacity>
                        <Text style={styles.expandIcon}>
                          {isPointsExpanded ? '▼' : '▲'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Compact Points Table - Current Round + Totals */}
                  {!isPointsExpanded && (
                    <View style={styles.pointsTableCompact}>
                      {/* Header Row */}
                      <View style={styles.pointsRow}>
                        <View style={[styles.pointsCell, styles.pointsCellHeader]}>
                          <Text style={[FONTS.caption, styles.pointsCellTextSmall]}>Round</Text>
                        </View>
                        {selectedPlayers.map((player) => (
                          <View key={player.id} style={[styles.pointsCell, styles.pointsCellHeader]}>
                            <Text style={[FONTS.caption, styles.pointsCellTextSmall]}>
                              {getPlayerInitials(player)}
                            </Text>
                          </View>
                        ))}
                      </View>

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
                  )}

                  {/* Expanded Points Table - All Rounds (only when expanded) */}
                  {isPointsExpanded && (
                    <View style={styles.pointsExpandedLayout}>
                      {/* Fixed Header Section */}
                      <View style={styles.expandedHeaderSection}>
                        <View style={styles.pointsRow}>
                          <View style={[styles.pointsCell, styles.pointsCellHeader]}>
                            <Text style={[FONTS.caption, styles.pointsCellTextSmall]}>Round</Text>
                          </View>
                          {selectedPlayers.map((player) => (
                            <View key={player.id} style={[styles.pointsCell, styles.pointsCellHeader]}>
                              <Text style={[FONTS.caption, styles.pointsCellTextSmall]}>
                                {getPlayerInitials(player)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Flexible Middle Section - Historical Rounds */}
                      <View style={styles.expandedMiddleSection}>
                        <ScrollView
                          style={styles.expandedScrollView}
                          showsVerticalScrollIndicator={true}
                          contentContainerStyle={styles.expandedScrollContent}
                        >
                          {Object.keys(rounds).map(roundNumber => {
                            const round = parseInt(roundNumber);
                            const roundState = rounds[round];
                            return (
                              <View key={round} style={styles.pointsRow}>
                                <View style={styles.pointsCell}>
                                  <View style={styles.roundCellContent}>
                                    <TouchableOpacity
                                      onPress={() => handleJumpToRound(round)}
                                      activeOpacity={0.7}
                                      style={styles.roundNumberButton}
                                    >
                                      <Text style={[FONTS.body, styles.pointsCellTextSmall, styles.roundText, round === currentRound && styles.currentRoundText]}>
                                        {round}
                                      </Text>
                                    </TouchableOpacity>
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
                        </ScrollView>
                      </View>

                      {/* Fixed Footer Section - Totals */}
                      <View style={styles.expandedFooterSection}>
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
                    </View>
                  )}
                </View>
              </View>
            )}

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
                  style={styles.modalInput}
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
  areasList: {
    flexDirection: 'column',
    gap: SPACING.sm,
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
  },
  areaRowCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  areaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
    width: '30%',
    minWidth: 0,
  },
  areaLabelColumn: {
    flexDirection: 'column',
  },
  handSubLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  areaRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    flex: 1,
    flexShrink: 0,
  },
  handTag: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  dualLowRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  topLeftSection: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    zIndex: 1,
  },
  areaLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  areaLabelButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  dualHandToggle: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dualHandToggleIcon: {
    fontSize: 12,
    color: COLORS.primary,
  },
  dualHandContainer: {
    position: 'absolute',
    top: '25%', // Responsive positioning - 25% for label, 75% for content
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    flexDirection: 'column',
  },
  dualHandContainerLandscape: {
    top: '30%', // More space for landscape labels
  },
  dualHandContainerLandscapeTablet: {
    top: '35%', // Even more space for tablet landscape
  },
  dualHandSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    minHeight: '40%', // Ensure minimum usable height
  },

  dualHandSectionLowBackground: {
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },

  dualHandPlayers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs, // Responsive gap between players
  },
  dualHandPlayerButton: {
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dualHandPlayerButtonTablet: {
    minWidth: 44,
    minHeight: 44,
    maxWidth: 72,
    borderRadius: 16,
  },
  dualHandPlayerButtonLandscape: {
    minWidth: 32,
    minHeight: 32,
    maxWidth: 56,
    borderRadius: 10,
  },
  dualHandPlayerButtonLandscapeTablet: {
    minWidth: 40,
    minHeight: 40,
    maxWidth: 64,
    borderRadius: 14,
  },
  dualHandPlayerButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dualHandPlayerButtonTextTablet: {
    fontSize: 16,
  },
  dualHandPlayerButtonTextLandscape: {
    fontSize: 10,
  },
  dualHandPlayerButtonTextLandscapeTablet: {
    fontSize: 14,
  },
  topRightSection: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  topRightSectionLandscape: {
    top: SPACING.md,
    right: SPACING.md,
    width: '45%',
    height: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLeftSection: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  bottomLeftSectionLandscape: {
    bottom: SPACING.md,
    left: SPACING.md,
    width: '45%',
    height: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRightSection: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  bottomRightSectionLandscape: {
    bottom: SPACING.md,
    right: SPACING.md,
    width: '45%',
    height: '45%',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: 1 },
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
    width: '70%',
    height: '70%',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    aspectRatio: 1,
  },
  playerButtonLandscapeTablet: {
    width: '75%',
    height: '75%',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerButtonTextLandscapeTablet: {
    fontSize: 20,
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
  areaLabelLandscape: {
    fontSize: 28, // Smaller font in landscape to reduce height
  },
  areaLabelLandscapeTablet: {
    fontSize: 36, // Smaller for tablet landscape
  },
  multiplierText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  multiplierTextTablet: {
    fontSize: 18,
  },
  multiplierTextLandscape: {
    fontSize: 12, // Smaller multiplier text in landscape
  },
  multiplierTextLandscapeTablet: {
    fontSize: 14, // Smaller for tablet landscape
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
    padding: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    height: '45%',
    flex: 1,
    flexDirection: 'column',
  },
  pointsContainerTablet: {
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pointsContainerLandscape: {
    height: '75%',
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  pointsContainerLandscapeTablet: {
    height: '80%',
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  pointsHeader: {
    marginBottom: SPACING.md,
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
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pointsHeaderSection: {
    flexShrink: 0,
  },
  pointsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    minHeight: SPACING.xxl + SPACING.lg, // 48 + 16 = 64px, enough space for 48px buttons + padding
    paddingVertical: SPACING.xs,
  },
  pointsTableHeaderSection: {
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pointsTableContentSection: {
    flex: 1,
  },
  pointsHeaderButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNavButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    width: RESPONSIVE.buttonSizeMedium,
    height: RESPONSIVE.buttonSizeMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNavButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  roundNavButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  roundNavButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  roundNumber: {
    color: COLORS.text,
    fontWeight: 'bold',
    lineHeight: 48,
    textAlignVertical: 'center',
  },
  payoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    width: RESPONSIVE.buttonSizeMedium,
    height: RESPONSIVE.buttonSizeMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  newRoundIconButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    width: RESPONSIVE.buttonSizeMedium,
    height: RESPONSIVE.buttonSizeMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newRoundIconButtonText: {
    color: COLORS.background,
    fontSize: 16,
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
    marginTop: SPACING.sm,
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
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    width: RESPONSIVE.buttonSizeMedium,
    height: RESPONSIVE.buttonSizeMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveRoundButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // New Portrait Mode Styles
  portraitContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  titleBarFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  areasFlexContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pointsBottomSection: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pointsBottomSectionCompact: {
    height: '30%',
    maxHeight: '30%',
  },
  pointsBottomSectionExpanded: {
    flex: 1, // Take all remaining space below title bar
  },
  pointsToggleHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pointsHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundNavigationCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pointsTableCompact: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  pointsExpandedLayout: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  expandIcon: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  expandedHeaderSection: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  expandedMiddleSection: {
    flexShrink: 1,
    marginBottom: SPACING.sm,
  },
  expandedScrollView: {
  },
  expandedScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  expandedFooterSection: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  areaMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitToggleBarButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'transparent',
  },
  splitToggleBarText: {
    color: COLORS.primary,
    textAlign: 'center',
  },
  specialFourthRow: {
    borderBottomWidth: 36,
    borderBottomColor: COLORS.primary,
  },
  splitToggleTouchArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -36,
    height: 36,
    zIndex: 1,
  },
  arrowPatternContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xs,
  },
  arrowUp: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.surface,
    top: '25%',
  },
  arrowDown: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.surface,
    bottom: '25%',
  },
  roundNumberButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: SPACING.xs,
  },
  currentRoundText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
}); 