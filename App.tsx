import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        // Check if we're running in development mode
        if (__DEV__) {
          console.log('Running in development mode, skipping OTA updates');
          return;
        }

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('Update available, fetching...');
          await Updates.fetchUpdateAsync();
          console.log('Update fetched, reloading...');
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Error fetching update:', error);
      }
    }

    onFetchUpdateAsync();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
