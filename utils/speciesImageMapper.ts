/**
 * Utility to map species names to local images
 * Falls back to Unsplash if image not found
 * 
 * NOTE: To use local images, rename files from .JPG to .jpg (lowercase)
 * Then uncomment the SPECIES_IMAGE_PATHS section below and update the requires
 */

import { Asset } from "expo-asset";

// Map species names to their image file paths
// Only include files that have been renamed to lowercase .jpg
// Add more as you rename the files
const SPECIES_IMAGE_PATHS: Record<string, any> = {
  'Anogeissus_Leiocarpus': require('../assets/images/specie-images/Anogeissus_Leiocarpus.jpg'),
  // Add more as you rename files from .JPG to .jpg:
  // 'Black_Plum': require('../assets/images/specie-images/Black_Plum.jpg'),
  // 'Cashew': require('../assets/images/specie-images/Cashew.jpg'),
  // 'Dates': require('../assets/images/specie-images/Dates.jpg'),
  // 'Ficus_Polita': require('../assets/images/specie-images/Ficus_Polita.jpg'),
  // 'Gmelina': require('../assets/images/specie-images/Gmelina.jpg'),
  // 'Guava': require('../assets/images/specie-images/Guava.jpg'),
  // 'Java_Plum': require('../assets/images/specie-images/Java_Plum.jpg'),
  // 'Mahogany': require('../assets/images/specie-images/Mahogany.jpg'),
  // 'Moringa': require('../assets/images/specie-images/Moringa.jpg'),
  // 'Neem': require('../assets/images/specie-images/Neem.jpg'),
  // 'Orange': require('../assets/images/specie-images/Orange.jpg'),
  // 'PawPaw': require('../assets/images/specie-images/PawPaw.jpg'),
  // 'Sandal': require('../assets/images/specie-images/Sandal.jpg'),
  // 'Scygium': require('../assets/images/specie-images/Scygium.jpg'),
  // 'Sesbania': require('../assets/images/specie-images/Sesbania.jpg'),
  // 'Syzygium': require('../assets/images/specie-images/Syzygium.jpg'),
  // 'Tamarin': require('../assets/images/specie-images/Tamarin.jpg'),
};

// Map of species names to image file names
// This handles variations in naming between API and file system
const SPECIES_IMAGE_MAP: Record<string, string> = {
  // Direct matches
  'Anogeissus Leiocarpus': 'Anogeissus_Leiocarpus',
  'Black Plum': 'Black_Plum',
  'Cashew': 'Cashew',
  'Dates': 'Dates',
  'Durumi': 'Durumi',
  'Eucalyptus': 'Eucalyptus',
  'Ficus Polita': 'Ficus_Polita',
  'Gmelina': 'Gmelina',
  'Guava': 'Guava',
  'Java Plum': 'Java_Plum',
  'Lemon': 'Lemon',
  'Locust Bean': 'Locust_Bean',
  'Locust Beans': 'Locust_Bean', // Handle plural
  'Mahogany': 'Mahogany',
  'Mango': 'Mango',
  'Moringa': 'Moringa',
  'Neem': 'Neem',
  'Orange': 'Orange',
  'PawPaw': 'PawPaw',
  'Paw Paw': 'PawPaw', // Handle space
  'Sandal': 'Sandal',
  'Scygium': 'Scygium',
  'Sesbania': 'Sesbania',
  'Syzygium': 'Syzygium',
  'Tamarin': 'Tamarin',
  'Tamarind': 'Tamarin', // Handle alternative name
};

/**
 * Normalize species name to match file naming convention
 * Converts "Black Plum" -> "Black_Plum"
 */
function normalizeSpeciesName(name: string): string {
  // First check direct map
  if (SPECIES_IMAGE_MAP[name]) {
    return SPECIES_IMAGE_MAP[name];
  }

  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(SPECIES_IMAGE_MAP)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  // Fallback: convert to file name format
  // Replace spaces with underscores, capitalize first letter of each word
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
}

/**
 * Get local image asset for a species
 * Returns the require() result if available, null otherwise
 */
function getLocalImageAsset(speciesName: string): any {
  const normalizedName = normalizeSpeciesName(speciesName);
  return SPECIES_IMAGE_PATHS[normalizedName] || null;
}

/**
 * Get local image URI for a species (async)
 * Loads the asset and returns its URI
 */
async function getLocalImageUri(speciesName: string): Promise<string | null> {
  const normalizedName = normalizeSpeciesName(speciesName);
  
  const assetModule = SPECIES_IMAGE_PATHS[normalizedName];
  if (!assetModule) {
    return null;
  }
  
  try {
    const asset = Asset.fromModule(assetModule);
    return asset.uri;
  } catch (error) {
    console.error(`Error loading image for ${speciesName}:`, error);
  }
  
  return null;
}

/**
 * Get fallback image URL for a species
 * Uses a reliable placeholder service with tree/nature theme
 */
function getUnsplashImageUrl(speciesName: string, size: string = '400x400'): string {
  // Use Lorem Picsum with a deterministic seed based on species name
  // This ensures consistent images per species
  const seed = Math.abs(speciesName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000;
  const [width, height] = size.split('x');
  // Using a nature/tree themed image service
  return `https://res.cloudinary.com/dyngfmfiz/image/upload/v1770553135/Anogeissus_Leiocarpus_zvtskc.webp`;
}

/**
 * Get image source for a species (synchronous)
 * Returns local image require() result if available, otherwise Unsplash URL
 * For React Native Image component: can return number (require result) or { uri: string }
 */
export function getSpeciesImageSource(
  speciesName: string,
  size: string = '400x400'
): number | { uri: string } {
  const localAsset = getLocalImageAsset(speciesName);
  
  if (localAsset) {
    // Return the require() result directly (number in React Native)
    return localAsset;
  }
  
  // Fallback to Unsplash
  return { uri: getUnsplashImageUrl(speciesName, size) };
}

/**
 * Get image source URI for a species (async)
 * Use this when you need the actual file URI string
 */
export async function getSpeciesImageUri(
  speciesName: string,
  size: string = '400x400'
): Promise<string> {
  const localUri = await getLocalImageUri(speciesName);
  
  if (localUri) {
    return localUri;
  }
  
  // Fallback to Unsplash
  return getUnsplashImageUrl(speciesName, size);
}


/**
 * Check if a local image exists for a species
 */
export function hasLocalSpeciesImage(speciesName: string): boolean {
  return getLocalImageAsset(speciesName) !== null;
}
