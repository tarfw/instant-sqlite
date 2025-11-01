// app/index.tsx
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getDB } from './_layout';
import { AppSchema } from '@/instant.schema';
import { InstaQLEntity, id } from '@instantdb/react-native';

type InventoryItem = InstaQLEntity<AppSchema, 'inventory'>;

export default function HomeScreen() {
  const db = getDB(); // Get our SQLite-powered InstantDB

  const [newItemName, setNewItemName] = useState('');

  // Query data from InstantDB (using SQLite storage)
  const { data, isLoading, error } = db.useQuery({
    inventory: {}, // Replace with your actual collection name
  });

  const items = data?.inventory || [];

  // Add new item
  const addItem = async () => {
    if (!newItemName.trim()) return;

    try {
      // Generate a unique ID
      const itemId = id();

      // Add to InstantDB (saves to SQLite)
      await db.transact([
        db.tx.inventory[itemId].update({
          name: newItemName,
          quantity: 0,
          createdAt: Date.now(),
        }),
      ]);

      setNewItemName('');
      console.log('✅ Item added to SQLite');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading from SQLite...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error loading data: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory ({items.length} items)</Text>
      <Text style={styles.subtitle}>📦 Powered by SQLite Storage</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter item name..."
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <Button title="Add" onPress={addItem} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items yet. Add one above!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
