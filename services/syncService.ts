import * as Location from 'expo-location';
import { offlineStorage } from './offlineStorage';
import { taskService } from './taskService';
import { reportService } from './reportService';
import { treeService } from './treeService';
import { speciesService } from './speciesService';
import { downloadMapTilesForUserState } from './mapTileService';
import { getSyncErrorMessage } from '@/utils/errorHandler';

export interface SyncResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Sync Service
 * Handles syncing all data from the API to local storage
 */
export const syncService = {
  /**
   * Sync all data (tasks, reports, trees, species, map tiles)
   */
  async syncAllData(): Promise<SyncResult> {
    const errors: string[] = [];
    let successCount = 0;
    const totalItems = 5; // tasks, reports, trees, species, map tiles

    try {
      // Sync Tasks
      try {
        if (__DEV__) {
          console.log('[SyncService] Syncing tasks...');
        }
        const tasks = await taskService.getTasks({ page_size: 1000 });
        await offlineStorage.saveTasks(tasks);
        successCount++;
        if (__DEV__) {
          console.log('[SyncService] Tasks synced successfully');
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error, 'tasks');
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Failed to sync tasks:', errorMsg);
        }
      }

      // Sync Reports
      try {
        if (__DEV__) {
          console.log('[SyncService] Syncing reports...');
        }
        const reports = await reportService.getReports({ page_size: 1000 });
        await offlineStorage.saveReports(reports);
        successCount++;
        if (__DEV__) {
          console.log('[SyncService] Reports synced successfully');
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error, 'reports');
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Failed to sync reports:', errorMsg);
        }
      }

      // Sync Trees
      try {
        if (__DEV__) {
          console.log('[SyncService] Syncing trees...');
        }
        const trees = await treeService.getTrees({ page_size: 1000 });
        await offlineStorage.saveTrees(trees);
        successCount++;
        if (__DEV__) {
          console.log('[SyncService] Trees synced successfully');
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error, 'trees');
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Failed to sync trees:', errorMsg);
        }
      }

      // Sync Species
      try {
        if (__DEV__) {
          console.log('[SyncService] Syncing species...');
        }
        const species = await speciesService.getSpecies();
        await offlineStorage.saveSpecies(species);
        successCount++;
        if (__DEV__) {
          console.log('[SyncService] Species synced successfully');
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error, 'species');
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Failed to sync species:', errorMsg);
        }
      }

      // Download map tiles for user's state only (using current location)
      try {
        let location: Location.LocationObject | null = null;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }
        if (location?.coords) {
          const { latitude, longitude } = location.coords;
          // Only download map tiles when user is in Nigeria (app is for Nigerian states)
          const inNigeria =
            latitude >= 4.2 && latitude <= 13.9 && longitude >= 2.7 && longitude <= 14.7;
          if (!inNigeria) {
            errors.push(
              'Map tiles skipped: location is outside Nigeria. Open the app in Nigeria to sync offline map for your state.'
            );
            if (__DEV__) {
              console.log('[SyncService] Map tiles skipped: location outside Nigeria', latitude, longitude);
            }
          } else {
            if (__DEV__) {
              console.log('[SyncService] Downloading map tiles for user state at', latitude, longitude);
            }
            const result = await downloadMapTilesForUserState(
              latitude,
              longitude,
              (progress) => {
                if (__DEV__) {
                  console.log(
                    `[MapTileService] Downloaded ${progress.downloaded}/${progress.total} tiles (${progress.stateName ?? 'area'})`
                  );
                }
              }
            );
            if (result.success) {
              successCount++;
              if (__DEV__) {
                console.log('[SyncService] Map tiles downloaded for', result.stateName ?? 'area:', result.message);
              }
            } else {
              errors.push(result.message || 'Map tiles could not be downloaded. Check your connection and try again.');
            }
          }
        } else {
          errors.push(
            'Map tiles skipped: enable location permission and try again to sync offline map for your state.'
          );
          if (__DEV__) {
            console.log('[SyncService] Map tiles skipped: no location permission or position.');
          }
        }
      } catch (error: any) {
        const errorMsg =
          error?.message?.includes('Network') || error?.message?.includes('connection')
            ? 'Map tiles: no internet connection. Check your connection and try again.'
            : 'Map tiles could not be downloaded. Try again later.';
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Map tiles error:', error?.message ?? error);
        }
      }

      // Save sync timestamp
      try {
        await offlineStorage.saveLastSync(new Date().toISOString());
      } catch (error) {
        if (__DEV__) {
          console.error('[SyncService] Failed to save sync timestamp:', error);
        }
      }

      const success = successCount > 0;
      const message = success
        ? `Successfully synced ${successCount} of ${totalItems} data types.${errors.length > 0 ? ` ${errors.length} failed.` : ''}`
        : `Failed to sync data. ${errors.length} error(s) occurred.`;

      return {
        success,
        message,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      const errorMessage = getSyncErrorMessage(error);
      if (__DEV__) {
        console.error('[SyncService] Unexpected error during sync:', error);
      }
      return {
        success: false,
        message: `Sync failed: ${errorMessage}`,
        errors: [errorMessage],
      };
    }
  },
};
