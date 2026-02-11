import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { getHumanReadableError } from '@/utils/errorHandler';
import { getBoundsForUserLocation, type BoundingBox } from '@/utils/nigerianStateBounds';

/**
 * Map Tile Service
 * Handles downloading and caching map tiles for offline use
 */

// Nigeria bounding box (full country)
const NIGERIA_BOUNDS: BoundingBox = {
  north: 13.9,
  south: 4.2,
  east: 14.7,
  west: 2.7,
};

// Zoom levels to cache (0-12)
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
 * Get all tile coordinates for a bounding box at a given zoom level
 */
function getTilesForBounds(bounds: BoundingBox, zoom: number): Array<{ x: number; y: number; z: number }> {
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  const topLeft = deg2num(bounds.north, bounds.west, zoom);
  const bottomRight = deg2num(bounds.south, bounds.east, zoom);
  const minX = Math.min(topLeft.x, bottomRight.x);
  const maxX = Math.max(topLeft.x, bottomRight.x);
  const minY = Math.min(topLeft.y, bottomRight.y);
  const maxY = Math.max(topLeft.y, bottomRight.y);
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  return tiles;
}

/** Get all tile coordinates for Nigeria at a given zoom level */
function getTilesForZoom(zoom: number): Array<{ x: number; y: number; z: number }> {
  return getTilesForBounds(NIGERIA_BOUNDS, zoom);
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
 * Download a single tile. Returns true on success (or already exists), false on failure.
 */
async function downloadTile(x: number, y: number, z: number): Promise<boolean> {
  try {
    const tilePath = getTilePath(x, y, z);
    const tileUrl = getTileUrl(x, y, z);

    try {
      const fileInfo = await FileSystem.getInfoAsync(tilePath);
      if (fileInfo.exists) return true;
    } catch {
      // continue
    }

    const dirPath = `${TILES_DIR}${z}/${x}/`;
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
    } catch {
      // continue
    }

    let retries = 2;
    let lastError: any = null;

    while (retries > 0) {
      try {
        const downloadResult = await FileSystem.downloadAsync(tileUrl, tilePath);
        if (downloadResult.status === 200) return true;
        lastError = new Error(`HTTP ${downloadResult.status}`);
      } catch (error: any) {
        lastError = error;
        const msg = error?.message || '';
        if (msg.includes('Network') || msg.includes('timeout') || msg.includes('ECONNREFUSED')) {
          if (__DEV__) console.error(`[MapTileService] Network error tile ${z}/${x}/${y}`);
          return false;
        }
      }
      retries--;
      if (retries > 0) await new Promise((r) => setTimeout(r, 1000));
    }

    if (__DEV__) console.error(`[MapTileService] Failed tile ${z}/${x}/${y}:`, lastError?.message);
    return false;
  } catch (error: any) {
    if (__DEV__) console.error(`[MapTileService] Error tile ${z}/${x}/${y}:`, error?.message);
    return false;
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
      const ok = await downloadTile(tile.x, tile.y, tile.z);
      if (ok) {
        downloadedTiles++;
        if (onProgress && (tile.z !== currentZoom || downloadedTiles % 10 === 0)) {
          if (tile.z !== currentZoom) currentZoom = tile.z;
          onProgress({ downloaded: downloadedTiles, total: totalTiles, zoom: currentZoom });
        }
      } else {
        failedTiles++;
        if (__DEV__ && failedTiles <= 5) {
          console.error(`[MapTileService] Failed tile ${tile.z}/${tile.x}/${tile.y}`);
        }
      }
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

export interface MapTilesResult {
  success: boolean;
  message: string;
  downloaded: number;
  total: number;
  stateName?: string;
}

/**
 * Download map tiles for a given bounding box (e.g. a state).
 * Never throws – returns a failed result on unexpected errors.
 */
export async function downloadMapTilesForBounds(
  bounds: BoundingBox,
  stateName?: string,
  onProgress?: (progress: { downloaded: number; total: number; zoom: number }) => void
): Promise<MapTilesResult> {
  const label = stateName ? ` for ${stateName}` : '';
  try {
    return await _downloadMapTilesForBounds(bounds, stateName, onProgress);
  } catch (err: any) {
    if (__DEV__) console.error('[MapTileService] downloadMapTilesForBounds error:', err?.message);
    return {
      success: false,
      message: `Could not download map tiles${label}. Check your connection and try again.`,
      downloaded: 0,
      total: 0,
      stateName,
    };
  }
}

async function _downloadMapTilesForBounds(
  bounds: BoundingBox,
  stateName?: string,
  onProgress?: (progress: { downloaded: number; total: number; zoom: number }) => void
): Promise<MapTilesResult> {
  const label = stateName ? ` for ${stateName}` : '';
  try {
    const baseDirInfo = await FileSystem.getInfoAsync(TILES_DIR);
    if (!baseDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(TILES_DIR, { intermediates: true });
    }
  } catch {
    // ignore
  }

  let allTiles: Array<{ x: number; y: number; z: number }> = [];
  try {
    for (const zoom of ZOOM_LEVELS) {
      allTiles.push(...getTilesForBounds(bounds, zoom));
    }
  } catch (err: any) {
    if (__DEV__) console.error('[MapTileService] Error building tile list:', err?.message);
    return {
      success: false,
      message: `Failed to prepare map tiles${label}. Please try again.`,
      downloaded: 0,
      total: 0,
      stateName,
    };
  }

  const totalTiles = allTiles.length;
  if (__DEV__) {
    console.log(`[MapTileService] Downloading ${totalTiles} tiles for ${stateName || 'bounds'}`);
  }

  let downloadedTiles = 0;
  let failedTiles = 0;
  let currentZoom = ZOOM_LEVELS[0];

  try {
    for (const tile of allTiles) {
      const ok = await downloadTile(tile.x, tile.y, tile.z);
      if (ok) {
        downloadedTiles++;
        if (onProgress && (tile.z !== currentZoom || downloadedTiles % 10 === 0)) {
          currentZoom = tile.z;
          onProgress({ downloaded: downloadedTiles, total: totalTiles, zoom: currentZoom });
        }
      } else {
        failedTiles++;
      }
      if (downloadedTiles % 50 === 0) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  } catch (err: any) {
    if (__DEV__) console.error('[MapTileService] Error during tile download:', err?.message);
    return {
      success: downloadedTiles > 0,
      message:
        downloadedTiles > 0
          ? `Downloaded ${downloadedTiles} of ${totalTiles} tiles${label}; some failed.`
          : `Failed to download map tiles${label}. Check your connection and try again.`,
      downloaded: downloadedTiles,
      total: totalTiles,
      stateName,
    };
  }

  if (onProgress) {
    onProgress({ downloaded: downloadedTiles, total: totalTiles, zoom: ZOOM_LEVELS[ZOOM_LEVELS.length - 1] });
  }

  const message =
    downloadedTiles > 0
      ? `Downloaded ${downloadedTiles} of ${totalTiles} map tiles${label}.${failedTiles > 0 ? ` ${failedTiles} failed.` : ''}`
      : `Failed to download map tiles${label}.`;

  return {
    success: downloadedTiles > 0,
    message,
    downloaded: downloadedTiles,
    total: totalTiles,
    stateName,
  };
}

/**
 * Get user's current location, determine their state (or area), and download map tiles for that region only.
 * Call this when "Sync" is pressed so offline map works for the user's state.
 * Never throws – always returns a result.
 */
export async function downloadMapTilesForUserState(
  latitude: number,
  longitude: number,
  onProgress?: (progress: { downloaded: number; total: number; zoom: number; stateName?: string }) => void
): Promise<MapTilesResult> {
  try {
    const { name: stateName, bounds } = getBoundsForUserLocation(latitude, longitude);
    if (__DEV__) {
      console.log(`[MapTileService] Downloading tiles for user state/area: ${stateName}`);
    }
    return await downloadMapTilesForBounds(bounds, stateName, (p) => onProgress?.({ ...p, stateName }));
  } catch (err: any) {
    if (__DEV__) console.error('[MapTileService] downloadMapTilesForUserState error:', err?.message);
    return {
      success: false,
      message: err?.message?.includes('Network') || err?.message?.includes('connection')
        ? 'Could not download map tiles. Check your internet connection and try again.'
        : 'Could not download map tiles for your area. Try again later.',
      downloaded: 0,
      total: 0,
    };
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
