import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { Player, Game, storage } from '../utils/storage';

type NavigationProp = any;
type CashoutRouteProp = any;

interface CashoutScreenProps {
  game?: Game;
}

export const CashoutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CashoutRouteProp>();
  const { game } = route.params || {};
  const { isLandscape, isTablet } = useResponsive();
  
  const [directSettlements, setDirectSettlements] = useState<Array<{
    fromPlayer: Player;
    toPlayer: Player;
    amount: number;
  }>>([]);
  
  const [optimizedSettlements, setOptimizedSettlements] = useState<Array<{
    fromPlayer: Player;
    toPlayer: Player;
    amount: number;
  }>>([]);

  useEffect(() => {
    console.log('CashoutScreen - route params:', route.params);
    console.log('CashoutScreen - game from route:', game);
    if (game) {
      calculateSettlements();
    } else {
      console.log('No game provided to CashoutScreen');
    }
  }, [game, route.params]);

  const calculateSettlements = () => {
    if (!game) return;

    console.log('Game object:', game);
    console.log('Game rounds:', game.rounds);
    console.log('Number of rounds:', Object.keys(game.rounds).length);
    console.log('Round keys:', Object.keys(game.rounds));

    const totalPoints: { [playerId: string]: number } = {};
    
    // Calculate total points for each player
    game.players.forEach((player: Player) => {
      totalPoints[player.id] = 0;
    });

    // Sum up all rounds (doubling is already applied when rounds are saved)
    Object.values(game.rounds).forEach((round: any) => {
      console.log('Processing round:', round);
      Object.entries(round.points).forEach(([playerId, points]: [string, any]) => {
        console.log(`Player ${playerId} gets ${points} points`);
        totalPoints[playerId] += points;
      });
    });

    console.log('Total points calculated:', totalPoints);

    // Get all player pair permutations
    const playerPairs: Array<[Player, Player]> = [];
    for (let i = 0; i < game.players.length; i++) {
      for (let j = 0; j < game.players.length; j++) {
        if (i !== j) {
          playerPairs.push([game.players[i], game.players[j]]);
        }
      }
    }
    // Remove duplicate player pairs
    const uniquePairs = playerPairs.filter(([player1, player2], index) => {
      // Check if this pair exists earlier in the array in either order
      return !playerPairs.some(([p1, p2], i) => 
        i < index && (
          (p1.id === player1.id && p2.id === player2.id) ||
          (p1.id === player2.id && p2.id === player1.id)
        )
      );
    });

    // Generate direct settlements between each player pair
    const settlements: Array<{
      fromPlayer: Player;
      toPlayer: Player;
      amount: number;
    }> = [];

    // Create settlements for each unique player pair
    uniquePairs.forEach(([player1, player2]) => {
      const difference = totalPoints[player1.id] - totalPoints[player2.id];
      
      if (difference > 0) {
        // player1 wins from player2
        settlements.push({
          fromPlayer: player2,
          toPlayer: player1,
          amount: difference,
        });
      } else if (difference < 0) {
        // player2 wins from player1
        settlements.push({
          fromPlayer: player1,
          toPlayer: player2,
          amount: Math.abs(difference),
        });
      }
      // If difference is 0, no settlement needed
    });

    // Optimize settlements by combining payments through intermediaries
    const optimizedSettlements: Array<{
      fromPlayer: Player;
      toPlayer: Player;
      amount: number;
    }> = [];

    // Create a map of net amounts for each player
    const netAmounts: { [playerId: string]: number } = {};
    game.players.forEach((player: Player) => {
      netAmounts[player.id] = 0;
    });

    // Calculate net amounts from direct settlements
    settlements.forEach((settlement) => {
      netAmounts[settlement.fromPlayer.id] -= settlement.amount;
      netAmounts[settlement.toPlayer.id] += settlement.amount;
    });

    // Separate players into debtors and creditors
    const debtors = game.players.filter((player: Player) => netAmounts[player.id] < 0);
    const creditors = game.players.filter((player: Player) => netAmounts[player.id] > 0);

    // Create optimized settlements
    debtors.forEach((debtor: Player) => {
      const debtorAmount = Math.abs(netAmounts[debtor.id]);
      
      creditors.forEach((creditor: Player) => {
        const creditorAmount = netAmounts[creditor.id];
        
        if (debtorAmount > 0 && creditorAmount > 0) {
          const paymentAmount = Math.min(debtorAmount, creditorAmount);
          
          optimizedSettlements.push({
            fromPlayer: debtor,
            toPlayer: creditor,
            amount: paymentAmount,
          });
          
          // Update remaining amounts
          netAmounts[debtor.id] += paymentAmount;
          netAmounts[creditor.id] -= paymentAmount;
        }
      });
    });

    setDirectSettlements(settlements);
    setOptimizedSettlements(optimizedSettlements);
  };

  const handleGoHome = () => {
    navigation.navigate('Startup');
  };

  const handleBackToMain = () => {
    navigation.goBack();
  };

  const getPlayerName = (player: Player) => {
    return `${player.firstName} ${player.lastName}`;
  };

  const getPlayerInitials = (player: Player) => {
    return player.initials || `${player.firstName[0]}${player.lastName[0]}`;
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
            <Text style={[FONTS.h2, styles.title]}>2468</Text>
            <View style={styles.headerButtons}>
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
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleBackToMain}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cashout Content */}
          <View style={styles.cashoutContent}>
            <Text style={[FONTS.h3, styles.cashoutTitle]}>Cashout Summary</Text>
            
            {directSettlements.length === 0 && optimizedSettlements.length === 0 ? (
              <View style={styles.noSettlements}>
                <Text style={[FONTS.body, styles.noSettlementsText]}>
                  No cashout needed - all players are even!
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.settlementsList}
                showsVerticalScrollIndicator={false}
              >
                {/* Optimized Settlements Section */}
                {optimizedSettlements.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={[FONTS.h3, styles.sectionTitle]}>Optimized Settlements</Text>
                    <Text style={[FONTS.caption, styles.sectionSubtitle]}>
                      Minimal transactions to settle all debts
                    </Text>
                    {optimizedSettlements.map((settlement: any, index: number) => (
                      <View key={`optimized-${index}`} style={[styles.settlementItem, styles.optimizedItem]}>
                        <View style={styles.settlementHeader}>
                          <Text style={[FONTS.body, styles.settlementText]}>
                            {getPlayerName(settlement.fromPlayer)} pays {getPlayerName(settlement.toPlayer)}
                          </Text>
                        </View>
                        <View style={styles.settlementDetails}>
                          <View style={styles.playerInfo}>
                            <Text style={[FONTS.caption, styles.playerInitials]}>
                              {getPlayerInitials(settlement.fromPlayer)}
                            </Text>
                            <Text style={[FONTS.caption, styles.playerName]}>
                              {getPlayerName(settlement.fromPlayer)}
                            </Text>
                          </View>
                          <View style={styles.amountContainer}>
                            <Text style={[FONTS.h3, styles.amount]}>
                              ${settlement.amount.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.playerInfo}>
                            <Text style={[FONTS.caption, styles.playerInitials]}>
                              {getPlayerInitials(settlement.toPlayer)}
                            </Text>
                            <Text style={[FONTS.caption, styles.playerName]}>
                              {getPlayerName(settlement.toPlayer)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Direct Settlements Section */}
                {directSettlements.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={[FONTS.h3, styles.sectionTitle]}>Direct Settlements</Text>
                    <Text style={[FONTS.caption, styles.sectionSubtitle]}>
                      Total amounts owed between each player pair
                    </Text>
                    {directSettlements.map((settlement: any, index: number) => (
                      <View key={`direct-${index}`} style={styles.settlementItem}>
                        <View style={styles.settlementHeader}>
                          <Text style={[FONTS.body, styles.settlementText]}>
                            {getPlayerName(settlement.fromPlayer)} pays {getPlayerName(settlement.toPlayer)}
                          </Text>
                        </View>
                        <View style={styles.settlementDetails}>
                          <View style={styles.playerInfo}>
                            <Text style={[FONTS.caption, styles.playerInitials]}>
                              {getPlayerInitials(settlement.fromPlayer)}
                            </Text>
                            <Text style={[FONTS.caption, styles.playerName]}>
                              {getPlayerName(settlement.fromPlayer)}
                            </Text>
                          </View>
                          <View style={styles.amountContainer}>
                            <Text style={[FONTS.h3, styles.amount]}>
                              ${settlement.amount.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.playerInfo}>
                            <Text style={[FONTS.caption, styles.playerInitials]}>
                              {getPlayerInitials(settlement.toPlayer)}
                            </Text>
                            <Text style={[FONTS.caption, styles.playerName]}>
                              {getPlayerName(settlement.toPlayer)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
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
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  closeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 24,
  },
  cashoutContent: {
    flex: 1,
  },
  cashoutTitle: {
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  noSettlements: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSettlementsText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  settlementsList: {
    flex: 1,
  },
  settlementItem: {
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
  settlementHeader: {
    marginBottom: SPACING.sm,
  },
  settlementText: {
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  settlementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  playerInitials: {
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  playerName: {
    color: COLORS.text,
    textAlign: 'center',
  },
  amountContainer: {
    flex: 2,
    alignItems: 'center',
  },
  amount: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  optimizedItem: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
}); 