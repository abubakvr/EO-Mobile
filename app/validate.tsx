import { reportService } from '@/services/reportService';
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

export default function ValidateTreeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [webViewContent, setWebViewContent] = useState<string | null>(null);
  
  // Helper to get string param value
  const getStringParam = (param: string | string[] | undefined, defaultValue: string = ''): string => {
    if (Array.isArray(param)) return param[0] || defaultValue;
    return param || defaultValue;
  };
  
  // Store task data in state to persist across re-renders
  const [taskData, setTaskData] = useState(() => ({
    treeCode: getStringParam(params.treeCode),
    speciesName: getStringParam(params.speciesName),
    speciesId: getStringParam(params.speciesId),
    custodianName: getStringParam(params.custodianName),
    custodianPhone: getStringParam(params.custodianPhone),
    taskId: getStringParam(params.taskId),
    treeId: getStringParam(params.treeId),
    custodianId: getStringParam(params.custodianId),
  }));
  
  // Get selected specie from route params or use default
  const getInitialSpecie = (): string => {
    // First check for speciesName from task data
    const speciesNameParam = params.speciesName || params.selectedSpecie;
    if (speciesNameParam) {
      const specie = getStringParam(speciesNameParam);
      if (specie) return specie;
    }
    // Fallback to stored task data
    if (taskData.speciesName) return taskData.speciesName;
    return 'Mango';
  };
  
  const [selectedSpecies, setSelectedSpecies] = useState(getInitialSpecie());
  const [accessibility, setAccessibility] = useState<'yes' | 'no'>('yes');
  const [accessibilityReason, setAccessibilityReason] = useState('');
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_MAP_LOCATION);
  const [locationAccuracy, setLocationAccuracy] = useState<string>('');
  const [locationObject, setLocationObject] = useState<Location.LocationObject | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [treeImage, setTreeImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update task data when params change (but preserve existing values if params are empty)
  useEffect(() => {
    const newTreeCode = getStringParam(params.treeCode);
    const newSpeciesName = getStringParam(params.speciesName);
    const newSpeciesId = getStringParam(params.speciesId);
    const newCustodianName = getStringParam(params.custodianName);
    const newCustodianPhone = getStringParam(params.custodianPhone);
    const newTaskId = getStringParam(params.taskId);
    const newTreeId = getStringParam(params.treeId);
    const newCustodianId = getStringParam(params.custodianId);
    
    // Only update if we have new values (preserve existing state)
    setTaskData(prev => ({
      treeCode: newTreeCode || prev.treeCode,
      speciesName: newSpeciesName || prev.speciesName,
      speciesId: newSpeciesId || prev.speciesId,
      custodianName: newCustodianName || prev.custodianName,
      custodianPhone: newCustodianPhone || prev.custodianPhone,
      taskId: newTaskId || prev.taskId,
      treeId: newTreeId || prev.treeId,
      custodianId: newCustodianId || prev.custodianId,
    }));
  }, [
    params.treeCode,
    params.speciesName,
    params.speciesId,
    params.custodianName,
    params.custodianPhone,
    params.taskId,
    params.treeId,
    params.custodianId,
  ]);

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
    // Prioritize speciesName from task data or selectedSpecie from navigation
    const specieParam = params.speciesName || params.selectedSpecie;
    if (specieParam) {
      const specie = getStringParam(specieParam);
      if (specie) {
        setSelectedSpecies(specie);
        // Also update task data if speciesName changed
        if (params.speciesName) {
          setTaskData(prev => ({ ...prev, speciesName: specie }));
        }
      }
    } else if (taskData.speciesName) {
      // Fallback to stored task data
      setSelectedSpecies(taskData.speciesName);
    }
  }, [params.speciesName, params.selectedSpecie, taskData.speciesName]);

  // Try to get location automatically on mount (optional - can be removed if not desired)
  useEffect(() => {
    const tryGetLocation = async () => {
      try {
        // Check if we already have permission
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          // Silently try to get location without showing alerts
          const enabled = await Location.hasServicesEnabledAsync();
          if (enabled) {
            try {
              // Try with lowest accuracy first for faster response
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Lowest,
              });
              if (location?.coords && location.coords.latitude && location.coords.longitude) {
                setCurrentLocation({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });
              }
            } catch (error: any) {
              // Silently fail - user can manually request location
              // Only log if it's not a common "unavailable" error
              if (error.code !== 'UNAVAILABLE' && !error.message?.includes('unavailable')) {
                console.log('Auto-location fetch failed:', error);
              }
            }
          }
        }
      } catch (error) {
        // Silently fail - user can manually request location
        console.log('Auto-location permission check failed:', error);
      }
    };

    // Small delay to let the screen render first
    const timer = setTimeout(tryGetLocation, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to validate the actual location. Please enable it in your device settings.',
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

      // Get current position with better options
      // Try with lower accuracy first for faster response, then fallback to higher accuracy if needed
      let location: Location.LocationObject;
      
      try {
        // First try with lower accuracy for faster response
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Lower accuracy is faster
        });
      } catch (error: any) {
        // If low accuracy fails, try balanced accuracy
        console.log('Low accuracy failed, trying balanced:', error);
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (error2: any) {
          // If balanced fails, try with any available accuracy
          console.log('Balanced accuracy failed, trying lowest:', error2);
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          });
        }
      }

      // Validate location data
      if (!location || !location.coords) {
        throw new Error('Invalid location data received');
      }

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Validate coordinates are valid numbers
      if (
        isNaN(newLocation.latitude) ||
        isNaN(newLocation.longitude) ||
        newLocation.latitude === 0 ||
        newLocation.longitude === 0
      ) {
        throw new Error('Invalid coordinates received');
      }

      setCurrentLocation(newLocation);
      // Store location object and accuracy for metadata
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
      // mediaTypes omitted - defaults to images
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

      if (!taskData.treeId) {
        Alert.alert('Error', 'Tree ID is missing. Please go back and try again.');
        return;
      }

      if (!taskData.speciesId) {
        Alert.alert('Error', 'Species ID is missing. Please select a species.');
        return;
      }

      if (!taskData.taskId) {
        Alert.alert('Error', 'Task ID is missing. Please go back and try again.');
        return;
      }

      // Validate accessibility comment if accessibility is "no"
      if (accessibility === 'no' && !accessibilityReason.trim()) {
        Alert.alert('Error', 'Please provide a comment explaining why the tree is not accessible.');
        return;
      }

      setIsSubmitting(true);

      // Create FormData
      const formData = new FormData();

      // Add image file
      // For React Native, FormData file format should be: { uri, type, name }
      const imageUri = treeImage;
      const filename = imageUri.split('/').pop() || 'tree-photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // React Native FormData file format
      formData.append('file', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        type,
        name: filename,
      } as any);

      // Add required fields
      // FormData.append requires all values to be strings in React Native
      formData.append('tree_id', taskData.treeId);
      formData.append('task_id', taskData.taskId);
      formData.append('species_id', taskData.speciesId);
      formData.append('is_accessible', accessibility === 'yes' ? 'true' : 'false');
      // Latitude and longitude as strings (API expects numbers but FormData needs strings)
      formData.append('latitude', currentLocation.latitude.toString());
      formData.append('longitude', currentLocation.longitude.toString());

      // Add optional fields
      // Always include accessibility_reason if accessibility is "no" (even if empty, but we validate it's not empty)
      if (accessibility === 'no') {
        formData.append('accessibility_reason', accessibilityReason);
      }

      if (locationAccuracy) {
        formData.append('location_accuracy', locationAccuracy);
      }

      // Add location metadata as JSON string
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
      
      formData.append('location_metadata', JSON.stringify(locationMetadata));

      if (taskData.custodianName) {
        formData.append('custodian_name', taskData.custodianName);
      }

      if (taskData.custodianPhone) {
        formData.append('custodian_phone', taskData.custodianPhone);
      }

      // Log FormData contents in development
      if (__DEV__) {
        console.log('[Validate] Submitting form with:', {
          treeId: taskData.treeId,
          taskId: taskData.taskId,
          speciesId: taskData.speciesId,
          isAccessible: accessibility === 'yes',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          hasImage: !!treeImage,
          imageUri: treeImage,
        });
      }

      // Submit to API
      const response = await reportService.validateTree(formData);

      setIsSubmitting(false);

      Alert.alert(
        'Success',
        response.message || 'Tree validated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to schedule page
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Error submitting validation:', error);
      
      const errorMessage = error.message || 'Failed to validate tree. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

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
          <Text style={styles.treeIdText}>TreeID/{taskData.treeCode || 'N/A'}</Text>
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

        {/* Tree Information Section */}
        <View style={styles.treeInfoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tree specie:</Text>
            <Text style={styles.infoValue}>{taskData.speciesName || selectedSpecies || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tree ID:</Text>
            <Text style={styles.infoValue}>{taskData.treeCode || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Custodian Name:</Text>
            <Text style={styles.infoValue}>{taskData.custodianName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone No:</Text>
            <Text style={styles.infoValue}>{taskData.custodianPhone || 'N/A'}</Text>
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
                  // Pass current task data so it can be preserved when navigating back
                  taskId: taskData.taskId,
                  treeId: taskData.treeId,
                  treeCode: taskData.treeCode,
                  speciesName: taskData.speciesName || selectedSpecies,
                  speciesId: taskData.speciesId,
                  custodianName: taskData.custodianName,
                  custodianPhone: taskData.custodianPhone,
                  custodianId: taskData.custodianId || '',
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
            <Text style={styles.submitButtonText}>Submit Task</Text>
          )}
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
  treeInfoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 80,
    textAlignVertical: 'top',
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
