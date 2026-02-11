import SuccessScreen from '@/components/SuccessScreen';
import { reportService } from '@/services/reportService';
import { SubmissionData, submitWithOfflineSupport } from '@/services/submitWithOfflineSupport';
import { modifyLeafletHtmlForOffline } from '@/utils/mapHtmlModifier';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_MAP_LOCATION = {
  latitude: 1.343434,
  longitude: 6.678545,
};

export default function RegisterTreeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [webViewContent, setWebViewContent] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState('Mango');
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_MAP_LOCATION);
  const [locationAccuracy, setLocationAccuracy] = useState<string>('');
  const [locationObject, setLocationObject] = useState<Location.LocationObject | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [treeImage, setTreeImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [accessibility, setAccessibility] = useState<'yes' | 'no'>('yes');
  const [accessibilityReason, setAccessibilityReason] = useState('');
  const [custodianName, setCustodianName] = useState('');
  const [custodianPhone, setCustodianPhone] = useState('');
  const [speciesId, setSpeciesId] = useState('');

  // Helper to get string param value
  const getStringParam = (param: string | string[] | undefined, defaultValue: string = ''): string => {
    if (Array.isArray(param)) return param[0] || defaultValue;
    return param || defaultValue;
  };

  // Update species and custodian data when params change (from treelist navigation)
  useEffect(() => {
    const selectedSpecie = getStringParam(params.selectedSpecie);
    const specieId = getStringParam(params.speciesId);
    const custName = getStringParam(params.custodianName);
    const custPhone = getStringParam(params.custodianPhone);

    if (selectedSpecie) {
      setSelectedSpecies(selectedSpecie);
    }
    if (specieId) {
      setSpeciesId(specieId);
    }
    if (custName) {
      setCustodianName(custName);
    }
    if (custPhone) {
      setCustodianPhone(custPhone);
    }
  }, [params.selectedSpecie, params.speciesId, params.custodianName, params.custodianPhone]);

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
        let htmlContent = await file.text();

        // Modify HTML to use cached tiles when offline
        htmlContent = await modifyLeafletHtmlForOffline(htmlContent);

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

  // Try to get location automatically on mount
  useEffect(() => {
    const tryGetLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const enabled = await Location.hasServicesEnabledAsync();
          if (enabled) {
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Lowest,
              });
              if (location?.coords && location.coords.latitude && location.coords.longitude) {
                setCurrentLocation({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });
                setLocationObject(location);
                if (location.coords.accuracy !== null && location.coords.accuracy !== undefined) {
                  setLocationAccuracy(location.coords.accuracy.toString());
                }
              }
            } catch (error: any) {
              if (error.code !== 'UNAVAILABLE' && !error.message?.includes('unavailable')) {
                console.log('Auto-location fetch failed:', error);
              }
            }
          }
        }
      } catch (error) {
        console.log('Auto-location permission check failed:', error);
      }
    };

    const timer = setTimeout(tryGetLocation, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get the actual location. Please enable it in your device settings.',
        );
        setIsGettingLocation(false);
        return;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings.',
        );
        setIsGettingLocation(false);
        return;
      }

      let location: Location.LocationObject;
      
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
      } catch (error: any) {
        console.log('Low accuracy failed, trying balanced:', error);
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (error2: any) {
          console.log('Balanced accuracy failed, trying lowest:', error2);
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          });
        }
      }

      if (!location || !location.coords) {
        throw new Error('Invalid location data received');
      }

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      if (
        isNaN(newLocation.latitude) ||
        isNaN(newLocation.longitude) ||
        newLocation.latitude === 0 ||
        newLocation.longitude === 0
      ) {
        throw new Error('Invalid coordinates received');
      }

      setCurrentLocation(newLocation);
      setLocationObject(location);
      if (location.coords.accuracy) {
        setLocationAccuracy(location.coords.accuracy.toString());
      }
      setIsGettingLocation(false);

      Alert.alert('Success', 'Location updated successfully!');
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = 'Failed to get your location. Please try again.';
      
      if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please ensure you are in an area with good GPS signal and try again.';
      } else if (error.code === 'UNAVAILABLE' || error.message?.includes('unavailable') || error.message?.includes('Make sure that location services are enabled')) {
        errorMessage = 'Location services are currently unavailable. Please:\n\n1. Enable location services in your device settings\n2. Make sure GPS is enabled\n3. Try moving to an area with better GPS signal\n4. Wait a few seconds and try again';
      } else if (error.code === 'PERMISSION_DENIED') {
        errorMessage = 'Location permission was denied. Please enable location access in your device settings.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert(
        'Location Error',
        errorMessage + '\n\nTips:\n- Make sure location services are enabled\n- Try moving to an area with better GPS signal\n- Check that the app has location permissions',
      );
      setIsGettingLocation(false);
    }
  };

  const captureTreePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture tree photos.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
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

  const handleSubmit = async () => {
    try {
      // Validation
      if (!treeImage) {
        Alert.alert('Error', 'Please capture a tree photo before submitting.');
        return;
      }

      if (!speciesId) {
        Alert.alert('Error', 'Please select a species.');
        return;
      }

      if (!custodianName.trim()) {
        Alert.alert('Error', 'Please enter custodian name.');
        return;
      }

      if (!custodianPhone.trim()) {
        Alert.alert('Error', 'Please enter custodian phone number.');
        return;
      }

      if (accessibility === 'no' && !accessibilityReason.trim()) {
        Alert.alert('Error', 'Please provide a comment explaining why the tree is not accessible.');
        return;
      }

      setIsSubmitting(true);

      // Prepare image file data
      const imageUri = treeImage;
      const filename = imageUri.split('/').pop() || 'tree-photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const imageType = match ? `image/${match[1]}` : 'image/jpeg';

      // Build location metadata
      const locationMetadata: any = {
        timestamp: new Date().toISOString(),
      };
      
      if (locationObject?.coords) {
        if (locationObject.coords.accuracy !== null && locationObject.coords.accuracy !== undefined) {
          locationMetadata.accuracy = locationObject.coords.accuracy;
        }
        if (locationObject.coords.altitude !== null && locationObject.coords.altitude !== undefined) {
          locationMetadata.altitude = locationObject.coords.altitude;
        }
        if (locationObject.coords.heading !== null && locationObject.coords.heading !== undefined) {
          locationMetadata.heading = locationObject.coords.heading;
        }
        if (locationObject.coords.speed !== null && locationObject.coords.speed !== undefined) {
          locationMetadata.speed = locationObject.coords.speed;
        }
      }

      // Build submission data structure
      const submissionData: SubmissionData = {
        file: {
          uri: imageUri,
          type: imageType,
          name: filename,
        },
        species_id: speciesId,
        custodian_name: custodianName,
        custodian_phone: custodianPhone,
        is_accessible: accessibility === 'yes' ? 'true' : 'false',
        latitude: currentLocation.latitude.toString(),
        longitude: currentLocation.longitude.toString(),
        location_metadata: JSON.stringify(locationMetadata),
      };

      // Add optional fields
      if (accessibility === 'no') {
        submissionData.accessibility_reason = accessibilityReason;
      }

      if (locationAccuracy) {
        submissionData.location_accuracy = locationAccuracy;
      }

      // Log submission data in development
      if (__DEV__) {
        console.log('[Register] Submitting form with:', {
          speciesId,
          custodianName,
          custodianPhone,
          isAccessible: accessibility === 'yes',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          hasImage: !!treeImage,
        });
      }

      // Submit with offline support
      const result = await submitWithOfflineSupport(
        'register',
        '/api/reports/validation',
        submissionData,
        (formData) => reportService.validateTree(formData)
      );

      setIsSubmitting(false);

      if (result.success) {
        if (result.queued) {
          Alert.alert(
            'Queued for Sync',
            result.message || 'Your submission has been queued and will sync when online.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setShowSuccessScreen(true);
                },
              },
            ]
          );
        } else {
          setShowSuccessScreen(true);
        }
      } else {
        const errorMessage = result.message || 'Failed to submit. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Error registering tree:', error);
      
      const errorMessage = error.message || 'Failed to register tree. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  // Show success screen if task was submitted
  if (showSuccessScreen) {
    return (
      <SuccessScreen
        taskName="Register Tree"
        message="Has Successfully been sent!"
        onDone={() => {
          setShowSuccessScreen(false);
          router.back();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register a Tree</Text>
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
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
                <Text style={styles.validateLocationText}>Get Current Location</Text>
              )}
            </TouchableOpacity>
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesLabel}>Coordinates</Text>
              <Text style={styles.coordinatesValue}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </View>

          {/* Custodian Information Section */}
          <View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter custodian name"
                placeholderTextColor="#999"
                value={custodianName}
                onChangeText={setCustodianName}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                value={custodianPhone}
                onChangeText={setCustodianPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Tree Species Selection */}
          <View style={styles.formSection}>
            <View style={styles.formHeader}>
              <Text style={styles.formLabel}>Tree Species</Text>
              <TouchableOpacity
                style={styles.viewSpecieButton}
                onPress={() => router.push({
                  pathname: '/treelist',
                  params: {
                    speciesName: selectedSpecies,
                    speciesId: speciesId,
                    custodianName: custodianName,
                    custodianPhone: custodianPhone,
                    returnPath: '/register',
                  },
                })}>
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
            {accessibility === 'no' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Comment (Required)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Please provide a reason why the tree is not accessible"
                  placeholderTextColor="#999"
                  value={accessibilityReason}
                  onChangeText={setAccessibilityReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          {/* Initial Picture */}
          <View style={styles.formSection}>
            <Text style={styles.initialPicformLabel}>Initial Picture</Text>
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
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.submitSpinner} />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </>
            ) : (
              <Text style={styles.submitButtonText}>Register Tree</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    padding: 8,
  },
  headerTitle: {
    fontSize: 12,
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
    fontSize: 12,
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
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6B7280',
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
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  coordinatesContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinatesValue: {
    fontSize: 11,
    color: '#666',
  },
  formSection: {
    marginBottom: 20,
    borderRadius: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    minWidth: 120,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 150,
  },
  viewSpecieButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewSpecieText: {
    fontSize: 11,
    color: '#36454F',
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
  initialPicformLabel: {
    fontSize: 16,
    color: '#010101',
    marginBottom: 3,
    marginTop: 5,

  },
  pictureContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    paddingVertical: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  picturePlaceholder: {
    fontSize: 14,
    color: '#010101',
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
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitSpinner: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginTop: 12,
  },
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
