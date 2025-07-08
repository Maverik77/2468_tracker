import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { Player } from '../utils/storage';
import { Swipeable } from 'react-native-gesture-handler';

interface SwipeablePlayerItemProps {
  player: Player;
  onToggle: (playerId: string) => void;
  onDelete: (playerId: string) => void;
  onEdit: (player: Player) => void;
  isTablet?: boolean;
}

export const SwipeablePlayerItem: React.FC<SwipeablePlayerItemProps> = ({
  player,
  onToggle,
  onDelete,
  onEdit,
  isTablet = false,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const handleEdit = () => {
    onEdit(player);
    swipeableRef.current?.close();
  };

  const handleDelete = () => {
    onDelete(player.id);
    swipeableRef.current?.close();
  };

  return (
    <View style={styles.container}>
      {/* Delete Button (hidden behind player item) */}
      <View style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </View>
      
      {/* Player Item */}
      <Swipeable
        ref={swipeableRef}
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={handleDelete}
          >
            <Text style={styles.deleteActionText}>🗑️</Text>
          </TouchableOpacity>
        )}
        renderLeftActions={() => (
          <TouchableOpacity
            style={styles.editAction}
            onPress={handleEdit}
          >
            <Text style={styles.editActionText}>✏️</Text>
          </TouchableOpacity>
        )}
      >
        <Animated.View
          style={[
            styles.playerItem,
            player.selected && styles.playerItemSelected,
            isTablet && styles.playerItemTablet,
            {
              transform: [{ translateX: 0 }], // This Animated.Value is no longer needed
            },
          ]}
        >
          <TouchableOpacity
            style={styles.playerContent}
            onPress={() => onToggle(player.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              FONTS.body,
              styles.playerName,
              player.selected && styles.playerNameSelected,
              isTablet && styles.playerNameTablet
            ]}>
              {player.firstName} {player.lastName}
            </Text>
            {player.selected && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  playerItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  playerItemTablet: {
    paddingVertical: SPACING.md,
  },
  playerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  playerName: {
    color: COLORS.text,
    flex: 1,
  },
  playerNameSelected: {
    color: COLORS.background,
    fontWeight: '600',
  },
  playerNameTablet: {
    fontSize: 18,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
  },
  deleteActionText: {
    color: COLORS.background,
    fontSize: 24,
  },
  editAction: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
  },
  editActionText: {
    color: COLORS.background,
    fontSize: 24,
  },
}); 