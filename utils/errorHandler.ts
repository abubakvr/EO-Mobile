import { ApiError } from '@/services/apiClient';

/**
 * Convert error to human-readable message
 */
export function getHumanReadableError(error: any): string {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an ApiError, use its message
  if (error instanceof ApiError) {
    return error.message;
  }

  // If it has a message property
  if (error?.message) {
    const message = error.message;

    // Network errors
    if (message.includes('Network request failed') || message.includes('NetworkError')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (message.includes('timeout') || message.includes('ECONNABORTED')) {
      return 'The request took too long. Please check your connection and try again.';
    }

    if (message.includes('Unable to resolve host') || message.includes('ENOTFOUND')) {
      return 'Cannot reach the server. Please check your internet connection.';
    }

    if (message.includes('Failed to fetch') || message.includes('ERR_INTERNET_DISCONNECTED')) {
      return 'No internet connection. Please connect to the internet and try again.';
    }

    // Storage errors
    if (message.includes('AsyncStorage') || message.includes('storage')) {
      return 'Failed to save data locally. Please try again.';
    }

    // Map tile download errors
    if (message.includes('tile') || message.includes('map') || message.includes('download')) {
      if (message.includes('HTTP') || message.includes('Failed to download')) {
        return 'Failed to download map tiles. Please check your internet connection and try again.';
      }
      return 'Failed to process map tiles. Please try again.';
    }

    // File errors (but not map tiles)
    if ((message.includes('file') || message.includes('image') || message.includes('photo')) 
        && !message.includes('tile') && !message.includes('map')) {
      return 'There was an issue with the file. Please try selecting it again.';
    }

    // Location errors
    if (message.includes('location') || message.includes('Location')) {
      return 'Unable to get your location. Please enable location services and try again.';
    }

    // Permission errors
    if (message.includes('permission') || message.includes('Permission')) {
      return 'Permission denied. Please enable the required permissions in settings.';
    }

    // Validation errors
    if (message.includes('required') || message.includes('missing')) {
      return 'Please fill in all required fields.';
    }

    // Server errors (4xx, 5xx)
    if (message.includes('400') || message.includes('Bad Request')) {
      return 'Invalid data provided. Please check your input and try again.';
    }

    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }

    if (message.includes('403') || message.includes('Forbidden')) {
      return 'You do not have permission to perform this action.';
    }

    if (message.includes('404') || message.includes('Not Found')) {
      return 'The requested resource was not found.';
    }

    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Server error occurred. Please try again later.';
    }

    if (message.includes('502') || message.includes('Bad Gateway')) {
      return 'Server is temporarily unavailable. Please try again later.';
    }

    if (message.includes('503') || message.includes('Service Unavailable')) {
      return 'Service is temporarily unavailable. Please try again later.';
    }

    // Return the original message if no pattern matches
    return message;
  }

  // If it's an object with error property
  if (error?.error) {
    return getHumanReadableError(error.error);
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get user-friendly error message for submission errors
 */
export function getSubmissionErrorMessage(error: any, submissionType: string): string {
  const baseMessage = getHumanReadableError(error);

  // Add context based on submission type
  const typeLabels: Record<string, string> = {
    register: 'registering the tree',
    validate: 'validating the tree',
    growth_check: 'submitting the growth check',
    incident: 'reporting the incident',
  };

  const action = typeLabels[submissionType] || 'submitting';

  // If the error already mentions the action, return as is
  if (baseMessage.toLowerCase().includes(action)) {
    return baseMessage;
  }

  // Otherwise, prepend context
  return `Failed to ${action}. ${baseMessage}`;
}

/**
 * Get user-friendly error message for sync errors
 */
export function getSyncErrorMessage(error: any): string {
  const baseMessage = getHumanReadableError(error);

  if (baseMessage.includes('sync') || baseMessage.includes('Sync')) {
    return baseMessage;
  }

  return `Failed to sync data. ${baseMessage}`;
}
