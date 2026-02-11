import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { useSpeciesList } from '@/hooks/useSpecies';
import { getSpeciesImageSource } from '@/utils/speciesImageMapper';

export default function TreeSpecieScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { logout } = useAuth();
  
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

  const { species, isLoading } = useSpeciesList();

  // Get initial specie ID from params
  const getInitialSpecieId = (): number => {
    const specieId = params.specieId;
    if (typeof specieId === 'string') {
      const id = parseInt(specieId, 10);
      if (!isNaN(id) && id > 0) {
        return id;
      }
    }
    // Default to first species if available
    return species.length > 0 ? species[0].id : 1;
  };

  const [currentSpecieId, setCurrentSpecieId] = useState(() => {
    const specieId = params.specieId;
    if (typeof specieId === 'string') {
      const id = parseInt(specieId, 10);
      if (!isNaN(id) && id > 0) {
        return id;
      }
    }
    return species.length > 0 ? species[0].id : 1;
  });

  // Update currentSpecieId when species load
  React.useEffect(() => {
    if (species.length > 0 && currentSpecieId === 1 && !params.specieId) {
      setCurrentSpecieId(species[0].id);
    }
  }, [species.length]);

  const currentSpecie = useMemo(() => {
    return species.find((s) => s.id === currentSpecieId) || species[0] || null;
  }, [species, currentSpecieId]);

  const handlePrevious = () => {
    if (species.length === 0) return;
    const currentIndex = species.findIndex((s) => s.id === currentSpecieId);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : species.length - 1;
    setCurrentSpecieId(species[newIndex].id);
  };

  const handleNext = () => {
    if (species.length === 0) return;
    const currentIndex = species.findIndex((s) => s.id === currentSpecieId);
    const newIndex = currentIndex < species.length - 1 ? currentIndex + 1 : 0;
    setCurrentSpecieId(species[newIndex].id);
  };

  const handleSelectSpecie = () => {
    if (!currentSpecie) return;
    
    // Get return path from params, default to /validate
    const returnPath = getStringParam(params.returnPath, '/validate');
    
    // Navigate back to the appropriate page with selected specie and preserved data
    router.push({
      pathname: returnPath as any,
      params: {
        selectedSpecie: currentSpecie.common_name,
        // Preserve all task data and custodian data, update speciesId
        ...preservedParams,
        speciesId: currentSpecie.id.toString(),
        speciesName: currentSpecie.common_name,
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
          <Text style={styles.headerTitle}>Tree Species</Text>
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
        {isLoading && species.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Loading species...</Text>
          </View>
        ) : !currentSpecie ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No species available</Text>
          </View>
        ) : (
          <>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Tree Specie View Guide</Text>
              <Text style={styles.specieName}>{currentSpecie.common_name}</Text>
              {currentSpecie.scientific_name && (
                <Text style={styles.scientificName}>{currentSpecie.scientific_name}</Text>
              )}
            </View>

            {/* Tree Image with Navigation Arrows */}
            <View style={styles.imageContainer}>
              <Image
                source={getSpeciesImageSource(currentSpecie.common_name, '800x600')}
                style={styles.treeImage}
                resizeMode="cover"
              />
              
              {/* Navigation Arrows */}
              {species.length > 1 && (
                <View style={styles.navigationContainer}>
                  <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                    <Ionicons name="chevron-back" size={24} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Select Specie Button */}
            <TouchableOpacity style={styles.selectButton} onPress={handleSelectSpecie}>
              <Text style={styles.selectButtonText}>Select Specie</Text>
            </TouchableOpacity>
          </>
        )}
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
  scientificName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
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

