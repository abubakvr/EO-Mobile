import { useReport } from '@/hooks/useReports';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper to format coordinates
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

// Helper to format date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export default function TreeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Helper to ensure string values (route params can be arrays)
  const getStringParam = (param: string | string[] | undefined, defaultValue?: string): string => {
    if (Array.isArray(param)) return param[0] || defaultValue || '';
    return param || defaultValue || '';
  };

  const reportId = getStringParam(params.reportId);
  const { data: report, isLoading, error } = useReport(reportId ? parseInt(reportId) : undefined);

  // Get first image from report_image_urls or use default
  const treeImage = report?.report_image_urls?.[0] || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home/Reports/Details</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Loading report...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>Failed to load report</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : report ? (
          <>
            {/* Tree Image */}
            {treeImage && (
              <View style={styles.treeImageContainer}>
                <Image
                  source={{ uri: treeImage }}
                  style={styles.treeImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Report Information Section */}
            <View style={styles.section}>
              {report.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Report ID</Text>
                  <Text style={styles.infoValue}>#{report.id}</Text>
                </View>
              )}
              {report.report_type && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Report Type</Text>
                  <Text style={styles.infoValue}>{report.report_type}</Text>
                </View>
              )}
              {report.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>{report.status}</Text>
                </View>
              )}
              {(report.species_name || report.tree?.species_name) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Species Name</Text>
                  <Text style={styles.infoValue}>{report.species_name || report.tree?.species_name}</Text>
                </View>
              )}
              {report.tree?.tree_code && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tree Code</Text>
                  <Text style={styles.infoValue}>{report.tree.tree_code}</Text>
                </View>
              )}
              {report.ward_name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ward</Text>
                  <Text style={styles.infoValue}>{report.ward_name}</Text>
                </View>
              )}
              {report.coordinates && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{formatCoordinates(report.coordinates)}</Text>
                </View>
              )}
              {report.location_accuracy && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location Accuracy</Text>
                  <Text style={styles.infoValue}>{report.location_accuracy.toFixed(2)}m</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Accessibility</Text>
                <Text style={styles.infoValue}>{report.is_accessible ? 'Yes' : 'No'}</Text>
              </View>
              {report.accessibility_reason && (
                <View style={styles.reasonRow}>
                  <Text style={styles.infoLabel}>Accessibility Reason</Text>
                  <Text style={styles.reasonText}>{report.accessibility_reason}</Text>
                </View>
              )}
              {report.damaged_destroyed && (
                <View style={styles.reasonRow}>
                  <Text style={styles.infoLabel}>Damaged/Destroyed</Text>
                  <Text style={styles.reasonText}>{report.damaged_destroyed}</Text>
                </View>
              )}
              {report.missing_tree && (
                <View style={styles.reasonRow}>
                  <Text style={styles.infoLabel}>Missing Tree</Text>
                  <Text style={styles.reasonText}>{report.missing_tree}</Text>
                </View>
              )}
              {report.others && (
                <View style={styles.reasonRow}>
                  <Text style={styles.infoLabel}>Other Information</Text>
                  <Text style={styles.reasonText}>{report.others}</Text>
                </View>
              )}
              {report.created_at && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created At</Text>
                  <Text style={styles.infoValue}>{formatDate(report.created_at)}</Text>
                </View>
              )}
            </View>

            {/* Tree Information Section */}
            {report.tree && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tree Information</Text>
                {report.tree.id && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tree ID</Text>
                    <Text style={styles.infoValue}>{report.tree.id}</Text>
                  </View>
                )}
                {report.tree.tree_code && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tree Code</Text>
                    <Text style={styles.infoValue}>{report.tree.tree_code}</Text>
                  </View>
                )}
                {report.tree.species_name && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Species</Text>
                    <Text style={styles.infoValue}>{report.tree.species_name}</Text>
                  </View>
                )}
                {report.tree.growth_stage && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Growth Stage</Text>
                    <Text style={styles.infoValue}>{report.tree.growth_stage}</Text>
                  </View>
                )}
                {report.tree.health_status && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Health Status</Text>
                    <Text style={styles.infoValue}>{report.tree.health_status}</Text>
                  </View>
                )}
                {report.tree.land_type && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Land Type</Text>
                    <Text style={styles.infoValue}>{report.tree.land_type}</Text>
                  </View>
                )}
                {report.tree.date_planted && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date Planted</Text>
                    <Text style={styles.infoValue}>{formatDate(report.tree.date_planted)}</Text>
                  </View>
                )}
                {report.tree.last_inspected_at && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Inspected</Text>
                    <Text style={styles.infoValue}>{formatDate(report.tree.last_inspected_at)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Custodian Information Section */}
            {report.tree?.custodian && (
              <View style={[styles.section, styles.custodianSection]}>
                <Text style={styles.custodianTitle}>Custodian Information</Text>
                {report.tree.custodian.full_name && (
                  <View style={styles.custodianRow}>
                    <Ionicons name="person" size={20} color="#000" />
                    <Text style={styles.custodianText}>{report.tree.custodian.full_name}</Text>
                  </View>
                )}
                {report.tree.custodian.phone && (
                  <View style={styles.custodianRow}>
                    <Ionicons name="call" size={20} color="#000" />
                    <Text style={styles.custodianText}>{report.tree.custodian.phone}</Text>
                  </View>
                )}
                {report.tree.custodian.email && (
                  <View style={styles.custodianRow}>
                    <Ionicons name="mail" size={20} color="#000" />
                    <Text style={styles.custodianText}>{report.tree.custodian.email}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : null}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  signOutText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  treeImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  treeImage: {
    width: '100%',
    height: 300,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  reasonRow: {
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
    lineHeight: 20,
  },
  custodianSection: {
    backgroundColor: '#E8E8E8',
  },
  custodianTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  custodianRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  custodianText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

