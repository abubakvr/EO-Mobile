import { getHumanReadableError, getSyncErrorMessage } from '@/utils/errorHandler';
import { submissionQueue, QueuedSubmission } from '@/services/submissionQueue';
import { syncQueuedSubmissions } from '@/services/submissionSync';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OfflineReportsScreen() {
  const router = useRouter();
  const [queuedSubmissions, setQueuedSubmissions] = useState<QueuedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueuedSubmissions = async () => {
    try {
      const queue = await submissionQueue.getQueue();
      setQueuedSubmissions(queue);
    } catch (error: any) {
      const errorMessage = getHumanReadableError(error);
      console.error('[OfflineReports] Error loading queue:', errorMessage);
      Alert.alert('Error', `Failed to load offline reports. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueuedSubmissions();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadQueuedSubmissions();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadQueuedSubmissions();
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const result = await syncQueuedSubmissions();
      
      if (result.success > 0 || result.failed === 0) {
        const message = result.failed > 0 && result.errors
          ? `Successfully synced ${result.success} submission(s). ${result.failed} failed: ${result.errors[0]}`
          : `Successfully synced ${result.success} submission(s).`;
        Alert.alert('Sync Complete', message);
      } else {
        const errorDetails = result.errors && result.errors.length > 0
          ? ` ${result.errors[0]}`
          : ' Please check your connection and try again.';
        Alert.alert(
          'Sync Failed',
          `Failed to sync ${result.failed} submission(s).${errorDetails}`
        );
      }
      
      // Reload queue after sync
      await loadQueuedSubmissions();
    } catch (error: any) {
      const errorMessage = getSyncErrorMessage(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    Alert.alert(
      'Delete Submission',
      'Are you sure you want to delete this submission? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await submissionQueue.removeFromQueue(submissionId);
              await loadQueuedSubmissions();
            } catch (error: any) {
              const errorMessage = getHumanReadableError(error);
              Alert.alert('Error', `Failed to delete submission. ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  const getSubmissionTypeLabel = (type: string) => {
    switch (type) {
      case 'register':
        return 'Register Tree';
      case 'validate':
        return 'Validate Tree';
      case 'growth_check':
        return 'Growth Check';
      case 'incident':
        return 'Incident Report';
      default:
        return type;
    }
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'register':
        return 'add-circle-outline';
      case 'validate':
        return 'checkmark-circle-outline';
      case 'growth_check':
        return 'leaf-outline';
      case 'incident':
        return 'warning-outline';
      default:
        return 'document-outline';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offline Reports</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading offline reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Reports</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Sync All Button */}
      {queuedSubmissions.length > 0 && (
        <View style={styles.syncContainer}>
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={handleSyncAll}
            disabled={isSyncing}>
            {isSyncing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.syncSpinner} />
                <Text style={styles.syncButtonText}>Syncing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>Sync All ({queuedSubmissions.length})</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Submissions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
        {queuedSubmissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Offline Reports</Text>
            <Text style={styles.emptyText}>
              All submissions have been synced. When you submit forms offline, they will appear here.
            </Text>
          </View>
        ) : (
          queuedSubmissions.map((submission) => (
            <View key={submission.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons
                    name={getSubmissionTypeIcon(submission.type) as any}
                    size={24}
                    color="#2E8B57"
                  />
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>{getSubmissionTypeLabel(submission.type)}</Text>
                    <Text style={styles.cardSubtitle}>{formatDate(submission.timestamp)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(submission.id)}
                  style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Endpoint:</Text>
                  <Text style={styles.infoValue}>{submission.endpoint}</Text>
                </View>
                {submission.retryCount > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Retry Count:</Text>
                    <Text style={[styles.infoValue, styles.retryCount]}>
                      {submission.retryCount} / 5
                    </Text>
                  </View>
                )}
                {submission.retryCount >= 5 && (
                  <View style={styles.errorBadge}>
                    <Ionicons name="warning-outline" size={16} color="#F44336" />
                    <Text style={styles.errorText}>Max retries reached</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  syncContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncSpinner: {
    marginRight: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#000',
    flex: 1,
  },
  retryCount: {
    color: '#F44336',
    fontWeight: '600',
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
});
