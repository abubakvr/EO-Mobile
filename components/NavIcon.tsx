import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface NavIconProps {
  name: 'home' | 'schedule' | 'reports';
  focused: boolean;
  size?: number;
}

const iconMap: { [key in NavIconProps['name']]: keyof typeof Ionicons.glyphMap } = {
  home: 'home',
  schedule: 'calendar',
  reports: 'document-text',
};

export default function NavIcon({ name, focused, size = 24 }: NavIconProps) {
  const iconName = iconMap[name];
  return (
    <Ionicons
      name={iconName}
      size={size}
      color={focused ? '#FFFFFF' : '#E0E0E0'}
    />
  );
}
