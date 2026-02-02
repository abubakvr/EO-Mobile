import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Sample reports data matching the design
const reports = [
  {
    id: '123-454-YT-1234',
    name: 'Mango Tree',
    coordinates: '3.5423, 43453',
    type: 'normal', // normal, dark, incident
  },
  {
    id: '123-454-YT-1235',
    name: 'Mango Tree',
    coordinates: '3.5423, 43453',
    type: 'dark', // dark green variant
  },
  {
    id: '123-454-YT-1236',
    name: 'Mango Tree',
    coordinates: '3.5423, 43453',
    type: 'normal',
  },
  {
    id: '123-454-YT-1237',
    name: 'Mango Tree',
    coordinates: '3.5423, 43453',
    type: 'normal',
  },
  {
    id: '123-454-YT-1238',
    name: 'Mango Tree',
    coordinates: '3.5423, 43453',
    type: 'normal',
  },
  {
    id: '123-454-YT-1239',
    name: 'Mango Tree',
    coordinates: '3.5423, 43453',
    type: 'incident', // red incident card
  },
];

export default function ReportsScreen() {
  const router = useRouter();

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
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.breadcrumb}>Home/Reports</Text>
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

      {/* Reports List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {reports.map((report, index) => (
          <View key={index} style={[styles.reportCard, getCardStyle(report.type)]}>
            <View style={styles.reportCardContent}>
              <Text style={[styles.reportId, getTextStyle(report.type)]}>{report.id}</Text>
              <Text style={[styles.reportName, getTextStyle(report.type)]}>{report.name}</Text>
              {report.type === 'incident' && (
                <Text style={styles.incidentLabel}>Report Incident</Text>
              )}
              <View style={styles.locationRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color={report.type === 'dark' || report.type === 'incident' ? '#FFFFFF' : '#666'}
                />
                <Text style={[styles.coordinates, getTextStyle(report.type)]}>
                  {report.coordinates}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.viewButton, getViewButtonStyle(report.type)]}
              onPress={() => {
                router.push({
                  pathname: '/details',
                  params: {
                    treeId: report.id,
                    treeName: report.name,
                    specieName: report.name,
                    location: report.coordinates,
                    coordinates: report.coordinates,
                  },
                });
              }}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  breadcrumb: {
    fontSize: 14,
    color: '#666',
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
    paddingBottom: 120,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  normalCard: {
    backgroundColor: '#E8F5ED', // Light green tint
  },
  darkCard: {
    backgroundColor: '#2E8B57', // Dark green
  },
  incidentCard: {
    backgroundColor: '#C62828', // Dark red
  },
  reportCardContent: {
    flex: 1,
    marginRight: 12,
  },
  reportId: {
    fontSize: 14,
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
    fontSize: 16,
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
    fontWeight: '500',
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonDarkGreen: {
    backgroundColor: '#2E8B57', // Dark green button
  },
  viewButtonLightGreen: {
    backgroundColor: '#2E8B57', // Light green button
  },
  viewButtonLightRed: {
    backgroundColor: '#EF5350', // Light red button
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
