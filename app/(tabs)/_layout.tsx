import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NavIcon from '@/components/NavIcon';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate bottom position: base 24px + safe area bottom inset
  // This ensures the tab bar is above system navigation on all devices
  const tabBarBottom = 24 + insets.bottom;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#E0E0E0',
        tabBarStyle: [
          styles.tabBar,
          { bottom: tabBarBottom }
        ],
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: true,
        // Hide the default header - each page has its own custom header
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <NavIcon name="home" focused={focused} size={22} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ focused }) => <NavIcon name="schedule" focused={focused} size={22} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused }) => <NavIcon name="reports" focused={focused} size={22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 32,
    right: 32,
    height: 80,
    borderRadius: 34,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    marginHorizontal: 15,
    marginBottom: 0,
    paddingBottom: 8,
    paddingTop: 8,
    // bottom is set dynamically based on safe area insets
  },
  tabBarBackground: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: '#3A3A3A',
  },
  tabItem: {
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 0,
    fontWeight: '500',
    textAlign: 'center',
  },
});
