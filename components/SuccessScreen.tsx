import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SuccessScreenProps {
  taskName: string;
  message?: string;
  onDone?: () => void;
}

export default function SuccessScreen({ taskName, message, onDone }: SuccessScreenProps) {
  const router = useRouter();

  const handleDone = () => {
    if (onDone) {
      onDone();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#2E8B57" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{taskName}</Text>

        {/* Message */}
        <Text style={styles.message}>
          {message || 'Has Successfully been sent!'}
        </Text>

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#202221',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: '400',
    color: '#202221',
    textAlign: 'center',
    marginBottom: 48,
  },
  doneButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
