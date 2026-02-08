import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { getHumanReadableError } from '@/utils/errorHandler';

/**
 * Map Tile Service
 * Handles downloading and caching map tiles for offline use
 */

// Nigeria bounding box
const NIGERIA_BOUNDS = {
  north: 13.9,
  south: 4.2,
  east: 14.7,
  west: 2.7,
};

// Zoom levels to cache (0-12 covers entire country)
const ZOOM_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Map tile server (OpenStreetMap)
const TILE_SERVER = 'https://tile.openstreetmap.org';

// Local storage directory for tiles
const TILES_DIR = `${FileSystem.documentDirectory}map_tiles/`;

/**
 * Convert lat/lng to tile coordinates
 */
function deg2num(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Get all tile coordinates for Nigeria at a given zoom level
 */
function getTilesForZoom(zoom: number): Array<{ x: number; y: number; z: number }> {
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  
  const topLeft = deg2num(NIGERIA_BOUNDS.north, NIGERIA_BOUNDS.west, zoom);
  const bottomRight = deg2num(NIGERIA_BOUNDS.south, NIGERIA_BOUNDS.east, zoom);
  
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
}

/**
 * Get tile file path
 */
function getTilePath(x: number, y: number, z: number): string {
  return `${TILES_DIR}${z}/${x}/${y}.png`;
}

/**
 * Get tile URL
 */
function getTileUrl(x: number, y: number, z: number): string {
  return `${TILE_SERVER}/${z}/${x}/${y}.png`;
}

/**
 * Download a single tile
 */
async function downloadTile(x: number, y: number, z: number): Promise<void> {
  try {
    const tilePath = getTilePath(x, y, z);
    const tileUrl = getTileUrl(x, y, z);
    
    // Check if tile already exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(tilePath);
      if (fileInfo.exists) {
        return; // Already downloaded
      }
    } catch (checkError) {
      // File doesn't exist, continue with download
    }
    
    // Create directory if it doesn't exist
    const dirPath = `${TILES_DIR}${z}/${x}/`;
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
    } catch (dirError) {
      // Directory creation failed, but continue
    }
    
    // Download tile with retry logic
    let retries = 2;
    let lastError: any = null;
    
    while (retries > 0) {
      try {
        // Use FileSystem.downloadAsync which handles the download and file writing
        const downloadResult = await FileSystem.downloadAsync(tileUrl, tilePath);
        
        if (downloadResult.status === 200) {
          return; // Success
        } else {
          throw new Error(`HTTP ${downloadResult.status}: Failed to download tile ${z}/${x}/${y} from ${tileUrl}`);
        }
      } catch (error: any) {
        lastError = error;
        retries--;
        
        // Check if it's a network error
        const errorMsg = error?.message || '';
        if (errorMsg.includes('Network') || errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED')) {
          // Network error - don't retry, just throw
          throw new Error(`Network error downloading map tile: ${errorMsg}`);
        }
        
        if (retries > 0) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    
    // All retries failed - throw a more descriptive error
    const errorMsg = lastError?.message || `Failed to download tile ${z}/${x}/${y}`;
    throw new Error(`Map tile download failed after retries: ${errorMsg}`);
  } catch (error: any) {
    // Silently fail for individual tiles - we'll continue with others
    if (__DEV__) {
      console.error(`[MapTileService] Error downloading tile ${z}/${x}/${y}:`, error.message);
    }
    throw error;
  }
}

/**
 * Download all tiles for Nigeria
 */
export async function downloadNigeriaMapTiles(
  onProgress?: (progress: { downloaded: number; total: number; zoom: number }) => void
): Promise<{ success: boolean; message: string; downloaded: number; total: number }> {
  try {
    // Create base directory
    try {
      const baseDirInfo = await FileSystem.getInfoAsync(TILES_DIR);
      if (!baseDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(TILES_DIR, { intermediates: true });
      }
    } catch (dirError: any) {
      // Directory might already exist or creation failed
      if (__DEV__) {
        console.log('[MapTileService] Directory check/create:', dirError.message);
      }
    }
    
    let totalTiles = 0;
    let downloadedTiles = 0;
    const allTiles: Array<{ x: number; y: number; z: number }> = [];
    
    // Collect all tiles
    for (const zoom of ZOOM_LEVELS) {
      const tiles = getTilesForZoom(zoom);
      allTiles.push(...tiles);
      totalTiles += tiles.length;
    }
    
    if (__DEV__) {
      console.log(`[MapTileService] Total tiles to download: ${totalTiles}`);
    }
    
    // Download tiles with progress updates
    let currentZoom = ZOOM_LEVELS[0];
    let failedTiles = 0;
    
    for (const tile of allTiles) {
      try {
        await downloadTile(tile.x, tile.y, tile.z);
        downloadedTiles++;
        
        // Update progress every 10 tiles or on zoom change
        if (onProgress && (tile.z !== currentZoom || downloadedTiles % 10 === 0)) {
          if (tile.z !== currentZoom) {
            currentZoom = tile.z;
          }
          onProgress({ downloaded: downloadedTiles, total: totalTiles, zoom: currentZoom });
        }
      } catch (error: any) {
        failedTiles++;
        // Continue with next tile - don't fail entire sync for individual tile failures
        if (__DEV__ && failedTiles <= 5) {
          console.error(`[MapTileService] Failed to download tile ${tile.z}/${tile.x}/${tile.y}:`, error.message);
        }
      }
      
      // Small delay to avoid overwhelming the server (every 50 tiles)
      if (downloadedTiles % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    
    if (onProgress) {
      onProgress({ downloaded: downloadedTiles, total: totalTiles, zoom: ZOOM_LEVELS[ZOOM_LEVELS.length - 1] });
    }
    
    const success = downloadedTiles > 0;
    const message = success
      ? `Downloaded ${downloadedTiles} of ${totalTiles} map tiles for Nigeria.${failedTiles > 0 ? ` ${failedTiles} tiles failed.` : ''}`
      : `Failed to download map tiles. ${failedTiles} tiles failed.`;
    
    if (__DEV__) {
      console.log(`[MapTileService] Download complete: ${downloadedTiles} succeeded, ${failedTiles} failed out of ${totalTiles} total`);
    }
    
    return {
      success,
      message,
      downloaded: downloadedTiles,
      total: totalTiles,
    };
  } catch (error: any) {
    const errorMessage = getHumanReadableError(error);
    if (__DEV__) {
      console.error('[MapTileService] Error downloading map tiles:', errorMessage, error);
    }
    throw new Error(`Failed to download map tiles: ${errorMessage}`);
  }
}

/**
 * Check if map tiles are cached
 */
export async function hasCachedMapTiles(): Promise<boolean> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TILES_DIR);
    if (!dirInfo.exists) {
      return false;
    }
    
    // Check if at least one zoom level exists
    for (const zoom of ZOOM_LEVELS) {
      const zoomDir = `${TILES_DIR}${zoom}/`;
      try {
        const zoomInfo = await FileSystem.getInfoAsync(zoomDir);
        if (zoomInfo.exists) {
          return true;
        }
      } catch {
        // Continue checking other zoom levels
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get local tile URL for use in Leaflet
 */
export function getLocalTileUrl(x: number, y: number, z: number): string {
  // For React Native WebView, we need to use a special protocol
  // The HTML will handle loading from cache
  const tilePath = getTilePath(x, y, z);
  // Return a path that the HTML can use to load from cache
  return `local://tile/${z}/${x}/${y}.png`;
}

/**
 * Check if a specific tile exists
 */
export async function tileExists(x: number, y: number, z: number): Promise<boolean> {
  try {
    const tilePath = getTilePath(x, y, z);
    const fileInfo = await FileSystem.getInfoAsync(tilePath);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

/**
 * Get tile file URI for use in HTML
 */
export async function getTileFileUri(x: number, y: number, z: number): Promise<string | null> {
  try {
    const tilePath = getTilePath(x, y, z);
    const fileInfo = await FileSystem.getInfoAsync(tilePath);
    if (fileInfo.exists) {
      // Return the file URI that can be used in WebView
      return Platform.OS === 'ios' 
        ? tilePath.replace(FileSystem.documentDirectory!, 'file://')
        : `file://${tilePath}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear cached map tiles
 */
export async function clearMapTiles(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TILES_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(TILES_DIR, { idempotent: true });
    }
  } catch (error: any) {
    const errorMessage = getHumanReadableError(error);
    throw new Error(`Failed to clear map tiles: ${errorMessage}`);
  }
}
