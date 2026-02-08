import { getHumanReadableError, getSubmissionErrorMessage } from '@/utils/errorHandler';
import { submissionQueue } from './submissionQueue';
import { syncQueuedSubmissions } from './submissionSync';
import { Platform } from 'react-native';

export type SubmissionType = 'register' | 'validate' | 'growth_check' | 'incident';

/**
 * Submission data structure
 * Files are stored as objects with uri, type, and name
 */
export interface SubmissionData {
  [key: string]: string | number | boolean | { uri: string; type: string; name: string };
}

/**
 * Reusable function to submit forms with offline support
 * - If online: submits immediately
 * - If offline: queues for later sync
 * 
 * @param type - Type of submission (register, validate, growth_check, incident)
 * @param endpoint - API endpoint URL
 * @param data - Form data as a plain object (files as {uri, type, name} objects)
 * @param submitFn - Function that takes FormData and submits to API
 */
export async function submitWithOfflineSupport(
  type: SubmissionType,
  endpoint: string,
  data: SubmissionData,
  submitFn: (formData: FormData) => Promise<any>
): Promise<{ success: boolean; queued: boolean; message?: string }> {
  // Check network status
  const checkNetwork = async (): Promise<boolean> => {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev.greenlegacy.ng';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch(`${API_BASE_URL}/api/`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const isOnline = await checkNetwork();

  // Convert data to FormData
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value && typeof value === 'object' && 'uri' in value) {
      // It's a file object
      const fileValue = value as { uri: string; type: string; name: string };
      formData.append(key, {
        uri: Platform.OS === 'ios' ? fileValue.uri.replace('file://', '') : fileValue.uri,
        type: fileValue.type,
        name: fileValue.name,
      } as any);
    } else if (value !== null && value !== undefined) {
      // It's a regular value
      formData.append(key, String(value));
    }
  });

  if (isOnline) {
    // Online: submit immediately
    try {
      if (__DEV__) {
        console.log(`[SubmitWithOfflineSupport] Online - submitting ${type} immediately`);
      }
      
      await submitFn(formData);
      
      // Try to sync any queued submissions in the background
      syncQueuedSubmissions().catch((error) => {
        if (__DEV__) {
          console.error('[SubmitWithOfflineSupport] Error syncing queued submissions:', error);
        }
      });
      
      return { success: true, queued: false };
    } catch (error: any) {
      // If submission fails, queue it for retry
      const errorMessage = getSubmissionErrorMessage(error, type);
      
      if (__DEV__) {
        console.log(`[SubmitWithOfflineSupport] Submission failed, queuing ${type}:`, errorMessage);
      }
      
      try {
        await submissionQueue.addToQueue({
          type,
          endpoint,
          formData: data, // Store the data structure directly
        });
        
        return {
          success: false,
          queued: true,
          message: `${errorMessage} Your submission has been queued and will be retried automatically.`,
        };
      } catch (queueError: any) {
        // If queuing also fails, return error
        return {
          success: false,
          queued: false,
          message: `${errorMessage} Failed to queue submission. Please try again.`,
        };
      }
    }
  } else {
    // Offline: queue for later
    if (__DEV__) {
      console.log(`[SubmitWithOfflineSupport] Offline - queuing ${type}`);
    }
    
    try {
      await submissionQueue.addToQueue({
        type,
        endpoint,
        formData: data, // Store the data structure directly
      });
      
      return {
        success: true,
        queued: true,
        message: 'Device is offline. Submission has been queued and will sync when online.',
      };
    } catch (error: any) {
      const errorMessage = getHumanReadableError(error);
      
      return {
        success: false,
        queued: false,
        message: `Failed to queue submission. ${errorMessage}`,
      };
    }
  }
}
