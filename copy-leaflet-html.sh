#!/bin/bash
# Script to copy leaflet.html from react-native-leaflet-view package to assets folder

if [ -f "node_modules/react-native-leaflet-view/android/src/main/assets/leaflet.html" ]; then
  cp node_modules/react-native-leaflet-view/android/src/main/assets/leaflet.html assets/leaflet.html
  echo "✅ Successfully copied leaflet.html to assets/"
else
  echo "❌ leaflet.html not found. Make sure to run 'npm install' first."
  exit 1
fi



