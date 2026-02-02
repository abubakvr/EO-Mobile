import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { LeafletView } from 'react-native-leaflet-view';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const DEFAULT_MAP_LOCATION = {
  latitude: 1.343434,
  longitude: 6.678545,
};

export default function ValidateTreeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [webViewContent, setWebViewContent] = useState<string | null>(null);
  
  // Get selected specie from route params or use default
  const getInitialSpecie = (): string => {
    if (params.selectedSpecie) {
      if (typeof params.selectedSpecie === 'string') {
        return params.selectedSpecie;
      }
      if (Array.isArray(params.selectedSpecie)) {
        return params.selectedSpecie[0];
      }
    }
    return 'Mango';
  };
  
  const [selectedSpecies, setSelectedSpecies] = useState(getInitialSpecie());
  const [accessibility, setAccessibility] = useState<'yes' | 'no'>('yes');
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [custodianName, setCustodianName] = useState('');
  const [custodianPhone, setCustodianPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_MAP_LOCATION);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [treeImage, setTreeImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHtml = async () => {
      try {
        const path = require('../assets/leaflet.html');
        const asset = Asset.fromModule(path);
        await asset.downloadAsync();

        if (!asset.localUri) {
          throw new Error('Asset localUri is null');
        }

        const file = new File(asset.localUri);
        const htmlContent = await file.text();

        if (isMounted) {
          setWebViewContent(htmlContent);
        }
      } catch (error) {
        console.error('Error loading HTML:', error);
      }
    };

    loadHtml();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selected species when params change
  useEffect(() => {
    if (params.selectedSpecie) {
      const specie = typeof params.selectedSpecie === 'string' 
        ? params.selectedSpecie 
        : Array.isArray(params.selectedSpecie) 
        ? params.selectedSpecie[0] 
        : null;
      if (specie) {
        setSelectedSpecies(specie);
      }
    }
  }, [params.selectedSpecie]);

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to validate the actual location.',
        );
        setIsGettingLocation(false);
        return;
      }

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings.',
        );
        setIsGettingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(newLocation);
      setIsGettingLocation(false);

      Alert.alert('Success', 'Location updated successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
      setIsGettingLocation(false);
    }
  };

  const captureTreePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture tree photos.',
        );
        return;
      }

      // Launch camera (camera only, no gallery)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTreeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule/Validate</Text>
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
        {/* Tree ID Section */}
        <View style={styles.treeIdSection}>
          <Text style={styles.treeIdText}>TreeID/325345</Text>
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          {!webViewContent ? (
            <View style={[styles.map, styles.loadingContainer]}>
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          ) : (
            <View style={styles.map}>
              <LeafletView
                source={{ html: webViewContent }}
                mapCenterPosition={{
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude,
                }}
                zoom={15}
                mapMarkers={[
                  {
                    id: '1',
                    position: {
                      lat: currentLocation.latitude,
                      lng: currentLocation.longitude,
                    },
                    icon: '📍',
                    size: [40, 40],
                  },
                ]}
                zoomControl={true}
                attributionControl={true}
                style={{ flex: 1, width: '100%', height: '100%' }}
                doDebug={false}
                key={`${currentLocation.latitude}-${currentLocation.longitude}`}
              />
            </View>
          )}
        </View>

        {/* Validate Location Button and Coordinates */}
        <View style={styles.locationSection}>
          <TouchableOpacity
            style={[styles.validateLocationButton, isGettingLocation && styles.buttonDisabled]}
            onPress={getCurrentLocation}
            disabled={isGettingLocation}>
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.validateLocationText}>Validate Actual Location</Text>
            )}
          </TouchableOpacity>
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesLabel}>Cordinates</Text>
            <Text style={styles.coordinatesValue}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {/* Custodian Input Fields */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.inputField}
            placeholder="Add Custodian name."
            placeholderTextColor="#999"
            value={custodianName}
            onChangeText={setCustodianName}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Add Custodian Phone number."
            placeholderTextColor="#999"
            value={custodianPhone}
            onChangeText={setCustodianPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Tree Species Selection */}
        <View style={styles.formSection}>
          <View style={styles.formHeader}>
            <Text style={styles.formLabel}>Tree Species</Text>
            <TouchableOpacity
              style={styles.viewSpecieButton}
              onPress={() => router.push('/treelist')}>
              <Text style={styles.viewSpecieText}>View Specie</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSpeciesDropdown(!showSpeciesDropdown)}>
            <Text style={styles.dropdownText}>{selectedSpecies}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Accessibility */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Accessibility</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setAccessibility('yes')}>
              <View style={styles.radioButton}>
                {accessibility === 'yes' && <View style={styles.radioButtonSelected} />}
              </View>
              <Text style={styles.radioLabel}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setAccessibility('no')}>
              <View style={styles.radioButton}>
                {accessibility === 'no' && <View style={styles.radioButtonSelected} />}
              </View>
              <Text style={styles.radioLabel}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Initial Picture */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Initial Picture</Text>
          <View style={styles.pictureContainer}>
            {treeImage ? (
              <>
                <Image source={{ uri: treeImage }} style={styles.capturedImage} />
                <TouchableOpacity
                  style={[styles.captureButton, styles.retakeButton]}
                  onPress={captureTreePhoto}>
                  <Text style={styles.captureButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.picturePlaceholder}>Capture Tree Photo</Text>
                <TouchableOpacity style={styles.captureButton} onPress={captureTreePhoto}>
                  <Text style={styles.captureButtonText}>Capture</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Submit Task Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit Task</Text>
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
  treeIdSection: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  treeIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: '100%',
    height: 280,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  validateLocationButton: {
    backgroundColor: '#4A4A4A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  validateLocationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  coordinatesContainer: {
    flex: 1,
  },
  coordinatesLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinatesValue: {
    fontSize: 14,
    color: '#666',
  },
  inputSection: {
    marginBottom: 20,
    gap: 12,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formSection: {
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  viewSpecieButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewSpecieText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2E8B57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E8B57',
  },
  radioLabel: {
    fontSize: 14,
    color: '#000',
  },
  pictureContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  picturePlaceholder: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  captureButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retakeButton: {
    marginTop: 12,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
