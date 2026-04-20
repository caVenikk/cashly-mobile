import React from 'react';
import { Text } from 'react-native';
import { Icon, type IconName } from '@/src/components/Icon';

type Props = { icon: string; size?: number; color?: string };

// Category icon field is a text string. If it starts with "svg:<name>", render a
// built-in SVG icon. Otherwise render it verbatim as text (emoji).
export function CategoryIcon({ icon, size = 22, color = '#fff' }: Props) {
  if (icon.startsWith('svg:')) {
    const name = icon.slice(4) as IconName;
    return <Icon name={name} color={color} size={size} />;
  }
  return <Text style={{ fontSize: size, lineHeight: Math.round(size * 1.15) }}>{icon}</Text>;
}
