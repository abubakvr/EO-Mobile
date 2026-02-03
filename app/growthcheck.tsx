import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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

const MAP_LOCATION = {
  latitude: 1.343434,
  longitude: 6.678545,
};

type Step = 1 | 2 | 3 | 4;

export default function GrowthCheckScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [webViewContent, setWebViewContent] = useState<string | null>(null);

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
    brokenBrand: 'no' as 'yes' | 'no',
    damagedBark: 'no' as 'yes' | 'no',
    bentStem: 'no' as 'yes' | 'no',
    rootsExposure: 'no' as 'yes' | 'no',
  });

  const [comments, setComments] = useState('');
  const [leafImage, setLeafImage] = useState<string | null>(null);
  const [stemImage, setStemImage] = useState<string | null>(null);
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

  const getBreadcrumb = () => {
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
      router.back();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      router.back();
    }
  };

  const capturePhoto = async (type: 'leaf' | 'stem' | 'tree') => {
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
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Soil Fertility</Text>
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
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Moisture Content</Text>
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
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>PH Value</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={soilData.ph}
              onChangeText={(text) => setSoilData({ ...soilData, ph: text })}
              placeholder="5.5 - 7.5"
            />
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Temperature</Text>
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
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Sunlight</Text>
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
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Humidity</Text>
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
        {renderToggleQuestion('Broken brand', 'brokenBrand')}
        {renderToggleQuestion('Damaged Bark', 'damagedBark')}
        {renderToggleQuestion('Bent Stem', 'bentStem')}
        {renderToggleQuestion('Roots Exposure', 'rootsExposure')}
      </View>
    </View>
  );

  const renderToggleQuestion = (label: string, key: keyof typeof physicalCondition) => (
    <View style={styles.toggleQuestion} key={key}>
      <Text style={styles.toggleLabel}>{label}</Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getBreadcrumb()}
          </Text>
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
                  lat: MAP_LOCATION.latitude,
                  lng: MAP_LOCATION.longitude,
                }}
                zoom={15}
                mapMarkers={[
                  {
                    id: '1',
                    position: {
                      lat: MAP_LOCATION.latitude,
                      lng: MAP_LOCATION.longitude,
                    },
                    icon: '📍',
                    size: [40, 40],
                  },
                ]}
                zoomControl={true}
                attributionControl={true}
                doDebug={false}
              />
            </View>
          )}
        </View>

        {/* Location Information Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationLeft}>
            <Ionicons name="locate" size={24} color="#000" />
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesValue}>
                {MAP_LOCATION.latitude}, {MAP_LOCATION.longitude}
              </Text>
              <Text style={styles.precisionText}>Precision: 15m - Altitude 123m</Text>
            </View>
          </View>
          <View style={styles.locationRight}>
            <Ionicons name="checkmark-circle" size={28} color="#2E8B57" />
          </View>
        </View>
        {currentStep === 2 && (
          <View style={styles.reportIncidentContainer}>
            <TouchableOpacity style={styles.reportIncidentButton}>
              <Text style={styles.reportIncidentText}>Report Incident</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tree Information */}
        <View style={styles.treeInfoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tree specie:</Text>
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

        {/* Step Content */}
        {renderStepContent()}
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{currentStep === 4 ? 'Submit' : 'Next'}</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reportIncidentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  coordinatesContainer: {
    flex: 1,
  },
  coordinatesValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  precisionText: {
    fontSize: 12,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  inputRow: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
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
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
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
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  toggleButtonNoSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
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
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

