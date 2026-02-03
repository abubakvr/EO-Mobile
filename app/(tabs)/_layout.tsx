import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import NavIcon from '@/components/NavIcon';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#E0E0E0',
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <NavIcon name="home" focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <NavIcon name="schedule" focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused }) => <NavIcon name="reports" focused={focused} size={24} />,
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
    bottom: 24,
    height: 72,
    borderRadius: 34,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    marginHorizontal: 15,
    marginBottom: 0,
  },
  tabBarBackground: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: '#3A3A3A',
  },
  tabItem: {
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
