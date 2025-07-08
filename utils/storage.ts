import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  initials?: string;
  selected: boolean;
}

export interface Game {
  id: string;
  players: Player[];
  createdAt: string;
  rounds: { [roundNumber: number]: RoundState };
  currentRound: number;
}

export interface RoundState {
  areas: Area[];
  points: PlayerPoints;
}

export interface Area {
  id: string;
  baseValue: number;
  multiplier: number;
  label: string;
  selectedPlayers: string[];
}

export interface PlayerPoints {
  [playerId: string]: number;
}

export interface Settings {
  defaultMultiplier: number;
  winningAllFourPaysDouble: boolean;
}

const PLAYERS_STORAGE_KEY = '@2468_tracker_players';
const GAMES_STORAGE_KEY = '@2468_tracker_games';
const SETTINGS_STORAGE_KEY = '@2468_tracker_settings';

export const storage = {
  // Save players to local storage
  async savePlayers(players: Player[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
    } catch (error) {
      console.error('Error saving players:', error);
    }
  },

  async addPlayer(player: Player): Promise<void> {
    try {
      const existingPlayers = await this.loadPlayers();
      const updatedPlayers = [...existingPlayers, player];
      await this.savePlayers(updatedPlayers);
    } catch (error) {
      console.error('Error adding player:', error);
    }
  },

  async updatePlayer(updatedPlayer: Player): Promise<void> {
    try {
      const existingPlayers = await this.loadPlayers();
      const updatedPlayers = existingPlayers.map(player => 
        player.id === updatedPlayer.id ? updatedPlayer : player
      );
      await this.savePlayers(updatedPlayers);
    } catch (error) {
      console.error('Error updating player:', error);
    }
  },

  // Load players from local storage
  async loadPlayers(): Promise<Player[]> {
    try {
      const playersJson = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
      if (playersJson) {
        return JSON.parse(playersJson);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
    
    // Return default players if no stored data
    return [
      { id: '1', firstName: 'John', lastName: 'Doe', selected: false },
      { id: '2', firstName: 'Jane', lastName: 'Smith', selected: false },
      { id: '3', firstName: 'Mike', lastName: 'Johnson', selected: false },
    ];
  },

  // Clear all stored players
  async clearPlayers(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PLAYERS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing players:', error);
    }
  },

  // Save games to local storage
  async saveGames(games: Game[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
    } catch (error) {
      console.error('Error saving games:', error);
    }
  },

  // Load games from local storage
  async loadGames(): Promise<Game[]> {
    try {
      const gamesJson = await AsyncStorage.getItem(GAMES_STORAGE_KEY);
      if (gamesJson) {
        return JSON.parse(gamesJson);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    }
    return [];
  },

  // Save a single game
  async saveGame(game: Game): Promise<void> {
    try {
      const games = await this.loadGames();
      const existingGameIndex = games.findIndex(g => g.id === game.id);
      
      if (existingGameIndex >= 0) {
        games[existingGameIndex] = game;
      } else {
        games.push(game);
      }
      
      await this.saveGames(games);
    } catch (error) {
      console.error('Error saving game:', error);
    }
  },

  // Delete a game
  async deleteGame(gameId: string): Promise<void> {
    try {
      const games = await this.loadGames();
      const filteredGames = games.filter(g => g.id !== gameId);
      await this.saveGames(filteredGames);
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  },

  // Clear all stored games
  async clearGames(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GAMES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing games:', error);
    }
  },

  // Load settings from local storage
  async loadSettings(): Promise<Settings> {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    // Return default settings if no stored data
    return {
      defaultMultiplier: 1,
      winningAllFourPaysDouble: false,
    };
  },

  // Save settings to local storage
  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },
}; 