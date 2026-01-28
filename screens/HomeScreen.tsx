import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Try to import WebView, fallback to null if not installed
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  console.log('react-native-webview not installed. Please run: npm install');
}

const HomeScreen = () => {
  // Create the map HTML that will be loaded in the iframe
  const mapIframeContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      center: [9.0765, 7.3986],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      dragging: true,
      touchZoom: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);
    
    var greenIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background-color: #23864B; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    L.marker([9.0765, 7.3986], { icon: greenIcon }).addTo(map);
  </script>
</body>
</html>
  `;

  // Encode the map HTML as a data URI
  const mapDataUri = `data:text/html;charset=utf-8,${encodeURIComponent(mapIframeContent)}`;

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe id="mapFrame" src="${mapDataUri}" allow="geolocation" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
</body>
</html>
  `;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Home</Text>

        <View style={styles.topRow}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.profileName}>Abubakar Ladan</Text>
              <Text style={styles.profileSubtitle}>Wunlan Ward</Text>
            </View>
          </View>

          <View style={styles.actionsColumn}>
            <TouchableOpacity style={styles.iconChip}>
              <Text style={styles.iconChipText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryChip}>
              <Text style={styles.primaryChipText}>Register a Tree</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tasksCard}>
          <Text style={styles.tasksLabel}>Assigned Tasks</Text>
          <Text style={styles.tasksCount}>3 Tasks</Text>
        </View>

        <View style={styles.mapCard}>
        {WebView ? (
          <WebView
            style={styles.mapImage}
            source={{ html: mapHtml }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="always"
            originWhitelist={['*']}
            setSupportMultipleWindows={false}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            cacheEnabled={true}
            incognito={false}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
            }}
            onLoadEnd={() => {
              console.log('Map loaded successfully');
            }}
            onMessage={(event) => {
              console.log('WebView message: ', event.nativeEvent.data);
            }}
          />
        ) : (
          <View style={styles.mapImage}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1500839941678-aae14dbfae9a?auto=format&fit=crop&w=800&q=80',
              }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>Install react-native-webview to see interactive map</Text>
            </View>
          </View>
        )}

        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.roundIconButton}>
            <Text style={styles.roundIconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundIconButton}>
            <Text style={styles.roundIconText}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    paddingTop: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#777777',
  },
  actionsColumn: {
    alignItems: 'flex-end',
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconChipText: {
    fontSize: 16,
  },
  primaryChip: {
    borderRadius: 18,
    backgroundColor: '#23864B',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tasksCard: {
    backgroundColor: '#23864B',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 20,
  },
  tasksLabel: {
    color: '#E0F5E9',
    fontSize: 12,
    marginBottom: 4,
  },
  tasksCount: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mapImage: {
    width: '100%',
    height: 360,
    backgroundColor: '#E0E0E0',
  },
  mapPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  mapPlaceholderText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    padding: 20,
  },
  mapActions: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    gap: 12,
    zIndex: 10,
  },
  roundIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundIconText: {
    fontSize: 18,
  },
});


