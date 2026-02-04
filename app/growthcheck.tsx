import SuccessScreen from '@/components/SuccessScreen';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_MAP_LOCATION = {
  latitude: 1.343434,
  longitude: 6.678545,
};

type Step = 1 | 2 | 3 | 4;

type ViewMode = 'growthCheck' | 'incidentReport';

export default function GrowthCheckScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('growthCheck');
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [webViewContent, setWebViewContent] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_MAP_LOCATION);
  const [locationAccuracy, setLocationAccuracy] = useState<string>('');
  const [locationObject, setLocationObject] = useState<Location.LocationObject | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Form state
  const [soilData, setSoilData] = useState({
    fertility: '3.5 - 9',
    moisture: '0 - 100',
    ph: '5.5 - 7.5',
    temperature: '18 - 24',
    sunlight: '<250 - 100,000',
    humidity: '20 - 80',
  });

  const [physicalCondition, setPhysicalCondition] = useState({
    brokenBranch: 'no' as 'yes' | 'no',
    damagedBark: 'no' as 'yes' | 'no',
    bentStem: 'no' as 'yes' | 'no',
    rootsExposure: 'no' as 'yes' | 'no',
  });

  const [comments, setComments] = useState('');
  const [leafImage, setLeafImage] = useState<string | null>(null);
  const [stemImage, setStemImage] = useState<string | null>(null);
  const [treeImage, setTreeImage] = useState<string | null>(null);

  // Incident Report state
  const [incidentData, setIncidentData] = useState({
    damageDestroyed: 'no' as 'yes' | 'no',
    missingTree: 'no' as 'yes' | 'no',
    others: '',
  });
  const [incidentPhoto, setIncidentPhoto] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successTaskName, setSuccessTaskName] = useState('');

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
                // Store location object and accuracy for display
                setLocationObject(location);
                if (location.coords.accuracy !== null && location.coords.accuracy !== undefined) {
                  setLocationAccuracy(location.coords.accuracy.toString());
                }
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
          'Location permission is required to get the actual location. Please enable it in your device settings.',
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

  const getBreadcrumb = () => {
    if (viewMode === 'incidentReport') {
      return 'Schedule/Report Incident';
    }
    const steps = ['Home/Schedule', 'Growthcheck'];
    if (currentStep === 1) return steps.join('/');
    if (currentStep === 2) return steps.join('/') + '/Physical Condition';
    if (currentStep === 3) return steps.join('/') + '/Leaf/Stem Condition';
    if (currentStep === 4) return steps.join('/') + '/Tree Image';
    return steps.join('/');
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      // Submit form
      console.log('Submitting growth check data...');
      setSuccessTaskName('Growth Check');
      setShowSuccessScreen(true);
    }
  };

  const handleIncidentSubmit = () => {
    // Submit incident report
    console.log('Submitting incident report...', incidentData);
    setSuccessTaskName('Report Incident');
    setShowSuccessScreen(true);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      router.back();
    }
  };

  const capturePhoto = async (type: 'leaf' | 'stem' | 'tree' | 'incident') => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture photos.',
        );
        return;
      }

      // Launch camera (camera only, no gallery, no cropping)
      // mediaTypes omitted - defaults to images
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (type === 'leaf') {
          setLeafImage(imageUri);
        } else if (type === 'stem') {
          setStemImage(imageUri);
        } else if (type === 'tree') {
          setTreeImage(imageUri);
        } else if (type === 'incident') {
          setIncidentPhoto(imageUri);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderSoilCondition();
      case 2:
        return renderPhysicalCondition();
      case 3:
        return renderLeafStemCondition();
      case 4:
        return renderTreeImage();
      default:
        return null;
    }
  };

  const renderSoilCondition = () => (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Soil Condition</Text>
        <Ionicons name="chevron-down" size={20} color="#000" />
      </View>
      <View style={styles.soilForm}>
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>Soil Fertility</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={soilData.fertility}
              onChangeText={(text) => setSoilData({ ...soilData, fertility: text })}
              placeholder="3.5 - 9"
            />
            <Text style={styles.inputUnit}>mg/kg</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>Moisture Content</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={soilData.moisture}
              onChangeText={(text) => setSoilData({ ...soilData, moisture: text })}
              placeholder="0 - 100"
            />
            <Text style={styles.inputUnit}>%</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>PH Value</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={soilData.ph}
              onChangeText={(text) => setSoilData({ ...soilData, ph: text })}
              placeholder="5.5 - 7.5"
            />
          </View>
        </View>
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>Temperature</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={soilData.temperature}
              onChangeText={(text) => setSoilData({ ...soilData, temperature: text })}
              placeholder="18 - 24"
            />
            <Text style={styles.inputUnit}>°C</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>Sunlight</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={soilData.sunlight}
              onChangeText={(text) => setSoilData({ ...soilData, sunlight: text })}
              placeholder="<250 - 100,000"
            />
            <Text style={styles.inputUnit}>lux</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>Humidity</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={soilData.humidity}
              onChangeText={(text) => setSoilData({ ...soilData, humidity: text })}
              placeholder="20 - 80"
            />
            <Text style={styles.inputUnit}>%</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPhysicalCondition = () => (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWithIcon}>
          <Text style={styles.sectionTitle}>Physical Condition</Text>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
        </View>
      </View>
      <View style={styles.physicalForm}>
        {renderToggleQuestion('Broken branch', 'brokenBranch')}
        {renderToggleQuestion('Damaged Bark', 'damagedBark')}
        {renderToggleQuestion('Bent Stem', 'bentStem')}
        {renderToggleQuestion('Roots Exposure', 'rootsExposure')}
      </View>
    </View>
  );

  const renderToggleQuestion = (label: string, key: keyof typeof physicalCondition) => (
    <View style={styles.gridRow} key={key}>
      <Text style={styles.gridLabel}>{label}</Text>
      <View style={styles.toggleGroup}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            physicalCondition[key] === 'yes' ? styles.toggleButtonYesSelected : styles.toggleButtonUnselected,
          ]}
          onPress={() => setPhysicalCondition({ ...physicalCondition, [key]: 'yes' })}>
          <Text
            style={[
              styles.toggleButtonText,
              physicalCondition[key] === 'yes'
                ? styles.toggleButtonTextSelected
                : styles.toggleButtonTextUnselected,
            ]}>
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            physicalCondition[key] === 'no' ? styles.toggleButtonNoSelected : styles.toggleButtonUnselected,
          ]}
          onPress={() => setPhysicalCondition({ ...physicalCondition, [key]: 'no' })}>
          <Text
            style={[
              styles.toggleButtonText,
              physicalCondition[key] === 'no'
                ? styles.toggleButtonTextSelected
                : styles.toggleButtonTextUnselected,
            ]}>
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLeafStemCondition = () => (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leaf/Stem Condition</Text>
        <Ionicons name="chevron-down" size={20} color="#000" />
      </View>
      <View style={styles.photoCards}>
        <View style={styles.photoCard}>
          <Text style={styles.photoCardTitle}>Capture Leaf Photo</Text>
          {leafImage ? (
            <>
              <Image source={{ uri: leafImage }} style={styles.capturedPhoto} />
              <TouchableOpacity
                style={[styles.captureButton, styles.retakeButton]}
                onPress={() => capturePhoto('leaf')}>
                <Text style={styles.captureButtonText}>Retake</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => capturePhoto('leaf')}>
              <Text style={styles.captureButtonText}>Capture</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.photoCard}>
          <Text style={styles.photoCardTitle}>Capture Stem Photo</Text>
          {stemImage ? (
            <>
              <Image source={{ uri: stemImage }} style={styles.capturedPhoto} />
              <TouchableOpacity
                style={[styles.captureButton, styles.retakeButton]}
                onPress={() => capturePhoto('stem')}>
                <Text style={styles.captureButtonText}>Retake</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => capturePhoto('stem')}>
              <Text style={styles.captureButtonText}>Capture</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderTreeImage = () => (
    <View style={styles.formSection}>
      <View style={styles.treeImageSection}>
        <Text style={styles.formLabel}>Tree Image</Text>
        <View style={styles.pictureContainer}>
          {treeImage ? (
            <>
              <Image source={{ uri: treeImage }} style={styles.capturedImage} />
              <TouchableOpacity
                style={[styles.captureButton, styles.retakeButton]}
                onPress={() => capturePhoto('tree')}>
                <Text style={styles.captureButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.picturePlaceholder}>Capture Tree Photo</Text>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => capturePhoto('tree')}>
                <Text style={styles.captureButtonText}>Capture</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <View style={styles.commentsSection}>
        <Text style={styles.formLabel}>Additional Comments</Text>
        <TextInput
          style={styles.commentsInput}
          multiline
          numberOfLines={6}
          placeholder="Enter additional comments..."
          value={comments}
          onChangeText={setComments}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderIncidentReport = () => (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Report Incident</Text>
        <Ionicons name="chevron-down" size={20} color="#000" />
      </View>
      <View style={styles.incidentForm}>
        {/* Damage/Destroyed */}
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>Damage/Destroyed</Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                incidentData.damageDestroyed === 'yes'
                  ? styles.toggleButtonYesSelected
                  : styles.toggleButtonUnselected,
              ]}
              onPress={() => setIncidentData({ ...incidentData, damageDestroyed: 'yes' })}>
              <Text
                style={[
                  styles.toggleButtonText,
                  incidentData.damageDestroyed === 'yes'
                    ? styles.toggleButtonTextSelected
                    : styles.toggleButtonTextUnselected,
                ]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                incidentData.damageDestroyed === 'no'
                  ? styles.toggleButtonNoSelected
                  : styles.toggleButtonUnselected,
              ]}
              onPress={() => setIncidentData({ ...incidentData, damageDestroyed: 'no' })}>
              <Text
                style={[
                  styles.toggleButtonText,
                  incidentData.damageDestroyed === 'no'
                    ? styles.toggleButtonTextSelected
                    : styles.toggleButtonTextUnselected,
                ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Missing Tree */}
        <View style={styles.gridRow}>
          <Text style={styles.gridLabel}>Missing Tree</Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                incidentData.missingTree === 'yes'
                  ? styles.toggleButtonYesSelected
                  : styles.toggleButtonUnselected,
              ]}
              onPress={() => setIncidentData({ ...incidentData, missingTree: 'yes' })}>
              <Text
                style={[
                  styles.toggleButtonText,
                  incidentData.missingTree === 'yes'
                    ? styles.toggleButtonTextSelected
                    : styles.toggleButtonTextUnselected,
                ]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                incidentData.missingTree === 'no'
                  ? styles.toggleButtonNoSelected
                  : styles.toggleButtonUnselected,
              ]}
              onPress={() => setIncidentData({ ...incidentData, missingTree: 'no' })}>
              <Text
                style={[
                  styles.toggleButtonText,
                  incidentData.missingTree === 'no'
                    ? styles.toggleButtonTextSelected
                    : styles.toggleButtonTextUnselected,
                ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Others */}
        <View style={styles.gridColumn}>
          <Text style={styles.gridLabel}>Others</Text>
          <TextInput
            style={styles.incidentOthersInput}
            multiline
            numberOfLines={4}
            placeholder="Enter additional comments..."
            value={incidentData.others}
            onChangeText={(text) => setIncidentData({ ...incidentData, others: text })}
            textAlignVertical="top"
          />
        </View>

        {/* Capture Photo */}
        <View style={styles.incidentQuestion}>
          <Text style={styles.incidentLabel}>Capture Photo of Planting Site</Text>
          <View style={styles.pictureContainer}>
            {incidentPhoto ? (
              <>
                <Image source={{ uri: incidentPhoto }} style={styles.capturedImage} />
                <TouchableOpacity
                  style={[styles.captureButton, styles.retakeButton]}
                  onPress={() => capturePhoto('incident')}>
                  <Text style={styles.captureButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => capturePhoto('incident')}>
                <Text style={styles.captureButtonText}>Capture</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  // Show success screen if task was submitted
  if (showSuccessScreen) {
    return (
      <SuccessScreen
        taskName={successTaskName}
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
          <View style={styles.headerTitleContainer}>
            {viewMode === 'incidentReport' ? (
              <>
                <Text style={styles.headerTitle}>Schedule/</Text>
                <Text style={[styles.headerTitle, styles.headerTitleHighlight]}>Report Incident</Text>
              </>
            ) : (
              <Text style={styles.headerTitle} numberOfLines={1}>
                {getBreadcrumb()}
              </Text>
            )}
          </View>
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

        {/* Get Location Button and Coordinates */}
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

        {/* Location Information Card with Toggle */}
        <View style={styles.locationCardContainer}>
          <View style={styles.locationCard}>
            <View style={styles.locationLeft}>
              {/* <Ionicons name="locate" size={24} color="#000" /> */}
              <View style={styles.locationCoordinatesContainer}>
                <Text style={styles.locationCoordinatesValue}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.precisionText}>
                  {locationObject?.coords?.accuracy !== null && locationObject?.coords?.accuracy !== undefined
                    ? `Precision: ${locationObject.coords.accuracy.toFixed(0)}m`
                    : locationAccuracy
                      ? `Precision: ${parseFloat(locationAccuracy).toFixed(0)}m`
                      : 'Precision: N/A'}
                  {locationObject?.coords?.altitude !== null && locationObject?.coords?.altitude !== undefined
                    ? ` - Altitude ${locationObject.coords.altitude.toFixed(0)}m`
                    : ''}
                </Text>
              </View>
            </View>
            {/* <View style={styles.locationRight}>
              <Ionicons name="checkmark-circle" size={28} color="#2E8B57" />
            </View> */}
          </View>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'incidentReport' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode(viewMode === 'growthCheck' ? 'incidentReport' : 'growthCheck')}>
            <Text
              style={[
                styles.viewToggleButtonText,
                viewMode === 'incidentReport' && styles.viewToggleButtonTextActive,
              ]}>
              {viewMode === 'growthCheck' ? 'Report Incident' : 'Growth Check'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Tree Information */}
        <View style={styles.treeInfoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tree Name:</Text>
            <Text style={styles.infoValue}>Moringa</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tree ID:</Text>
            <Text style={styles.infoValue}>325345</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Custodian Name:</Text>
            <Text style={styles.infoValue}>Mal. Ali U</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone No:</Text>
            <Text style={styles.infoValue}>09043222222</Text>
          </View>
        </View>

        {/* Conditional Content Based on View Mode */}
        {viewMode === 'growthCheck' ? (
          <>{renderStepContent()}</>
        ) : (
          <>{renderIncidentReport()}</>
        )}
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomButtons}>
        {viewMode === 'growthCheck' ? (
          <>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                <Text style={styles.previousButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.nextButton, currentStep === 1 && styles.nextButtonFullWidth]} 
              onPress={handleNext}>
              <Text style={styles.nextButtonText}>{currentStep === 4 ? 'Submit' : 'Next'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.submitButton} onPress={handleIncidentSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        )}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  headerTitleHighlight: {
    color: '#F44336',
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
  locationCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  viewToggleButton: {
    backgroundColor: '#AA1F21',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  viewToggleButtonActive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  viewToggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewToggleButtonTextActive: {
    color: '#FFFFFF',
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
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  locationRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIncidentContainer: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  reportIncidentButton: {
    backgroundColor: '#AA1F21',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  reportIncidentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationCoordinatesContainer: {
    flex: 1,
  },
  locationCoordinatesValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  precisionText: {
    fontSize: 8,
    color: '#666',
  },
  treeInfoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    marginBottom: 20,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soilForm: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    gap: 16,
  },
  inputRow: {
    gap: 8,
  },
  gridColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#000',
    flex: 1,
    minWidth: 120,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    flex: 1,
    minWidth: 150,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  physicalForm: {
    borderRadius: 12,
    gap: 20,
  },
  toggleQuestion: {
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    minWidth: 150,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleButtonUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  toggleButtonYesSelected: {
    backgroundColor: '#AA1F21',
  },
  toggleButtonNoSelected: {
    backgroundColor: '#2E8B57',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButtonTextSelected: {
    color: '#FFFFFF',
  },
  toggleButtonTextUnselected: {
    color: '#666',
  },
  photoCards: {
    gap: 16,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  treeImageSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  pictureContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  retakeButton: {
    marginTop: 12,
  },
  capturedPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  commentsSection: {
    marginTop: 20,
  },
  commentsInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#000',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  previousButton: {
    flex: 1,
    backgroundColor: '#4A4A4A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
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
  incidentForm: {
    borderRadius: 12,
    padding: 16,
    gap: 20,
  },
  incidentQuestion: {
    gap: 12,
  },
  incidentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  incidentOthersInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#000',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
    flex: 1,
    minWidth: 150,
  },
});

