import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Modify Leaflet HTML to use cached tiles when offline
 * Injects JavaScript that checks for cached tiles before loading from network
 */
export async function modifyLeafletHtmlForOffline(htmlContent: string): Promise<string> {
  // Inject JavaScript to override tile layer to use cached tiles
  // We'll use a message-based approach to communicate with React Native
  const offlineTileScript = `
    <script>
      (function() {
        // Wait for Leaflet to be available
        var initOfflineTiles = function() {
          if (typeof L === 'undefined') {
            setTimeout(initOfflineTiles, 100);
            return;
          }
          
          // Store original createTile method
          var originalCreateTile = L.TileLayer.prototype.createTile;
          
          // Override createTile to check cache first
          L.TileLayer.prototype.createTile = function(coords, done) {
            var url = this.getTileUrl(coords);
            
            // Only intercept OpenStreetMap tiles
            if (!url || !url.indexOf('tile.openstreetmap.org') === -1) {
              return originalCreateTile.call(this, coords, done);
            }
            
            var tile = document.createElement('img');
            var self = this;
            var z = coords.z;
            var x = coords.x;
            var y = coords.y;
            
            // Try to load from cache via React Native bridge
            // Send message to React Native to check for cached tile
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CHECK_TILE_CACHE',
                tile: { z: z, x: x, y: y }
              }));
              
              // Listen for response (we'll use a timeout approach)
              // For now, try online first, cache will be used if available
            }
            
            // Try online first, but also check for offline availability
            var tryOnline = function() {
              tile.src = url;
              tile.onload = function() { 
                if (done) done(null, tile); 
              };
              tile.onerror = function() { 
                if (done) done(new Error('Failed to load tile'), tile); 
              };
            };
            
            // For offline support, we'll modify the URL to use a local path
            // React Native WebView can access files via file:// protocol
            // We'll use a simpler approach: modify the tile URL template
            var cacheUrl = 'file://' + window.location.pathname.replace(/\\/[^\\/]*$/, '') + '/map_tiles/' + z + '/' + x + '/' + y + '.png';
            
            // Try cache first with a timeout
            var cacheImg = new Image();
            var cacheTimeout = setTimeout(tryOnline, 300);
            
            cacheImg.onload = function() {
              clearTimeout(cacheTimeout);
              tile.src = cacheUrl;
              tile.onload = function() { 
                if (done) done(null, tile); 
              };
              tile.onerror = tryOnline;
            };
            
            cacheImg.onerror = function() {
              clearTimeout(cacheTimeout);
              tryOnline();
            };
            
            // Try to load from cache
            cacheImg.src = cacheUrl;
            
            return tile;
          };
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initOfflineTiles);
        } else {
          initOfflineTiles();
        }
      })();
    </script>
  `;
  
  // Insert the script before the closing body tag
  const bodyCloseIndex = htmlContent.lastIndexOf('</body>');
  if (bodyCloseIndex !== -1) {
    return htmlContent.slice(0, bodyCloseIndex) + offlineTileScript + htmlContent.slice(bodyCloseIndex);
  }
  
  // If no body tag, insert before closing html tag
  const htmlCloseIndex = htmlContent.lastIndexOf('</html>');
  if (htmlCloseIndex !== -1) {
    return htmlContent.slice(0, htmlCloseIndex) + offlineTileScript + htmlContent.slice(htmlCloseIndex);
  }
  
  // If no closing tags, append at the end
  return htmlContent + offlineTileScript;
}
