import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useReports } from '@/hooks/useReports';
import type { Report } from '@/types/report';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_PAGE_SIZE = 10;

export default function ReportsScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { isOnline } = useNetworkStatus();
  const { data, isLoading, error, refetch, isRefetching } = useReports({
    page: currentPage,
    page_size: DEFAULT_PAGE_SIZE,
  });

  // Scroll to top when page changes
  useEffect(() => {
    if (scrollViewRef.current && !isLoading) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentPage, isLoading]);

  // Calculate page count from total and page_size if page_count is not provided
  const pageCount = data?.page_count || (data?.total && data?.page_size 
    ? Math.ceil(data.total / data.page_size) 
    : 1);
  const totalReports = data?.total || 0;
  const currentPageNum = data?.page || currentPage;

  // Map report_type to card type
  const getCardType = (reportType: string, status: string): 'normal' | 'dark' | 'incident' => {
    const lowerType = reportType.toLowerCase();
    const lowerStatus = status.toLowerCase();
    
    // Check for incident indicators
    if (lowerType.includes('incident') || 
        lowerStatus.includes('incident') || 
        lowerStatus.includes('urgent') ||
        lowerStatus.includes('critical')) {
      return 'incident';
    }
    
    // Check for dark variant (could be based on status or type)
    if (lowerStatus.includes('completed') || lowerStatus.includes('resolved')) {
      return 'dark';
    }
    
    return 'normal';
  };

  // Format coordinates for display
  const formatCoordinates = (coords: { latitude: number; longitude: number } | [number, number] | undefined): string => {
    if (!coords) return '';
    // Handle array format [latitude, longitude]
    if (Array.isArray(coords) && coords.length >= 2) {
      return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
    }
    // Handle object format {latitude, longitude}
    if (typeof coords === 'object' && 'latitude' in coords && 'longitude' in coords) {
      return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
    }
    return '';
  };

  const reports = data?.data || [];

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'dark':
        return styles.darkCard;
      case 'incident':
        return styles.incidentCard;
      default:
        return styles.normalCard;
    }
  };

  const getTextStyle = (type: string) => {
    switch (type) {
      case 'dark':
      case 'incident':
        return styles.whiteText;
      default:
        return styles.darkText;
    }
  };

  const getViewButtonStyle = (type: string) => {
    switch (type) {
      case 'dark':
        return styles.viewButtonLightGreen;
      case 'incident':
        return styles.viewButtonLightRed;
      default:
        return styles.viewButtonDarkGreen;
    }
  };

  const getViewButtonTextStyle = (type: string) => {
    switch (type) {
      case 'dark':
      case 'normal':
        return styles.viewButtonTextWhite; // Green buttons get white text
      case 'incident':
        return styles.viewButtonTextGray; // Red button gets gray text
      default:
        return styles.viewButtonTextWhite;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.breadcrumb}>Home/Reports</Text>
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

      {/* Reports List */}
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
              setCurrentPage(1);
            }}
          />
        }>
        {isLoading && reports.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>Failed to load reports</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : reports.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No reports available</Text>
          </View>
        ) : (
          <>
            {isLoading && reports.length > 0 && (
              <View style={styles.pageLoadingOverlay}>
                <ActivityIndicator size="small" color="#2E8B57" />
                <Text style={styles.pageLoadingText}>Loading page...</Text>
              </View>
            )}
            {reports.map((report: Report) => {
              const cardType = getCardType(report.report_type, report.status);
              const coordinates = formatCoordinates(report.coordinates);
              const speciesName = report.species_name || report.tree?.species_name;
              const reportId = report.id ? `${report.id} -` : '';
              
              return (
                <View key={report.id} style={[styles.reportCard, getCardStyle(cardType)]}>
                  <View style={styles.reportCardContent}>
                    <View style={styles.reportCardTitle}>
                      {reportId && (
                        <Text style={[styles.reportId, getTextStyle(cardType)]}>
                          {reportId}
                        </Text>
                      )}
                      {speciesName && (
                        <Text style={[styles.reportName, getTextStyle(cardType)]}>
                          {speciesName}
                        </Text>
                      )}
                    </View>
                    {cardType === 'incident' && (
                      <Text style={styles.incidentLabel}>Incident Report</Text>
                    )}
                    {coordinates && coordinates !== 'N/A' && (
                      <View style={styles.locationRow}>
                        <Ionicons
                          name="location"
                          size={16}
                          color={cardType === 'dark' || cardType === 'incident' ? '#FFFFFF' : '#666'}
                        />
                        <Text style={[styles.coordinates, getTextStyle(cardType)]}>
                          {coordinates}
                        </Text>
                      </View>
                    )}
                    {report.ward_name && (
                      <Text style={[styles.wardName, getTextStyle(cardType)]}>
                        {report.ward_name}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.viewButton, getViewButtonStyle(cardType)]}
                    onPress={() => {
                      router.push({
                        pathname: '/details',
                        params: {
                          treeId: report.tree?.id?.toString() || report.id.toString(),
                          treeName: speciesName || 'Unknown',
                          specieName: speciesName || 'Unknown',
                          location: coordinates,
                          coordinates: coordinates,
                          reportId: report.id.toString(),
                        },
                      });
                    }}>
                    <Text style={[styles.viewButtonText, getViewButtonTextStyle(cardType)]}>View</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Pagination Controls */}
        {!error && (reports.length > 0 || totalReports > 0) && (
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
                    {totalReports} total {totalReports === 1 ? 'report' : 'reports'}
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
    fontWeight: 'bold',
    color: '#000',
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
    paddingBottom: 120,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reportCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  normalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E7D0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  darkCard: {
    backgroundColor: '#2E8B57', // Dark green
  },
  incidentCard: {
    backgroundColor: '#AA1F21', // Dark red
  },
  reportCardContent: {
    flex: 1,
    marginRight: 12,
  },
  reportId: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  darkText: {
    color: '#333333',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  reportName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  incidentLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  coordinates: {
    fontSize: 14,
    fontWeight: '400',
    color: '#36454F',
    opacity: 0.8,
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonDarkGreen: {
    backgroundColor: '#2E8B57', // Dark green button
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewButtonTextWhite: {
    color: '#FFFFFF', // White text for green buttons
  },
  viewButtonTextGray: {
    color: '#7D7D7D', // Gray text for red button
  },
  viewButtonLightGreen: {
    backgroundColor: '#2E8B57', // Light green button
  },
  viewButtonLightRed: {
    backgroundColor: '#FFFFFF', // Light red button (white background)
  },
  wardName: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
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
});
