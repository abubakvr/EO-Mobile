import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
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

// Default data - will be overridden by route params if provided
const defaultTreeData = {
  treeImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  treeId: '123-454-TY-1234',
  specieName: 'Coconut Tree',
  location: '3.5423, 43453',
  accessibility: 'No',
  reason: 'An active forest fire creates an extremely dangerous and non-permissible zone of inaccessibility.',
  custodianName: 'Mallam Abubakar Uni',
  custodianPhone: '+234 913 123 1242',
};

export default function TreeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Use route params if available, otherwise use default data
  // Helper to ensure string values (route params can be arrays)
  const getStringParam = (param: string | string[] | undefined, defaultValue: string): string => {
    if (Array.isArray(param)) return param[0] || defaultValue;
    return param || defaultValue;
  };

  const treeData = {
    treeImage: getStringParam(params.treeImage, defaultTreeData.treeImage),
    treeId: getStringParam(params.treeId, defaultTreeData.treeId),
    specieName: getStringParam(params.specieName || params.treeName, defaultTreeData.specieName),
    location: getStringParam(params.location || params.coordinates, defaultTreeData.location),
    accessibility: getStringParam(params.accessibility, defaultTreeData.accessibility),
    reason: getStringParam(params.reason, defaultTreeData.reason),
    custodianName: getStringParam(params.custodianName, defaultTreeData.custodianName),
    custodianPhone: getStringParam(params.custodianPhone, defaultTreeData.custodianPhone),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular" size={18} color="#000" />
          <Ionicons name="wifi" size={18} color="#000" style={styles.statusIcon} />
          <Ionicons name="battery-full" size={18} color="#000" style={styles.statusIcon} />
        </View>
      </View>

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
        {/* Tree Image */}
        <View style={styles.treeImageContainer}>
          <Image
            source={{ uri: treeData.treeImage }}
            style={styles.treeImage}
            resizeMode="cover"
          />
        </View>

        {/* Tree Information Section */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tree ID</Text>
            <Text style={styles.infoValue}>{treeData.treeId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Specie Name</Text>
            <Text style={styles.infoValue}>{treeData.specieName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{treeData.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Accessibility?</Text>
            <Text style={styles.infoValue}>{treeData.accessibility}</Text>
          </View>
          <View style={styles.reasonRow}>
            <Text style={styles.infoLabel}>Reason</Text>
            <Text style={styles.reasonText}>{treeData.reason}</Text>
          </View>
        </View>

        {/* Custodian Information Section */}
        <View style={[styles.section, styles.custodianSection]}>
          <Text style={styles.custodianTitle}>Custodian Information</Text>
          <View style={styles.custodianRow}>
            <Ionicons name="person" size={20} color="#000" />
            <Text style={styles.custodianText}>{treeData.custodianName}</Text>
          </View>
          <View style={styles.custodianRow}>
            <Ionicons name="call" size={20} color="#000" />
            <Text style={styles.custodianText}>{treeData.custodianPhone}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  statusTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 6,
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
});

