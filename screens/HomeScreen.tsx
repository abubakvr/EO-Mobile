import { useAuth } from '@/hooks/useAuth';
import { useTasksCount } from '@/hooks/useTasks';
import { useTrees } from '@/hooks/useTrees';
import { tokenStorage } from '@/services/tokenStorage';
import type { Tree } from '@/types/tree';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from "expo-asset";
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';

const DEFAULT_LOCATION = {
  latitude: 9.0765,
  longitude: 7.3986,
};

const HomeScreen = () => {
  const router = useRouter();
  const [webViewContent, setWebViewContent] = useState<string | null>(null);
  const { total: tasksCount, isLoading: isLoadingTasks } = useTasksCount();
  const { logout } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [userWard, setUserWard] = useState<string>('');
  const { data: treesData, isLoading: isLoadingTrees } = useTrees({ page_size: 100 });

  useEffect(() => {
    let isMounted = true;

    const loadHtml = async () => {
      try {
        const path = require("../assets/leaflet.html");
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
        Alert.alert('Error loading HTML', JSON.stringify(error));
      }
    };

    loadHtml();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load user data from secure storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [name, ward] = await Promise.all([
          tokenStorage.getUserName(),
          tokenStorage.getUserWard(),
        ]);
        
        if (name) {
          setUserName(name);
        }
        if (ward) {
          setUserWard(ward);
        }
      } catch (error) {
        // Silently handle error
      }
    };

    loadUserData();
  }, []);

  // Create markers from trees data
  const mapMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      position: { lat: number; lng: number };
      icon: string;
      size: [number, number];
    }> = [];

    if (treesData?.data && Array.isArray(treesData.data)) {
      treesData.data.forEach((tree: Tree) => {
        if (tree.location && typeof tree.location === 'object') {
          const lat = tree.location.latitude;
          const lng = tree.location.longitude;
          
          if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
            markers.push({
              id: `tree-${tree.id}`,
              position: {
                lat: lat,
                lng: lng,
              },
              icon: '🌲',
              size: [40, 40],
            });
          }
        }
      });
    }

    // If no tree markers, add default marker
    if (markers.length === 0) {
      markers.push({
        id: 'default',
        position: {
          lat: DEFAULT_LOCATION.latitude,
          lng: DEFAULT_LOCATION.longitude,
        },
        icon: '📍',
        size: [32, 32],
      });
    }

    return markers;
  }, [treesData]);

  // Calculate map center based on trees or use default
  const mapCenter = useMemo(() => {
    if (mapMarkers.length > 0 && mapMarkers[0].id !== 'default') {
      // Use the first tree's location as center, or calculate average
      const firstMarker = mapMarkers[0];
      return {
        lat: firstMarker.position.lat,
        lng: firstMarker.position.lng,
      };
    }
    return {
      lat: DEFAULT_LOCATION.latitude,
      lng: DEFAULT_LOCATION.longitude,
    };
  }, [mapMarkers]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => logout()}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.topRow}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.profileName}>{userName || 'Loading...'}</Text>
              {userWard && <Text style={styles.profileSubtitle}>{userWard}</Text>}
            </View>
          </View>

          <View style={styles.actionsColumn}>
            <TouchableOpacity
              style={styles.primaryChip}
              onPress={() => router.push('/register')}>
              <Text style={styles.primaryChipText}>Register a Tree</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.tasksCard}
          onPress={() => router.push('/(tabs)/two')}
          activeOpacity={0.8}>
          <Text style={styles.tasksLabel}>Assigned Tasks</Text>
          <Text style={styles.tasksCount}>
            {isLoadingTasks ? 'Loading...' : `${tasksCount} ${tasksCount === 1 ? 'Task' : 'Tasks'}`}
          </Text>
        </TouchableOpacity>

        <View style={styles.mapCard}>
          {!webViewContent ? (
            <View style={[styles.mapImage, styles.loadingContainer]}>
              <ActivityIndicator size="large" color="#2E8B57" />
            </View>
          ) : (
            <View style={styles.mapImage}>
              <LeafletView
                source={{ html: webViewContent }}
                mapCenterPosition={mapCenter}
                zoom={13}
                mapMarkers={mapMarkers}
                zoomControl={true}
                attributionControl={true}
                doDebug={false}
                key={`map-${mapMarkers.length}-${mapCenter.lat}-${mapCenter.lng}`}
              />
            </View>
          )}

          <View style={styles.mapActions}>
            <TouchableOpacity style={styles.roundIconButton}>
              <Text style={styles.roundIconText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundIconButton}>
              <Text style={styles.roundIconText}>📍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    paddingTop: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 58,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  profileSubtitle: {
    fontSize: 10,
    color: '#777777',
  },
  actionsColumn: {
    alignItems: 'flex-end',
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconChipText: {
    fontSize: 16,
  },
  primaryChip: {
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tasksCard: {
    backgroundColor: '#2E8B57',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 20,
  },
  tasksLabel: {
    color: '#E0F5E9',
    fontSize: 12,
    marginBottom: 4,
  },
  tasksCount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mapImage: {
    width: '100%',
    height: 360,
    borderWidth: 1,
    borderColor: '#6B7280',

  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  mapActions: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    gap: 12,
    zIndex: 10,
  },
  roundIconButton: {
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
  roundIconText: {
    fontSize: 18,
  },
});


