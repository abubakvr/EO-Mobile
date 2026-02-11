import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useTasksCount } from "@/hooks/useTasks";
import { useTrees } from "@/hooks/useTrees";
import { offlineStorage } from "@/services/offlineStorage";
import { submissionQueue } from "@/services/submissionQueue";
import { syncQueuedSubmissions } from "@/services/submissionSync";
import { syncService } from "@/services/syncService";
import { tokenStorage } from "@/services/tokenStorage";
import type { Tree } from "@/types/tree";
import { modifyLeafletHtmlForOffline } from "@/utils/mapHtmlModifier";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LeafletView } from "react-native-leaflet-view";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_LOCATION = {
  latitude: 9.0765,
  longitude: 7.3986,
};

function trimNameToLength(name: string, maxChars: number): string {
  if (!name?.trim()) return name;
  const s = name.trim();
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + "…";
}

const HomeScreen = () => {
  const router = useRouter();
  const [webViewContent, setWebViewContent] = useState<string | null>(null);
  const { total: tasksCount, isLoading: isLoadingTasks } = useTasksCount();
  const { logout } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [userWard, setUserWard] = useState<string>("");
  const { data: treesData, isLoading: isLoadingTrees } = useTrees({
    page_size: 100,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const { isOnline } = useNetworkStatus();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to show your position on the map. Please enable it in device settings."
        );
        setIsGettingLocation(false);
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          "Location Off",
          "Please enable location services in device settings."
        );
        setIsGettingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (
        location?.coords &&
        location.coords.latitude != null &&
        location.coords.longitude != null &&
        !isNaN(location.coords.latitude) &&
        !isNaN(location.coords.longitude)
      ) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("HomeScreen getCurrentLocation:", e);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadHtml = async () => {
      try {
        const path = require("../assets/leaflet.html");
        const asset = Asset.fromModule(path);
        await asset.downloadAsync();

        if (!asset.localUri) {
          throw new Error("Asset localUri is null");
        }

        const file = new File(asset.localUri);
        let htmlContent = await file.text();

        // Modify HTML to use cached tiles when offline
        htmlContent = await modifyLeafletHtmlForOffline(htmlContent);

        if (isMounted) {
          setWebViewContent(htmlContent);
        }
      } catch (error) {
        Alert.alert("Error loading HTML", JSON.stringify(error));
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

  // Get user location on mount so map can show and center on it
  useEffect(() => {
    let isMounted = true;
    const tryGetLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted" && isMounted) {
          const enabled = await Location.hasServicesEnabledAsync();
          if (enabled) {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
            });
            if (
              isMounted &&
              location?.coords?.latitude != null &&
              location?.coords?.longitude != null &&
              !isNaN(location.coords.latitude) &&
              !isNaN(location.coords.longitude)
            ) {
              setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }
        }
      } catch {
        // ignore
      }
    };
    const t = setTimeout(tryGetLocation, 500);
    return () => {
      isMounted = false;
      clearTimeout(t);
    };
  }, []);

  // Load sync status and queue count on mount
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const [sync, lastSyncTime, queueSize] = await Promise.all([
          offlineStorage.getSyncStatus(),
          offlineStorage.getLastSync(),
          submissionQueue.getQueueSize(),
        ]);
        if (sync?.message) {
          setSyncStatus(sync.message);
        }
        if (lastSyncTime) {
          setLastSync(lastSyncTime);
        }
        setQueuedCount(queueSize);
      } catch (error) {
        // Silently handle error
      }
    };

    loadSyncStatus();
  }, []);

  // Refresh queue count periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await submissionQueue.getQueueSize();
        setQueuedCount(count);
      } catch (error) {
        // Silently handle error
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-sync queued submissions when online
  useEffect(() => {
    if (isOnline) {
      // Small delay to ensure network is stable
      const timer = setTimeout(() => {
        syncQueuedSubmissions().catch((error) => {
          if (__DEV__) {
            console.error(
              "[HomeScreen] Error auto-syncing queued submissions:",
              error,
            );
          }
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Handle sync button press
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus("Syncing data...");

      const result = await syncService.syncAllData();

      if (result.success) {
        setSyncStatus(result.message);
        const syncTime = await offlineStorage.getLastSync();
        if (syncTime) {
          setLastSync(syncTime);
        }
        Alert.alert("Sync Successful", result.message);
      } else {
        setSyncStatus(result.message);
        Alert.alert(
          "Sync Completed with Errors",
          result.message +
            (result.errors ? "\n\nErrors:\n" + result.errors.join("\n") : ""),
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to sync data. Please try again.";
      setSyncStatus(`Error: ${errorMessage}`);
      Alert.alert("Sync Failed", errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  // Create markers: user location first, then trees
  const mapMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      position: { lat: number; lng: number };
      icon: string;
      size: [number, number];
    }> = [];

    if (userLocation) {
      markers.push({
        id: "user",
        position: {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        },
        icon: "📍",
        size: [36, 36],
      });
    }

    if (treesData?.data && Array.isArray(treesData.data)) {
      treesData.data.forEach((tree: Tree) => {
        if (tree.location && typeof tree.location === "object") {
          const lat = tree.location.latitude;
          const lng = tree.location.longitude;

          if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
            markers.push({
              id: `tree-${tree.id}`,
              position: {
                lat: lat,
                lng: lng,
              },
              icon: "🌲",
              size: [40, 40],
            });
          }
        }
      });
    }

    if (markers.length === 0) {
      markers.push({
        id: "default",
        position: {
          lat: DEFAULT_LOCATION.latitude,
          lng: DEFAULT_LOCATION.longitude,
        },
        icon: "📍",
        size: [32, 32],
      });
    }

    return markers;
  }, [treesData, userLocation]);

  // Center map on user when location is available; otherwise first tree or default
  const mapCenter = useMemo(() => {
    if (userLocation) {
      return {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      };
    }
    if (mapMarkers.length > 0 && mapMarkers[0].id !== "default") {
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
  }, [userLocation, mapMarkers]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
            {/* Network Status Indicator */}
            <View
              style={[
                styles.networkIndicator,
                isOnline
                  ? styles.networkIndicatorOnline
                  : styles.networkIndicatorOffline,
              ]}
            />
            <TouchableOpacity onPress={() => logout()}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.topRow}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.profileName}>{userName ? trimNameToLength(userName, 10) : "Loading..."}</Text>
              {userWard && (
                <Text style={styles.profileSubtitle}>{userWard}</Text>
              )}
            </View>
          </View>

          <View style={styles.actionsColumn}>
            <TouchableOpacity
              style={styles.primaryChip}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.primaryChipText}>Register a Tree</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync Button */}
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.syncSpinner}
              />
              <Text style={styles.syncButtonText}>Syncing...</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="cloud-download-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.syncButtonText}>Sync All Data</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Sync Status */}
        {syncStatus && (
          <View style={styles.syncStatusContainer}>
            <Text style={styles.syncStatusText}>{syncStatus}</Text>
            {lastSync && (
              <Text style={styles.lastSyncText}>
                Last sync: {new Date(lastSync).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Offline Reports Button */}
        <TouchableOpacity
          style={styles.offlineReportsButton}
          onPress={() => router.push("/offline-reports")}
        >
          <Ionicons name="document-text-outline" size={20} color="#2E8B57" />
          <Text style={styles.offlineReportsButtonText}>
            View Offline Reports
          </Text>
          {queuedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{queuedCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tasksCard}
          onPress={() => router.push("/(tabs)/two")}
          activeOpacity={0.8}
        >
          <Text style={styles.tasksLabel}>Assigned Tasks</Text>
          <Text style={styles.tasksCount}>
            {isLoadingTasks
              ? "Loading..."
              : `${tasksCount} ${tasksCount === 1 ? "Task" : "Tasks"}`}
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
                key={`map-${mapCenter.lat}-${mapCenter.lng}-${mapMarkers.length}`}
              />
            </View>
          )}

          <View style={styles.mapActions}>
            <TouchableOpacity style={styles.roundIconButton}>
              <Text style={styles.roundIconText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roundIconButton}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color="#2E8B57" />
              ) : (
                <Text style={styles.roundIconText}>📍</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 220,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 4,
  },
  iconButton: {
    padding: 4,
  },
  signOutText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
  },
  networkIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  networkIndicatorOnline: {
    backgroundColor: "#2E8B57",
  },
  networkIndicatorOffline: {
    backgroundColor: "#F44336",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
  },
  profileSubtitle: {
    fontSize: 10,
    color: "#777777",
  },
  actionsColumn: {
    alignItems: "flex-end",
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconChipText: {
    fontSize: 16,
  },
  primaryChip: {
    borderRadius: 18,
    backgroundColor: "#2E8B57",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tasksCard: {
    backgroundColor: "#2E8B57",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 20,
  },
  tasksLabel: {
    color: "#E0F5E9",
    fontSize: 12,
    marginBottom: 4,
  },
  tasksCount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  mapImage: {
    width: "100%",
    height: 360,
    borderWidth: 1,
    borderColor: "#6B7280",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  mapActions: {
    position: "absolute",
    right: 16,
    bottom: 24,
    gap: 12,
    zIndex: 10,
  },
  roundIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundIconText: {
    fontSize: 18,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E8B57",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncSpinner: {
    marginRight: 8,
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  syncStatusContainer: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  syncStatusText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  lastSyncText: {
    fontSize: 10,
    color: "#999",
  },
  offlineReportsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 12,
  },
  offlineReportsButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  badge: {
    backgroundColor: "#F44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
