import { getHumanReadableError } from '@/utils/errorHandler';
import { submissionQueue, QueuedSubmission } from './submissionQueue';
import { reportService } from './reportService';
import { Platform } from 'react-native';

/**
 * Submission Sync Service
 * Handles syncing queued submissions when device comes online
 */

/**
 * Convert serialized form data back to FormData
 */
function recreateFormData(serializedData: any): FormData {
  const formData = new FormData();
  
  Object.keys(serializedData).forEach((key) => {
    const value = serializedData[key];
    
    if (value && typeof value === 'object' && value.uri) {
      // It's a file object
      formData.append(key, {
        uri: Platform.OS === 'ios' ? value.uri.replace('file://', '') : value.uri,
        type: value.type,
        name: value.name,
      } as any);
    } else if (value !== null && value !== undefined) {
      // It's a regular value
      formData.append(key, String(value));
    }
  });
  
  return formData;
}

/**
 * Submit a queued submission
 */
async function submitQueuedSubmission(submission: QueuedSubmission): Promise<{ success: boolean; error?: string }> {
  try {
    if (__DEV__) {
      console.log('[SubmissionSync] Processing submission:', submission.id, submission.type);
    }

    const formData = recreateFormData(submission.formData);

    switch (submission.type) {
      case 'register':
      case 'validate':
        await reportService.validateTree(formData);
        break;
      case 'growth_check':
        await reportService.submitGrowthStage(formData);
        break;
      case 'incident':
        await reportService.submitIncident(formData);
        break;
      default:
        throw new Error(`Unknown submission type: ${submission.type}`);
    }

    // Remove from queue on success
    try {
      await submissionQueue.removeFromQueue(submission.id);
    } catch (queueError: any) {
      if (__DEV__) {
        console.error('[SubmissionSync] Error removing from queue:', queueError);
      }
      // Continue even if removal fails
    }
    
    if (__DEV__) {
      console.log('[SubmissionSync] Successfully synced submission:', submission.id);
    }
    
    return { success: true };
  } catch (error: any) {
    const errorMessage = getHumanReadableError(error);
    
    if (__DEV__) {
      console.error('[SubmissionSync] Error syncing submission:', submission.id, errorMessage);
    }
    
    // Increment retry count
    const newRetryCount = submission.retryCount + 1;
    try {
      await submissionQueue.updateRetryCount(submission.id, newRetryCount);
    } catch (updateError: any) {
      if (__DEV__) {
        console.error('[SubmissionSync] Error updating retry count:', updateError);
      }
    }
    
    // Remove if retry count exceeds max (e.g., 5 retries)
    if (newRetryCount >= 5) {
      try {
        await submissionQueue.removeFromQueue(submission.id);
        if (__DEV__) {
          console.log('[SubmissionSync] Removed submission after max retries:', submission.id);
        }
      } catch (removeError: any) {
        if (__DEV__) {
          console.error('[SubmissionSync] Error removing failed submission:', removeError);
        }
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync all queued submissions
 */
export async function syncQueuedSubmissions(): Promise<{ success: number; failed: number; errors?: string[] }> {
  try {
    const queue = await submissionQueue.getQueue();
    
    if (queue.length === 0) {
      if (__DEV__) {
        console.log('[SubmissionSync] No queued submissions to sync');
      }
      return { success: 0, failed: 0 };
    }

    if (__DEV__) {
      console.log(`[SubmissionSync] Syncing ${queue.length} queued submissions...`);
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process submissions sequentially to avoid overwhelming the server
    for (const submission of queue) {
      try {
        const result = await submitQueuedSubmission(submission);
        if (result.success) {
          success++;
        } else {
          failed++;
          if (result.error) {
            errors.push(result.error);
          }
        }
      } catch (error: any) {
        failed++;
        const errorMessage = getHumanReadableError(error);
        errors.push(errorMessage);
        if (__DEV__) {
          console.error('[SubmissionSync] Unexpected error processing submission:', error);
        }
      }
      
      // Small delay between submissions
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (__DEV__) {
      console.log(`[SubmissionSync] Sync complete: ${success} succeeded, ${failed} failed`);
    }

    return { success, failed, errors: errors.length > 0 ? errors : undefined };
  } catch (error: any) {
    const errorMessage = getHumanReadableError(error);
    if (__DEV__) {
      console.error('[SubmissionSync] Error in syncQueuedSubmissions:', error);
    }
    throw new Error(`Failed to sync submissions: ${errorMessage}`);
  }
}

/**
 * Start automatic sync when online
 */
export function startAutoSync() {
  // This will be called when network status changes to online
  // Implementation can be enhanced with network status listener
}
