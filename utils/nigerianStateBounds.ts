/**
 * Approximate bounding boxes for Nigerian states (latitude/longitude).
 * Used to determine the user's state from GPS and download map tiles for that state only.
 * Format: north >= south, east >= west (decimal degrees).
 */

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface StateBounds {
  name: string;
  bounds: BoundingBox;
}

// Approximate state bounds (rectangular) for Nigeria's 36 states + FCT
const NIGERIAN_STATE_BOUNDS: StateBounds[] = [
  { name: 'Abia', bounds: { north: 5.95, south: 4.85, east: 7.75, west: 7.0 } },
  { name: 'Adamawa', bounds: { north: 10.35, south: 7.45, east: 13.95, west: 11.45 } },
  { name: 'Akwa Ibom', bounds: { north: 5.25, south: 4.45, east: 8.25, west: 7.45 } },
  { name: 'Anambra', bounds: { north: 6.55, south: 5.85, east: 7.25, west: 6.55 } },
  { name: 'Bauchi', bounds: { north: 12.55, south: 9.45, east: 11.05, west: 8.75 } },
  { name: 'Bayelsa', bounds: { north: 5.25, south: 4.15, east: 6.65, west: 5.85 } },
  { name: 'Benue', bounds: { north: 8.25, south: 6.45, east: 10.25, west: 7.45 } },
  { name: 'Borno', bounds: { north: 13.95, south: 10.15, east: 14.75, west: 11.45 } },
  { name: 'Cross River', bounds: { north: 7.05, south: 4.75, east: 9.45, west: 7.75 } },
  { name: 'Delta', bounds: { north: 6.55, south: 5.15, east: 6.85, west: 5.45 } },
  { name: 'Ebonyi', bounds: { north: 6.85, south: 5.65, east: 8.35, west: 7.45 } },
  { name: 'Edo', bounds: { north: 7.75, south: 5.85, east: 6.65, west: 5.35 } },
  { name: 'Ekiti', bounds: { north: 8.05, south: 7.35, east: 5.75, west: 4.65 } },
  { name: 'Enugu', bounds: { north: 7.15, south: 5.85, east: 7.75, west: 6.35 } },
  { name: 'FCT (Abuja)', bounds: { north: 9.25, south: 8.45, east: 7.65, west: 6.75 } },
  { name: 'Gombe', bounds: { north: 11.05, south: 9.75, east: 11.95, west: 10.75 } },
  { name: 'Imo', bounds: { north: 5.95, south: 5.15, east: 7.45, west: 6.75 } },
  { name: 'Jigawa', bounds: { north: 13.05, south: 10.95, east: 10.45, west: 8.15 } },
  { name: 'Kaduna', bounds: { north: 11.25, south: 9.45, east: 8.85, west: 6.45 } },
  { name: 'Kano', bounds: { north: 12.65, south: 10.95, east: 9.25, west: 7.75 } },
  { name: 'Katsina', bounds: { north: 13.55, south: 11.45, east: 9.25, west: 6.75 } },
  { name: 'Kebbi', bounds: { north: 13.05, south: 10.15, east: 5.95, west: 3.45 } },
  { name: 'Kogi', bounds: { north: 8.55, south: 6.95, east: 7.75, west: 5.65 } },
  { name: 'Kwara', bounds: { north: 10.05, south: 7.75, east: 5.65, west: 2.65 } },
  { name: 'Lagos', bounds: { north: 6.75, south: 6.35, east: 3.75, west: 2.85 } },
  { name: 'Nasarawa', bounds: { north: 9.25, south: 7.45, east: 9.25, west: 6.95 } },
  { name: 'Niger', bounds: { north: 11.05, south: 8.45, east: 7.25, west: 4.45 } },
  { name: 'Ogun', bounds: { north: 7.55, south: 6.45, east: 4.25, west: 2.65 } },
  { name: 'Ondo', bounds: { north: 8.05, south: 5.95, east: 6.25, west: 4.45 } },
  { name: 'Osun', bounds: { north: 8.25, south: 6.95, east: 5.25, west: 3.95 } },
  { name: 'Oyo', bounds: { north: 9.25, south: 7.15, east: 4.65, west: 2.75 } },
  { name: 'Plateau', bounds: { north: 10.25, south: 8.45, east: 10.25, west: 8.45 } },
  { name: 'Rivers', bounds: { north: 5.25, south: 4.15, east: 7.55, west: 6.65 } },
  { name: 'Sokoto', bounds: { north: 13.95, south: 10.95, east: 6.25, west: 3.85 } },
  { name: 'Taraba', bounds: { north: 9.55, south: 6.45, east: 11.95, west: 9.15 } },
  { name: 'Yobe', bounds: { north: 13.55, south: 10.45, east: 12.55, west: 10.15 } },
  { name: 'Zamfara', bounds: { north: 13.25, south: 10.75, east: 7.55, west: 5.15 } },
];

/**
 * Returns the state whose bounding box contains the given point (lat, lng).
 * Nigeria is roughly 4.2°N–13.9°N, 2.7°E–14.7°E; if no state matches, returns null.
 */
export function getStateBoundsForLocation(
  latitude: number,
  longitude: number
): { name: string; bounds: BoundingBox } | null {
  for (const { name, bounds } of NIGERIAN_STATE_BOUNDS) {
    const { north, south, east, west } = bounds;
    if (latitude >= south && latitude <= north && longitude >= west && longitude <= east) {
      return { name, bounds };
    }
  }
  return null;
}

/**
 * Returns a bounding box for the user's current area.
 * If a state is found, returns that state's bounds; otherwise returns a box
 * of approximately state size (~0.6° each direction) centered on the user.
 */
export function getBoundsForUserLocation(
  latitude: number,
  longitude: number
): { name: string; bounds: BoundingBox } {
  const state = getStateBoundsForLocation(latitude, longitude);
  if (state) return state;

  const padding = 0.35; // ~state-sized fallback
  return {
    name: 'Current area',
    bounds: {
      north: Math.min(13.9, latitude + padding),
      south: Math.max(4.2, latitude - padding),
      east: Math.min(14.7, longitude + padding),
      west: Math.max(2.7, longitude - padding),
    },
  };
}
