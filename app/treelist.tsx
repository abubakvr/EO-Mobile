import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSpeciesList } from '@/hooks/useSpecies';

// Helper function to get image URL for a species
const getSpeciesImageUrl = (speciesName: string): string => {
  const name = speciesName.toLowerCase().replace(/\s+/g, ',');
  return `https://source.unsplash.com/400x400/?${name},tree`;
};

export default function TreeListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { species, isLoading, error, refetch } = useSpeciesList();
  
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

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Tree List</Text>
      </View>

      {/* Tree Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && species.length > 0}
            onRefresh={refetch}
          />
        }>
        {isLoading && species.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Loading species...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>Failed to load species</Text>
            <Text style={styles.errorSubtext}>{error.message}</Text>
          </View>
        ) : species.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No species available</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {species.map((specie) => (
              <TouchableOpacity
                key={specie.id}
                style={styles.treeCard}
                onPress={() => {
                  router.push({
                    pathname: '/treespecie',
                    params: {
                      specieId: specie.id.toString(),
                      specieName: specie.common_name,
                      scientificName: specie.scientific_name,
                      specieCode: specie.code,
                      // Preserve task data
                      ...preservedParams,
                    },
                  });
                }}
                activeOpacity={0.8}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: getSpeciesImageUrl(specie.common_name) }}
                    style={styles.treeImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.treeName}>{specie.common_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  treeCard: {
    width: '31%',
    marginBottom: 16,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  treeImage: {
    width: '100%',
    height: '100%',
  },
  treeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
});

