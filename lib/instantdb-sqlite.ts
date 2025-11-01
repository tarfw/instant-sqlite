// lib/instantdb-sqlite.ts
import { init as instantInit } from '@instantdb/react-native';
import { sqliteStorage } from './storage-adapter';

// Store original AsyncStorage
let originalAsyncStorage: any = null;

/**
 * Initialize InstantDB with SQLite storage
 * This replaces AsyncStorage with our SQLite adapter
 */
export async function initWithSQLite(config: { appId: string }) {
  console.log('🔧 Setting up InstantDB with SQLite...');

  // Initialize SQLite storage first
  await sqliteStorage.init();

  // Override AsyncStorage module
  // This is a "hack" that makes InstantDB use SQLite
  try {
    const AsyncStorageModule = require('@react-native-async-storage/async-storage');

    // Save original AsyncStorage (just in case)
    originalAsyncStorage = { ...AsyncStorageModule.default };

    // Replace AsyncStorage methods with our SQLite adapter
    AsyncStorageModule.default.getItem = sqliteStorage.getItem.bind(sqliteStorage);
    AsyncStorageModule.default.setItem = sqliteStorage.setItem.bind(sqliteStorage);
    AsyncStorageModule.default.removeItem = sqliteStorage.removeItem.bind(sqliteStorage);
    AsyncStorageModule.default.multiGet = sqliteStorage.multiGet.bind(sqliteStorage);
    AsyncStorageModule.default.multiSet = sqliteStorage.multiSet.bind(sqliteStorage);
    AsyncStorageModule.default.multiRemove = sqliteStorage.multiRemove.bind(sqliteStorage);
    AsyncStorageModule.default.getAllKeys = sqliteStorage.getAllKeys.bind(sqliteStorage);
    AsyncStorageModule.default.clear = sqliteStorage.clear.bind(sqliteStorage);

    console.log('✅ AsyncStorage overridden with SQLite!');
  } catch (error) {
    console.error('❌ Failed to override AsyncStorage:', error);
    throw error;
  }

  // Now initialize InstantDB (it will use our SQLite storage)
  const db = instantInit(config);

  console.log('✅ InstantDB initialized with SQLite storage!');

  return db;
}

/**
 * Restore original AsyncStorage (if needed for other parts of your app)
 */
export function restoreAsyncStorage() {
  if (originalAsyncStorage) {
    const AsyncStorageModule = require('@react-native-async-storage/async-storage');
    Object.assign(AsyncStorageModule.default, originalAsyncStorage);
    console.log('✅ Original AsyncStorage restored');
  }
}

/**
 * Get storage statistics (useful for debugging)
 */
export async function getStorageStats() {
  const size = await sqliteStorage.getStorageSize();
  return {
    itemCount: size,
    storageType: 'SQLite',
  };
}
