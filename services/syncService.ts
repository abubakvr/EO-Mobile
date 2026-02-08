import { getSyncErrorMessage } from '@/utils/errorHandler';
import { downloadNigeriaMapTiles } from './mapTileService';
import { offlineStorage } from './offlineStorage';
import { taskService } from './taskService';
import { reportService } from './reportService';
import { treeService } from './treeService';
import { speciesService } from './speciesService';
import { ApiError } from './apiClient';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    tasks?: any;
    reports?: any;
    trees?: any;
    species?: any;
  };
  errors?: string[];
}

/**
 * Sync Service
 * Fetches all app data and stores it locally for offline use
 */
export const syncService = {
  /**
   * Sync all data from the API
   * Fetches tasks, reports, trees, and species with pagination
   */
  async syncAllData(): Promise<SyncResult> {
    const errors: string[] = [];
    const syncedData: any = {};

    try {
      // Update sync status to syncing
      await offlineStorage.saveSyncStatus('syncing', 'Starting sync...');

      // Fetch all tasks (with pagination)
      try {
        if (__DEV__) {
          console.log('[SyncService] Fetching tasks...');
        }
        let allTasks: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await taskService.getTasks({ page, page_size: 100 });
          if (response.data && Array.isArray(response.data)) {
            allTasks = [...allTasks, ...response.data];
            hasMore = page * 100 < (response.total || 0);
            page++;
          } else {
            hasMore = false;
          }
        }

        const tasksData = {
          data: allTasks,
          total: allTasks.length,
          page: 1,
          page_size: allTasks.length,
        };

        await offlineStorage.saveTasks(tasksData);
        syncedData.tasks = tasksData;

        if (__DEV__) {
          console.log(`[SyncService] Fetched ${allTasks.length} tasks`);
        }
      } catch (error: any) {
        const errorMsg = `Failed to sync tasks: ${error.message || 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('[SyncService]', errorMsg);
      }

      // Fetch all reports (with pagination)
      try {
        if (__DEV__) {
          console.log('[SyncService] Fetching reports...');
        }
        let allReports: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await reportService.getReports({ page, page_size: 100 });
          if (response.data && Array.isArray(response.data)) {
            allReports = [...allReports, ...response.data];
            hasMore = page * 100 < (response.total || 0);
            page++;
          } else {
            hasMore = false;
          }
        }

        const reportsData = {
          data: allReports,
          total: allReports.length,
          page: 1,
          page_size: allReports.length,
        };

        await offlineStorage.saveReports(reportsData);
        syncedData.reports = reportsData;

        if (__DEV__) {
          console.log(`[SyncService] Fetched ${allReports.length} reports`);
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error);
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Failed to sync reports:', errorMsg);
        }
      }

      // Fetch all trees (with pagination)
      try {
        if (__DEV__) {
          console.log('[SyncService] Fetching trees...');
        }
        let allTrees: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await treeService.getTrees({ page, page_size: 100 });
          if (response.data && Array.isArray(response.data)) {
            allTrees = [...allTrees, ...response.data];
            hasMore = page * 100 < (response.total || 0);
            page++;
          } else {
            hasMore = false;
          }
        }

        const treesData = {
          data: allTrees,
          total: allTrees.length,
          page: 1,
          page_size: allTrees.length,
        };

        await offlineStorage.saveTrees(treesData);
        syncedData.trees = treesData;

        if (__DEV__) {
          console.log(`[SyncService] Fetched ${allTrees.length} trees`);
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error);
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Failed to sync trees:', errorMsg);
        }
      }

      // Fetch all species
      try {
        if (__DEV__) {
          console.log('[SyncService] Fetching species...');
        }
        const speciesResponse = await speciesService.getSpecies();
        await offlineStorage.saveSpecies(speciesResponse);
        syncedData.species = speciesResponse;

        if (__DEV__) {
          console.log(`[SyncService] Fetched ${speciesResponse.data?.length || 0} species`);
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error);
        errors.push(errorMsg);
        if (__DEV__) {
          console.error('[SyncService] Failed to sync species:', errorMsg);
        }
      }

      // Download map tiles for Nigeria
      try {
        if (__DEV__) {
          console.log('[SyncService] Downloading map tiles...');
        }
        await downloadNigeriaMapTiles((progress) => {
          if (__DEV__) {
            console.log(`[SyncService] Map tiles progress: ${progress.downloaded}/${progress.total} (zoom ${progress.zoom})`);
          }
        });
        if (__DEV__) {
          console.log('[SyncService] Map tiles downloaded successfully');
        }
      } catch (error: any) {
        const errorMsg = getSyncErrorMessage(error);
        errors.push(`Map tiles: ${errorMsg}`);
        if (__DEV__) {
          console.error('[SyncService] Failed to download map tiles:', errorMsg);
        }
      }

      // Save last sync timestamp
      const syncTimestamp = new Date().toISOString();
      await offlineStorage.saveLastSync(syncTimestamp);

      // Determine success status
      const success = errors.length === 0 || Object.keys(syncedData).length > 0;
      const message = success
        ? `Sync completed successfully. ${Object.keys(syncedData).length} data types synced.`
        : `Sync completed with ${errors.length} error(s). Some data may be incomplete.`;

      await offlineStorage.saveSyncStatus(success ? 'success' : 'error', message);

      return {
        success,
        message,
        data: syncedData,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      const errorMsg = getSyncErrorMessage(error);
      if (__DEV__) {
        console.error('[SyncService] Sync failed:', errorMsg);
      }
      await offlineStorage.saveSyncStatus('error', errorMsg);

      return {
        success: false,
        message: errorMsg,
        errors: [errorMsg],
      };
    }
  },

  /**
   * Get sync status
   */
  async getSyncStatus() {
    return await offlineStorage.getSyncStatus();
  },

  /**
   * Get last sync timestamp
   */
  async getLastSync() {
    return await offlineStorage.getLastSync();
  },
};
