import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Tree species data matching the design - using random Unsplash tree images
const treeSpecies = [
  {
    id: 1,
    name: 'Moringa',
    image: 'https://source.unsplash.com/400x400/?moringa,tree',
  },
  {
    id: 2,
    name: 'Eucalyptus',
    image: 'https://source.unsplash.com/400x400/?eucalyptus,tree',
  },
  {
    id: 3,
    name: 'Lemon',
    image: 'https://source.unsplash.com/400x400/?lemon,tree',
  },
  {
    id: 4,
    name: 'Locust Beans',
    image: 'https://source.unsplash.com/400x400/?tree,forest',
  },
  {
    id: 5,
    name: 'Sandal',
    image: 'https://source.unsplash.com/400x400/?tree,nature',
  },
  {
    id: 6,
    name: 'Sesbania',
    image: 'https://source.unsplash.com/400x400/?tree,green',
  },
  {
    id: 7,
    name: 'Tamarin',
    image: 'https://source.unsplash.com/400x400/?tamarind,tree',
  },
  {
    id: 8,
    name: 'Black Plum',
    image: 'https://source.unsplash.com/400x400/?plum,tree',
  },
  {
    id: 9,
    name: 'Dates',
    image: 'https://source.unsplash.com/400x400/?date,palm,tree',
  },
  {
    id: 10,
    name: 'Ficus Polita',
    image: 'https://source.unsplash.com/400x400/?ficus,tree',
  },
  {
    id: 11,
    name: 'Neem',
    image: 'https://source.unsplash.com/400x400/?neem,tree',
  },
  {
    id: 12,
    name: 'Orange',
    image: 'https://source.unsplash.com/400x400/?orange,tree',
  },
];

export default function TreeListScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular" size={18} color="#000" />
          <Ionicons name="wifi" size={18} color="#000" style={styles.statusIcon} />
          <Ionicons name="battery-full" size={18} color="#000" style={styles.statusIcon} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home/Schedule/Growth check</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Tree List</Text>
      </View>

      {/* Tree Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {treeSpecies.map((tree) => (
            <TouchableOpacity
              key={tree.id}
              style={styles.treeCard}
              onPress={() => {
                router.push({
                  pathname: '/treespecie',
                  params: {
                    specieId: tree.id.toString(),
                    specieName: tree.name,
                  },
                });
              }}
              activeOpacity={0.8}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: tree.image }} style={styles.treeImage} resizeMode="cover" />
              </View>
              <Text style={styles.treeName}>{tree.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  statusTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  signOutText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  treeCard: {
    width: '31%',
    marginBottom: 16,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  treeImage: {
    width: '100%',
    height: '100%',
  },
  treeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
});

