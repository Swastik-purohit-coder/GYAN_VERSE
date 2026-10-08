import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initNativeSyncEngine } from './src/lib/sync/syncEngine';

export default function App() {
  useEffect(() => {
    const cleanupSync = initNativeSyncEngine();
    return () => {
      cleanupSync();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0F172A" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
