import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tree species data with detailed images from Unsplash - using random images
const treeSpeciesData = [
  {
    id: 1,
    name: 'Moringa',
    image: 'https://source.unsplash.com/800x600/?moringa,tree',
  },
  {
    id: 2,
    name: 'Eucalyptus',
    image: 'https://source.unsplash.com/800x600/?eucalyptus,tree',
  },
  {
    id: 3,
    name: 'Lemon',
    image: 'https://source.unsplash.com/800x600/?lemon,tree',
  },
  {
    id: 4,
    name: 'Locust Beans',
    image: 'https://source.unsplash.com/800x600/?tree,forest',
  },
  {
    id: 5,
    name: 'Sandal',
    image: 'https://source.unsplash.com/800x600/?tree,nature',
  },
  {
    id: 6,
    name: 'Sesbania',
    image: 'https://source.unsplash.com/800x600/?tree,green',
  },
  {
    id: 7,
    name: 'Tamarin',
    image: 'https://source.unsplash.com/800x600/?tamarind,tree',
  },
  {
    id: 8,
    name: 'Black Plum',
    image: 'https://source.unsplash.com/800x600/?plum,tree',
  },
  {
    id: 9,
    name: 'Dates',
    image: 'https://source.unsplash.com/800x600/?date,palm,tree',
  },
  {
    id: 10,
    name: 'Ficus Polita',
    image: 'https://source.unsplash.com/800x600/?ficus,tree',
  },
  {
    id: 11,
    name: 'Neem',
    image: 'https://source.unsplash.com/800x600/?neem,tree',
  },
  {
    id: 12,
    name: 'Orange',
    image: 'https://source.unsplash.com/800x600/?orange,tree',
  },
];

export default function TreeSpecieScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Helper to get string param value
  const getStringParam = (param: string | string[] | undefined, defaultValue: string = ''): string => {
    if (Array.isArray(param)) return param[0] || defaultValue;
    return param || defaultValue;
  };
  
  // Get preserved task data from params
  const preservedParams = {
    taskId: getStringParam(params.taskId),
    treeId: getStringParam(params.treeId),
    treeCode: getStringParam(params.treeCode),
    speciesName: getStringParam(params.speciesName),
    speciesId: getStringParam(params.speciesId),
    custodianName: getStringParam(params.custodianName),
    custodianPhone: getStringParam(params.custodianPhone),
    custodianId: getStringParam(params.custodianId),
    returnPath: getStringParam(params.returnPath, '/validate'),
  };

  // Get initial specie ID from params, default to 1
  const getInitialSpecieId = (): number => {
    const specieId = params.specieId;
    if (typeof specieId === 'string') {
      const id = parseInt(specieId, 10);
      if (!isNaN(id) && id >= 1 && id <= 12) {
        return id;
      }
    }
    return 1;
  };

  const [currentSpecieId, setCurrentSpecieId] = useState(getInitialSpecieId());

  const currentSpecie = treeSpeciesData.find((s) => s.id === currentSpecieId) || treeSpeciesData[0];

  const handlePrevious = () => {
    const newId = currentSpecieId > 1 ? currentSpecieId - 1 : 12;
    setCurrentSpecieId(newId);
  };

  const handleNext = () => {
    const newId = currentSpecieId < 12 ? currentSpecieId + 1 : 1;
    setCurrentSpecieId(newId);
  };

  const handleSelectSpecie = () => {
    // Get return path from params, default to /validate
    const returnPath = getStringParam(params.returnPath, '/validate');
    
    // Navigate back to the appropriate page with selected specie and preserved data
    router.push({
      pathname: returnPath as any,
      params: {
        selectedSpecie: currentSpecie.name,
        // Preserve all task data and custodian data, update speciesId
        ...preservedParams,
        speciesId: currentSpecie.id.toString(),
      },
    });
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
          <Text style={styles.headerTitle}>Home/Schedule/Growth check</Text>
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
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tree Specie View Guide</Text>
          <Text style={styles.specieName}>{currentSpecie.name}</Text>
        </View>

        {/* Tree Image with Navigation Arrows */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentSpecie.image }} style={styles.treeImage} resizeMode="cover" />
          
          {/* Navigation Arrows */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
              <Ionicons name="chevron-back" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Select Specie Button */}
        <TouchableOpacity style={styles.selectButton} onPress={handleSelectSpecie}>
          <Text style={styles.selectButtonText}>Select Specie</Text>
        </TouchableOpacity>
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
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 8,
  },
  specieName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    position: 'relative',
  },
  treeImage: {
    width: '100%',
    height: 400,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

