// lib/storage-adapter.ts
import * as SQLite from 'expo-sqlite';

/**
 * SQLite Storage Adapter
 * This replaces AsyncStorage for InstantDB
 */
class SQLiteStorageAdapter {
  private db: SQLite.SQLiteDatabase | null = null;
  private ready: boolean = false;

  /**
   * Initialize the SQLite database
   */
  async init() {
    try {
      console.log('📦 Initializing SQLite storage...');

      // Open SQLite database
      this.db = await SQLite.openDatabaseAsync('instantdb-storage.db');

      if (!this.db) {
        throw new Error('Failed to open SQLite database - db is null');
      }

      // Create key-value table to mimic AsyncStorage
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS kv_storage (
          key TEXT PRIMARY KEY,
          value TEXT,
          created_at INTEGER DEFAULT 0,
          updated_at INTEGER DEFAULT 0
        );

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_key ON kv_storage(key);
      `);

      this.ready = true;
      console.log('✅ SQLite storage initialized!');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite storage:', error);
      throw error;
    }
  }

  /**
   * Check if storage is ready
   */
  private ensureReady() {
    if (!this.ready || !this.db) {
      throw new Error('SQLite storage not initialized. Call init() first.');
    }
  }

  /**
   * Get a value by key (AsyncStorage.getItem replacement)
   */
  async getItem(key: string): Promise<string | null> {
    this.ensureReady();

    try {
      const result = await this.db!.getFirstAsync<{ value: string }>(
        'SELECT value FROM kv_storage WHERE key = ?',
        [key]
      );

      return result ? result.value : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value by key (AsyncStorage.setItem replacement)
   */
  async setItem(key: string, value: string): Promise<void> {
  this.ensureReady();

  try {
  const now = Math.floor(Date.now() / 1000);
  await this.db!.runAsync(
  `INSERT INTO kv_storage (key, value, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
     updated_at = excluded.updated_at`,
    [key, value, now]
    );
  } catch (error) {
  console.error(`Error setting item ${key}:`, error);
    throw error;
    }
  }

  /**
   * Remove a value by key (AsyncStorage.removeItem replacement)
   */
  async removeItem(key: string): Promise<void> {
    this.ensureReady();

    try {
      await this.db!.runAsync(
        'DELETE FROM kv_storage WHERE key = ?',
        [key]
      );
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple items (AsyncStorage.multiGet replacement)
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    this.ensureReady();

    try {
      const placeholders = keys.map(() => '?').join(',');
      const results = await this.db!.getAllAsync<{ key: string; value: string }>(
        `SELECT key, value FROM kv_storage WHERE key IN (${placeholders})`,
        keys
      );

      // Create a map for quick lookup
      const resultMap = new Map(results.map(r => [r.key, r.value]));

      // Return in the same format as AsyncStorage.multiGet
      return keys.map(key => [key, resultMap.get(key) || null]);
    } catch (error) {
      console.error('Error in multiGet:', error);
      return keys.map(key => [key, null]);
    }
  }

  /**
   * Set multiple items (AsyncStorage.multiSet replacement)
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
  this.ensureReady();

  try {
  // Use a transaction for better performance
  const now = Math.floor(Date.now() / 1000);
  await this.db!.withTransactionAsync(async () => {
  for (const [key, value] of keyValuePairs) {
  await this.db!.runAsync(
  `INSERT INTO kv_storage (key, value, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
     updated_at = excluded.updated_at`,
    [key, value, now]
    );
    }
    });
  } catch (error) {
  console.error('Error in multiSet:', error);
    throw error;
    }
  }

  /**
   * Remove multiple items (AsyncStorage.multiRemove replacement)
   */
  async multiRemove(keys: string[]): Promise<void> {
    this.ensureReady();

    try {
      const placeholders = keys.map(() => '?').join(',');
      await this.db!.runAsync(
        `DELETE FROM kv_storage WHERE key IN (${placeholders})`,
        keys
      );
    } catch (error) {
      console.error('Error in multiRemove:', error);
      throw error;
    }
  }

  /**
   * Get all keys (AsyncStorage.getAllKeys replacement)
   */
  async getAllKeys(): Promise<string[]> {
    this.ensureReady();

    try {
      const results = await this.db!.getAllAsync<{ key: string }>(
        'SELECT key FROM kv_storage ORDER BY key'
      );

      return results.map(r => r.key);
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Clear all storage (AsyncStorage.clear replacement)
   */
  async clear(): Promise<void> {
    this.ensureReady();

    try {
      await this.db!.runAsync('DELETE FROM kv_storage');
      console.log('🗑️ All storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get storage size (useful for debugging)
   */
  async getStorageSize(): Promise<number> {
    this.ensureReady();

    try {
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM kv_storage'
      );

      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting storage size:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const sqliteStorage = new SQLiteStorageAdapter();
