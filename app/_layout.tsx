// app/_layout.tsx
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { initWithSQLite, getStorageStats } from '@/lib/instantdb-sqlite';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import "../global.css";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

// Your InstantDB App ID
const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID || '__YOUR_APP_ID__';

// Global db instance
let db: any = null;

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Wait for initialization in _layout.');
  }
  return db;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('🚀 Starting app initialization...');

        // Initialize InstantDB with SQLite
        db = await initWithSQLite({ appId: APP_ID });

        // Log storage stats
        const stats = await getStorageStats();
        console.log('📊 Storage stats:', stats);

        setIsReady(true);
        console.log('✅ App initialized successfully!');
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    initializeApp();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // Show loading screen while initializing
  if (!isReady) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.text}>
            {error ? `Error: ${error}` : 'Initializing SQLite storage...'}
          </Text>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
