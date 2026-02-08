import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline Storage Service
 * Handles local caching of app data for offline functionality
 */

const STORAGE_KEYS = {
  TASKS: '@eo_mobile:tasks',
  REPORTS: '@eo_mobile:reports',
  TREES: '@eo_mobile:trees',
  SPECIES: '@eo_mobile:species',
  LAST_SYNC: '@eo_mobile:last_sync',
  SYNC_STATUS: '@eo_mobile:sync_status',
};

export interface OfflineData {
  tasks?: any;
  reports?: any;
  trees?: any;
  species?: any;
  lastSync?: string;
}

export const offlineStorage = {
  /**
   * Save tasks data
   */
  async saveTasks(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data));
    } catch (error) {
      console.error('[OfflineStorage] Error saving tasks:', error);
      throw error;
    }
  },

  /**
   * Get tasks data
   */
  async getTasks(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error getting tasks:', error);
      return null;
    }
  },

  /**
   * Save reports data
   */
  async saveReports(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data));
    } catch (error) {
      console.error('[OfflineStorage] Error saving reports:', error);
      throw error;
    }
  },

  /**
   * Get reports data
   */
  async getReports(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error getting reports:', error);
      return null;
    }
  },

  /**
   * Save trees data
   */
  async saveTrees(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TREES, JSON.stringify(data));
    } catch (error) {
      console.error('[OfflineStorage] Error saving trees:', error);
      throw error;
    }
  },

  /**
   * Get trees data
   */
  async getTrees(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TREES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error getting trees:', error);
      return null;
    }
  },

  /**
   * Save species data
   */
  async saveSpecies(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SPECIES, JSON.stringify(data));
    } catch (error) {
      console.error('[OfflineStorage] Error saving species:', error);
      throw error;
    }
  },

  /**
   * Get species data
   */
  async getSpecies(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SPECIES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error getting species:', error);
      return null;
    }
  },

  /**
   * Save last sync timestamp
   */
  async saveLastSync(timestamp: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    } catch (error) {
      console.error('[OfflineStorage] Error saving last sync:', error);
    }
  },

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('[OfflineStorage] Error getting last sync:', error);
      return null;
    }
  },

  /**
   * Save sync status
   */
  async saveSyncStatus(status: 'syncing' | 'success' | 'error', message?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify({ status, message, timestamp: new Date().toISOString() }));
    } catch (error) {
      console.error('[OfflineStorage] Error saving sync status:', error);
    }
  },

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{ status: string; message?: string; timestamp?: string } | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error getting sync status:', error);
      return null;
    }
  },

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.REPORTS,
        STORAGE_KEYS.TREES,
        STORAGE_KEYS.SPECIES,
        STORAGE_KEYS.LAST_SYNC,
        STORAGE_KEYS.SYNC_STATUS,
      ]);
    } catch (error) {
      console.error('[OfflineStorage] Error clearing data:', error);
      throw error;
    }
  },

  /**
   * Get all offline data
   */
  async getAllData(): Promise<OfflineData> {
    try {
      const [tasks, reports, trees, species, lastSync] = await Promise.all([
        this.getTasks(),
        this.getReports(),
        this.getTrees(),
        this.getSpecies(),
        this.getLastSync(),
      ]);

      return {
        tasks,
        reports,
        trees,
        species,
        lastSync: lastSync || undefined,
      };
    } catch (error) {
      console.error('[OfflineStorage] Error getting all data:', error);
      return {};
    }
  },
};
