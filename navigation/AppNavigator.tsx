import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StartupScreen } from '../screens/StartupScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { MainScreen } from '../screens/MainScreen';
import { GamesScreen } from '../screens/GamesScreen';
import { CashoutScreen } from '../screens/CashoutScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Player, Game } from '../utils/storage';

export type RootStackParamList = {
  Startup: undefined;
  Player: undefined;
  Main: { selectedPlayers: Player[] } | { game: Game };
  Games: undefined;
  Cashout: { game?: Game };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Startup"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
                  <Stack.Screen name="Startup" component={StartupScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Games" component={GamesScreen} />
        <Stack.Screen name="Cashout" component={CashoutScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}; 