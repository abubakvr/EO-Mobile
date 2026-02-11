import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/task';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_PAGE_SIZE = 10;

export default function ScheduleScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { isOnline } = useNetworkStatus();
  const { data, isLoading, error, refetch, isRefetching } = useTasks({
    page: currentPage,
    page_size: DEFAULT_PAGE_SIZE,
  });

  // Scroll to top when page changes
  useEffect(() => {
    if (scrollViewRef.current && !isLoading) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentPage, isLoading]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                     day === 2 || day === 22 ? 'nd' : 
                     day === 3 || day === 23 ? 'rd' : 'th';
      return `${day}${suffix} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  // Map task_type to actionType
  const getActionType = (taskType: string): 'validate' | 'growthCheck' => {
    const lowerType = taskType.toLowerCase();
    if (lowerType.includes('growth') || lowerType.includes('check')) {
      return 'growthCheck';
    }
    return 'validate';
  };

  const tasks = data?.data || [];
  
  // Calculate page count from total and page_size if page_count is not provided
  const pageCount = data?.page_count || (data?.total && data?.page_size 
    ? Math.ceil(data.total / data.page_size) 
    : 1);
  const totalTasks = data?.total || 0;
  const currentPageNum = data?.page || currentPage;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Task List</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          {/* Network Status Indicator */}
          <View style={[styles.networkIndicator, isOnline ? styles.networkIndicatorOnline : styles.networkIndicatorOffline]} />
          <TouchableOpacity>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Cards */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              // Reset to first page on refresh
              setCurrentPage(1);
            }}
          />
        }>
        {isLoading && tasks.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>Failed to load tasks</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tasks.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No tasks available</Text>
          </View>
        ) : (
          <>
            {isLoading && tasks.length > 0 && (
              <View style={styles.pageLoadingOverlay}>
                <ActivityIndicator size="small" color="#2E8B57" />
                <Text style={styles.pageLoadingText}>Loading page...</Text>
              </View>
            )}
            {tasks.map((task: Task) => {
              const actionType = getActionType(task.task_type);
              const custodian = task.tree?.custodian;
              
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskCardContent}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskId}>{task.task_id}</Text>
                      <Text style={styles.taskName}>{task.tree?.species_name || 'Unknown Tree'}</Text>
                    </View>
                    
                    <Text style={styles.dueDate}>Due Date: {formatDate(task.due_date)}</Text>
                    
                    {custodian && (
                      <View style={styles.taskInfo}>
                        <View style={styles.infoRow}>
                          <Ionicons name="person-outline" size={16} color="#666" />
                          <Text style={styles.infoText}>{custodian.full_name}</Text>
                        </View>
                        {custodian.phone && (
                          <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>{custodian.phone}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      actionType === 'validate' ? styles.validateButton : styles.growthCheckButton,
                    ]}
                    onPress={() => {
                      if (actionType === 'validate') {
                        router.push({
                          pathname: '/validate',
                          params: {
                            taskId: task.id.toString(),
                            treeId: task.tree_id.toString(),
                            treeCode: task.tree?.tree_code || '',
                            speciesName: task.tree?.species_name || '',
                            speciesId: task.tree?.species_id?.toString() || '',
                            custodianName: task.tree?.custodian?.full_name || '',
                            custodianPhone: task.tree?.custodian?.phone || '',
                            custodianId: task.tree?.custodian_id?.toString() || '',
                          },
                        });
                      } else {
                        router.push({
                          pathname: '/growthcheck',
                          params: {
                            taskId: task.id.toString(),
                            treeId: task.tree_id.toString(),
                            treeCode: task.tree?.tree_code || '',
                            speciesName: task.tree?.species_name || '',
                            speciesId: task.tree?.species_id?.toString() || '',
                            custodianName: task.tree?.custodian?.full_name || '',
                            custodianPhone: task.tree?.custodian?.phone || '',
                            custodianId: task.tree?.custodian_id?.toString() || '',
                          },
                        });
                      }
                    }}>
                    <Text
                      style={[
                        styles.actionButtonText,
                        actionType === 'validate'
                          ? styles.validateButtonText
                          : styles.growthCheckButtonText,
                      ]}>
                      {actionType === 'validate' ? 'Validate' : 'Growth Check'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Pagination Controls */}
        {!error && (tasks.length > 0 || totalTasks > 0) && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                (currentPageNum === 1 || isLoading) && styles.paginationButtonDisabled,
              ]}
              onPress={() => {
                if (currentPageNum > 1 && !isLoading) {
                  setCurrentPage(currentPageNum - 1);
                }
              }}
              disabled={currentPageNum === 1 || isLoading}>
              {isLoading && currentPageNum > 1 ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <>
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={currentPageNum === 1 ? '#999' : '#2E8B57'}
                  />
                  <Text
                    style={[
                      styles.paginationButtonText,
                      currentPageNum === 1 && styles.paginationButtonTextDisabled,
                    ]}>
                    Previous
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#2E8B57" />
                  <Text style={styles.paginationSubtext}>Loading...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.paginationText}>
                    Page {currentPageNum} of {pageCount}
                  </Text>
                  <Text style={styles.paginationSubtext}>
                    {totalTasks} total {totalTasks === 1 ? 'task' : 'tasks'}
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                (currentPageNum >= pageCount || isLoading) && styles.paginationButtonDisabled,
              ]}
              onPress={() => {
                if (currentPageNum < pageCount && !isLoading) {
                  setCurrentPage(currentPageNum + 1);
                }
              }}
              disabled={currentPageNum >= pageCount || isLoading}>
              {isLoading && currentPageNum < pageCount ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <>
                  <Text
                    style={[
                      styles.paginationButtonText,
                      currentPageNum >= pageCount && styles.paginationButtonTextDisabled,
                    ]}>
                    Next
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={currentPageNum >= pageCount ? '#999' : '#2E8B57'}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginTop: 16,
    backgroundColor: '#F5F5F5',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  breadcrumb: {
    fontSize: 10,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  iconButton: {
    padding: 4,
  },
  signOutText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  networkIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  networkIndicatorOnline: {
    backgroundColor: '#2E8B57',
  },
  networkIndicatorOffline: {
    backgroundColor: '#F44336',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for bottom navigation
  },
  taskCard: {
    backgroundColor: '#FFFFFF', // Light green-grey
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#D0E7D0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardContent: {
    flex: 1,
    marginRight: 12,
  },
  taskHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  taskName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  taskInfo: {
    marginTop: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 10,
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButton: {
    backgroundColor: '#2E8B57',
  },
  growthCheckButton: {
    backgroundColor: '#D48D47',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  validateButtonText: {
    color: '#FFFFFF',
  },
  growthCheckButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
  },
  paginationButtonTextDisabled: {
    color: '#999',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  paginationSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pageLoadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  pageLoadingText: {
    fontSize: 14,
    color: '#666',
  },
});
