import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Text style={styles.title}>Welcome to HackCoach</Text>
      <Text style={styles.subtitle}>Your React Native app is running!</Text>
      
      <View style={styles.counterContainer}>
        <Text style={styles.count}>{count}</Text>
        <View style={styles.buttonRow}>
          <Pressable 
            style={styles.button} 
            onPress={() => setCount(c => c - 1)}
          >
            <Text style={styles.buttonText}>-</Text>
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={() => setCount(c => c + 1)}
          >
            <Text style={styles.buttonText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  counterContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  count: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
