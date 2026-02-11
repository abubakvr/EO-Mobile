import { useAuth } from '@/hooks/useAuth';
import { useReport } from '@/hooks/useReports';
import { getReportImageUrl } from '@/utils/reportImageUrl';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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
  const { logout } = useAuth();
  
  // Helper to ensure string values (route params can be arrays)
  const getStringParam = (param: string | string[] | undefined, defaultValue?: string): string => {
    if (Array.isArray(param)) return param[0] || defaultValue || '';
    return param || defaultValue || '';
  };

  const reportId = getStringParam(params.reportId);
  const { data: report, isLoading, error } = useReport(reportId ? parseInt(reportId) : undefined);

  const isGrowthCheck = (report?.report_type?.toLowerCase().includes('growth') ?? false);
  const isIncident = (report?.report_type?.toLowerCase().includes('incident') ?? false);
  const isValidationOrRegistration =
    (report?.report_type?.toLowerCase().includes('validation') ?? false) ||
    (report?.report_type?.toLowerCase().includes('registration') ?? false);

  // Resolve image URLs (API returns relative paths e.g. /media/uploads/Tamarin.JPG)
  const treeImage =
    getReportImageUrl(report?.report_image_urls?.[0]) ||
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800';
  const leafImage =
    getReportImageUrl(report?.leaf_image_url) ?? getReportImageUrl(report?.report_image_urls?.[1]);
  const stemImage =
    getReportImageUrl(report?.stem_image_url) ?? getReportImageUrl(report?.report_image_urls?.[2]);

  // Read growth-stage fields from report top-level or location_metadata
  const meta = report?.location_metadata ?? {};
  const g = (key: string) => (report as any)?.[key] ?? meta[key];
  const soilFertility = g('soil_fertility') ?? g('soil_condition');
  const moistureContent = g('moisture_content');
  const phValue = g('ph_value');
  const temperature = g('temperature');
  const sunlight = g('sunlight');
  const humidity = g('humidity');
  const brokenBranch = g('broken_branch');
  const damagedBark = g('damaged_bark');
  const bentStem = g('bent_stem');
  const rootExposure = g('root_exposure') ?? g('roots_exposure');
  const odor = g('odor');
  const notes = g('additional_comments') ?? report?.accessibility_reason;
  const treeCoords = report?.coordinates;
  const reportCoords = report?.tree?.location?.coordinates ?? report?.coordinates;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => logout()}>
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
          isGrowthCheck ? (
            /* Growth check: exact format from design */
            <>
              {treeImage && (
                <View style={styles.treeImageContainer}>
                  <Image source={{ uri: treeImage }} style={styles.treeImage} resizeMode="cover" />
                </View>
              )}

              <View style={styles.section}>
                {treeCoords && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Coordinates</Text>
                    <Text style={styles.infoValue}>{formatCoordinates(treeCoords)}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tree Name</Text>
                  <Text style={styles.infoValue}>{report.species_name || report.tree?.species_name || '—'}</Text>
                </View>
                {(report.tree?.tree_code ?? report.tree?.id) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tree ID</Text>
                    <Text style={styles.infoValue}>{report.tree?.tree_code ?? String(report.tree?.id)}</Text>
                  </View>
                )}
                {reportCoords && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Coordinates</Text>
                    <Text style={styles.infoValue}>{formatCoordinates(reportCoords)}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Accessibility?</Text>
                  <Text style={styles.infoValue}>{report.is_accessible ? 'Yes' : 'No'}</Text>
                </View>
                {(report.accessibility_reason || notes) && (
                  <View style={styles.reasonRow}>
                    <Text style={styles.infoLabel}>Reason</Text>
                    <Text style={styles.reasonText}>{report.accessibility_reason || notes || '—'}</Text>
                  </View>
                )}
              </View>

              {report.tree?.custodian && (
                <View style={[styles.section, styles.custodianSection]}>
                  <Text style={styles.custodianTitleCentered}>Custodian Information</Text>
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
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Soil Condition</Text>
                <View style={styles.twoColumnGrid}>
                  <View style={styles.twoColumnRow}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Soil fertility</Text>
                      <Text style={styles.infoValue}>{soilFertility ? `${soilFertility} mg/kg` : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>PH Value</Text>
                      <Text style={styles.infoValue}>{phValue ?? '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Sunlight</Text>
                      <Text style={styles.infoValue}>{sunlight ?? '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.twoColumnRow}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Moisture Content</Text>
                      <Text style={styles.infoValue}>{moistureContent ? `${moistureContent}%` : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Temperature</Text>
                      <Text style={styles.infoValue}>{temperature ? `${temperature} °C` : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Humidity</Text>
                      <Text style={styles.infoValue}>{humidity ? `${humidity}%` : '—'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Physical Condition</Text>
                <View style={styles.twoColumnGrid}>
                  <View style={styles.twoColumnRow}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Broken branch</Text>
                      <Text style={styles.infoValue}>{brokenBranch ? (brokenBranch === 'yes' ? 'Yes' : 'No') : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Bent Stem</Text>
                      <Text style={styles.infoValue}>{bentStem ? (bentStem === 'yes' ? 'Yes' : 'No') : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Odor</Text>
                      <Text style={styles.infoValue}>{odor ? (odor === 'yes' ? 'Yes' : 'No') : '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.twoColumnRow}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Damaged Bark</Text>
                      <Text style={styles.infoValue}>{damagedBark ? (damagedBark === 'yes' ? 'Yes' : 'No') : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Exposed Roots</Text>
                      <Text style={styles.infoValue}>{rootExposure ? (rootExposure === 'yes' ? 'Yes' : 'No') : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Humidity</Text>
                      <Text style={styles.infoValue}>{humidity ? `${humidity}%` : '—'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Leaf/Stem Condition</Text>
                <View style={styles.leafStemRow}>
                  <View style={styles.thumbnailBlock}>
                    <Text style={styles.thumbnailLabel}>Leaf Picture</Text>
                    {leafImage ? (
                      <Image source={{ uri: leafImage }} style={styles.thumbnailImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}><Text style={styles.thumbnailPlaceholderText}>No image</Text></View>
                    )}
                  </View>
                  <View style={styles.thumbnailBlock}>
                    <Text style={styles.thumbnailLabel}>Stem Picture</Text>
                    {stemImage ? (
                      <Image source={{ uri: stemImage }} style={styles.thumbnailImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}><Text style={styles.thumbnailPlaceholderText}>No image</Text></View>
                    )}
                  </View>
                </View>
              </View>

              {(notes || report.accessibility_reason) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.reasonText}>{notes || report.accessibility_reason}</Text>
                </View>
              )}
            </>
          ) : isIncident ? (
            /* Incident report: exact format from design */
            <>
              {treeImage && (
                <View style={styles.treeImageContainer}>
                  <Image source={{ uri: treeImage }} style={styles.treeImage} resizeMode="cover" />
                </View>
              )}

              <View style={styles.section}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Specie Name</Text>
                  <Text style={styles.infoValue}>{report.species_name || report.tree?.species_name || '—'}</Text>
                </View>
                {(report.tree?.tree_code ?? report.tree?.id) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tree ID</Text>
                    <Text style={styles.infoValue}>{report.tree?.tree_code ?? String(report.tree?.id)}</Text>
                  </View>
                )}
                {report.coordinates && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{formatCoordinates(report.coordinates)}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Damage/Destroyed</Text>
                  <Text style={styles.infoValue}>{report.damaged_destroyed ?? '—'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Missing Tree</Text>
                  <Text style={styles.infoValue}>{report.missing_tree ?? '—'}</Text>
                </View>
                {(report.others != null && report.others !== '') && (
                  <View style={styles.reasonRow}>
                    <Text style={styles.infoLabel}>Others</Text>
                    <Text style={styles.reasonText}>{report.others}</Text>
                  </View>
                )}
              </View>

              {report.tree?.custodian && (
                <View style={[styles.section, styles.custodianSection]}>
                  <Text style={styles.custodianTitleCentered}>Custodian Information</Text>
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
                </View>
              )}
            </>
          ) : isValidationOrRegistration ? (
            /* Validation / Registration: tree image, Tree ID, Specie Name, Location, Accessibility?, Reason, Date, Custodian */
            <>
              {treeImage && (
                <View style={styles.treeImageContainer}>
                  <Image source={{ uri: treeImage }} style={styles.treeImage} resizeMode="cover" />
                </View>
              )}

              <View style={styles.section}>
                {(report.tree?.tree_code ?? report.tree?.id) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tree ID</Text>
                    <Text style={[styles.infoValue, styles.infoValueEmphasis]}>
                      {report.tree?.tree_code ?? String(report.tree?.id)}
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Specie Name</Text>
                  <Text style={[styles.infoValue, styles.infoValueEmphasis]}>
                    {report.species_name || report.tree?.species_name || '—'}
                  </Text>
                </View>
                {report.coordinates && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{formatCoordinates(report.coordinates)}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Accessibility?</Text>
                  <Text style={styles.infoValue}>{report.is_accessible ? 'Yes' : 'No'}</Text>
                </View>
                {(report.accessibility_reason != null && report.accessibility_reason !== '') && (
                  <View style={styles.reasonRow}>
                    <Text style={styles.infoLabel}>Reason</Text>
                    <Text style={styles.reasonText}>{report.accessibility_reason}</Text>
                  </View>
                )}
                {(report.created_at || report.updated_at) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(report.created_at || report.updated_at)}
                    </Text>
                  </View>
                )}
              </View>

              {report.tree?.custodian && (
                <View style={[styles.section, styles.custodianSection]}>
                  <Text style={styles.custodianTitleCentered}>Custodian Information</Text>
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
                </View>
              )}
            </>
          ) : (
            /* Default: all other report types */
            <>
              {treeImage && (
                <View style={styles.treeImageContainer}>
                  <Image source={{ uri: treeImage }} style={styles.treeImage} resizeMode="cover" />
                </View>
              )}

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
          )
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
  infoValueEmphasis: {
    fontSize: 16,
    fontWeight: '700',
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
  custodianTitleCentered: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  twoColumnRow: {
    flex: 1,
  },
  leafStemRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  thumbnailBlock: {
    flex: 1,
  },
  thumbnailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  thumbnailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  thumbnailPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 12,
    color: '#666',
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

