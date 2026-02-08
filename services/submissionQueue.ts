import { getHumanReadableError } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Submission Queue Service
 * Handles queuing of form submissions when offline and syncing when online
 */

const QUEUE_KEY = '@eo_mobile:submission_queue';

export interface QueuedSubmission {
  id: string;
  type: 'register' | 'validate' | 'growth_check' | 'incident';
  endpoint: string;
  formData: any; // Store FormData as serializable object
  timestamp: string;
  retryCount: number;
}

export const submissionQueue = {
  /**
   * Add a submission to the queue
   */
  async addToQueue(submission: Omit<QueuedSubmission, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newSubmission: QueuedSubmission = {
        ...submission,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };
      queue.push(newSubmission);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      
      if (__DEV__) {
        console.log('[SubmissionQueue] Added to queue:', newSubmission.id, newSubmission.type);
      }
    } catch (error: any) {
      const errorMessage = getHumanReadableError(error);
      console.error('[SubmissionQueue] Error adding to queue:', errorMessage);
      throw new Error(`Failed to save submission: ${errorMessage}`);
    }
  },

  /**
   * Get all queued submissions
   */
  async getQueue(): Promise<QueuedSubmission[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SubmissionQueue] Error getting queue:', error);
      return [];
    }
  },

  /**
   * Remove a submission from the queue
   */
  async removeFromQueue(submissionId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter((item) => item.id !== submissionId);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
      
      if (__DEV__) {
        console.log('[SubmissionQueue] Removed from queue:', submissionId);
      }
    } catch (error: any) {
      const errorMessage = getHumanReadableError(error);
      console.error('[SubmissionQueue] Error removing from queue:', errorMessage);
      throw new Error(`Failed to remove submission: ${errorMessage}`);
    }
  },

  /**
   * Update retry count for a submission
   */
  async updateRetryCount(submissionId: string, retryCount: number): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updated = queue.map((item) =>
        item.id === submissionId ? { ...item, retryCount } : item
      );
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[SubmissionQueue] Error updating retry count:', error);
    }
  },

  /**
   * Clear all queued submissions
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
      if (__DEV__) {
        console.log('[SubmissionQueue] Queue cleared');
      }
    } catch (error: any) {
      const errorMessage = getHumanReadableError(error);
      console.error('[SubmissionQueue] Error clearing queue:', errorMessage);
      throw new Error(`Failed to clear queue: ${errorMessage}`);
    }
  },

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },
};
