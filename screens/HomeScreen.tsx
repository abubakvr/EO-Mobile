import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Asset } from "expo-asset";
import { File } from 'expo-file-system';
import { LeafletView } from 'react-native-leaflet-view';
import { useRouter } from 'expo-router';

const DEFAULT_LOCATION = {
  latitude: 9.0765,
  longitude: 7.3986,
};

const HomeScreen = () => {
  const router = useRouter();
  const [webViewContent, setWebViewContent] = useState<string | null>(null);

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
        console.error('Error loading HTML:', error);
        Alert.alert('Error loading HTML', JSON.stringify(error));
      }
    };

    loadHtml();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Home</Text>

        <View style={styles.topRow}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.profileName}>Abubakar Ladan</Text>
              <Text style={styles.profileSubtitle}>Wunlan Ward</Text>
            </View>
          </View>

          <View style={styles.actionsColumn}>
            <TouchableOpacity style={styles.iconChip}>
              <Text style={styles.iconChipText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryChip}
              onPress={() => router.push('/validate')}>
              <Text style={styles.primaryChipText}>Register a Tree</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.tasksCard}
          onPress={() => router.push('/(tabs)/two')}
          activeOpacity={0.8}>
          <Text style={styles.tasksLabel}>Assigned Tasks</Text>
          <Text style={styles.tasksCount}>3 Tasks</Text>
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
                mapCenterPosition={{
                  lat: DEFAULT_LOCATION.latitude,
                  lng: DEFAULT_LOCATION.longitude,
                }}
                zoom={13}
                mapMarkers={[
                  {
                    id: '1',
                    position: {
                      lat: DEFAULT_LOCATION.latitude,
                      lng: DEFAULT_LOCATION.longitude,
                    },
                    icon: '📍',
                    size: [32, 32],
                  },
                ]}
                zoomControl={true}
                attributionControl={true}
                style={{ flex: 1, width: '100%', height: '100%' }}
                doDebug={false}
                onError={(error) => {
                  Alert.alert('Map Error', JSON.stringify(error));
                }}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  profileSubtitle: {
    fontSize: 12,
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
    fontSize: 26,
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


