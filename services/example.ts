/**
 * Example usage of the API Client
 * This file demonstrates how to use the API client throughout the app
 */

import { apiClient, ApiError, ApiResponse } from './apiClient';

// Example: Define your data types
interface Tree {
  id: string;
  name: string;
  species: string;
  location: {
    latitude: number;
    longitude: number;
  };
  custodianName?: string;
  custodianPhone?: string;
  accessibility: 'yes' | 'no';
  imageUrl?: string;
}

interface CreateTreeRequest {
  name: string;
  species: string;
  location: {
    latitude: number;
    longitude: number;
  };
  custodianName?: string;
  custodianPhone?: string;
  accessibility: 'yes' | 'no';
}

// Example: GET request - Fetch all trees
export async function fetchTrees(): Promise<Tree[]> {
  try {
    const response: ApiResponse<Tree[]> = await apiClient.get<Tree[]>('/trees');
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Failed to fetch trees:', error.message);
      throw error;
    }
    throw error;
  }
}

// Example: GET request - Fetch single tree
export async function fetchTreeById(id: string): Promise<Tree> {
  try {
    const response: ApiResponse<Tree> = await apiClient.get<Tree>(`/trees/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to fetch tree ${id}:`, error.message);
      throw error;
    }
    throw error;
  }
}

// Example: POST request - Create new tree
export async function createTree(treeData: CreateTreeRequest): Promise<Tree> {
  try {
    const response: ApiResponse<Tree> = await apiClient.post<Tree>('/trees', treeData);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Failed to create tree:', error.message);
      throw error;
    }
    throw error;
  }
}

// Example: PUT request - Update tree
export async function updateTree(id: string, updates: Partial<Tree>): Promise<Tree> {
  try {
    const response: ApiResponse<Tree> = await apiClient.put<Tree>(`/trees/${id}`, updates);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to update tree ${id}:`, error.message);
      throw error;
    }
    throw error;
  }
}

// Example: DELETE request - Delete tree
export async function deleteTree(id: string): Promise<void> {
  try {
    await apiClient.delete(`/trees/${id}`);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to delete tree ${id}:`, error.message);
      throw error;
    }
    throw error;
  }
}

// Example: File upload - Upload tree photo
export async function uploadTreePhoto(
  treeId: string,
  imageUri: string,
  onProgress?: (progress: number) => void
): Promise<{ imageUrl: string }> {
  try {
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: `tree-${treeId}-${Date.now()}.jpg`,
    };

    const response: ApiResponse<{ imageUrl: string }> = await apiClient.upload<{ imageUrl: string }>(
      `/trees/${treeId}/photo`,
      file,
      {},
      onProgress
    );

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to upload photo for tree ${treeId}:`, error.message);
      throw error;
    }
    throw error;
  }
}

// Example: Authentication - Login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response: ApiResponse<LoginResponse> = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
      { skipAuth: true } // Skip auth for login endpoint
    );

    // Set the token after successful login
    if (response.data.token) {
      apiClient.setAuthToken(response.data.token);
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Login failed:', error.message);
      throw error;
    }
    throw error;
  }
}

// Example: Logout
export function logout(): void {
  apiClient.setAuthToken(null);
  // Additional logout logic (clear storage, navigate, etc.)
}
