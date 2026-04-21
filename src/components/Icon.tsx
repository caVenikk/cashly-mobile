import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export type IconProps = { color?: string; size?: number };
export type IconName =
  | 'home'
  | 'bolt'
  | 'repeat'
  | 'target'
  | 'grid'
  | 'plus'
  | 'coffee'
  | 'cart'
  | 'car'
  | 'bag'
  | 'film'
  | 'house'
  | 'heart'
  | 'plane'
  | 'gift'
  | 'cards'
  | 'briefcase'
  | 'wifi'
  | 'music'
  | 'cloud'
  | 'play'
  | 'check'
  | 'arrow'
  | 'chevRight'
  | 'chevLeft'
  | 'close'
  | 'calendar'
  | 'dots'
  | 'search'
  | 'bell'
  | 'filter'
  | 'trash'
  | 'flash'
  | 'lang'
  | 'sun'
  | 'moon'
  | 'face'
  | 'scan'
  | 'send'
  | 'stack'
  | 'triangleUp'
  | 'triangleDown';

export function Icon({ name, color = 'currentColor', size = 22 }: IconProps & { name: IconName }) {
  const s = size;
  const c = color;
  switch (name) {
    case 'home':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6H10v6H5a2 2 0 01-2-2v-9z"
            stroke={c}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'bolt':
    case 'flash':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
        </Svg>
      );
    case 'repeat':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'target':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={1.8} />
          <Circle cx={12} cy={12} r={5} stroke={c} strokeWidth={1.8} />
          <Circle cx={12} cy={12} r={1.8} fill={c} />
        </Svg>
      );
    case 'grid':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={3} width={7} height={7} rx={2} stroke={c} strokeWidth={1.8} />
          <Rect x={14} y={3} width={7} height={7} rx={2} stroke={c} strokeWidth={1.8} />
          <Rect x={3} y={14} width={7} height={7} rx={2} stroke={c} strokeWidth={1.8} />
          <Rect x={14} y={14} width={7} height={7} rx={2} stroke={c} strokeWidth={1.8} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      );
    case 'coffee':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 8h13v7a5 5 0 01-5 5H9a5 5 0 01-5-5V8zM17 10h2a3 3 0 010 6h-2M7 2v3M11 2v3M15 2v3"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'cart':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 3h2l2.5 12h12L22 7H6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={9} cy={20} r={1.5} fill={c} />
          <Circle cx={18} cy={20} r={1.5} fill={c} />
        </Svg>
      );
    case 'car':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 13l2-6a2 2 0 012-1h10a2 2 0 012 1l2 6v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z"
            stroke={c}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Circle cx={7} cy={14} r={1.2} fill={c} />
          <Circle cx={17} cy={14} r={1.2} fill={c} />
        </Svg>
      );
    case 'bag':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 7h16l-1 13a1 1 0 01-1 1H6a1 1 0 01-1-1L4 7z"
            stroke={c}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Path d="M8 7V5a4 4 0 118 0v2" stroke={c} strokeWidth={1.8} />
        </Svg>
      );
    case 'film':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={4} width={18} height={16} rx={3} stroke={c} strokeWidth={1.8} />
          <Path d="M3 9h3M3 15h3M18 9h3M18 15h3M8 4v16M16 4v16" stroke={c} strokeWidth={1.6} />
        </Svg>
      );
    case 'house':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z"
            stroke={c}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11z"
            stroke={c}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'plane':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 11l-7-1-4-7-2 1 2 7-6 2v2l6-1 2 5-1 2h2l3-5 6 2v-2l-1-5z"
            stroke={c}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'gift':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={8} width={18} height={4} rx={1} stroke={c} strokeWidth={1.8} />
          <Path
            d="M5 12v8a1 1 0 001 1h12a1 1 0 001-1v-8M12 8v13M8 8a3 3 0 010-6c2 0 4 4 4 6M16 8a3 3 0 000-6c-2 0-4 4-4 6"
            stroke={c}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'cards':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={6} width={20} height={13} rx={3} stroke={c} strokeWidth={1.8} />
          <Path d="M2 10h20M6 15h4" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'briefcase':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={7} width={18} height={13} rx={2} stroke={c} strokeWidth={1.8} />
          <Path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" stroke={c} strokeWidth={1.8} />
        </Svg>
      );
    case 'wifi':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M2 9a15 15 0 0120 0M5 13a10 10 0 0114 0M8 17a5 5 0 018 0"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={20} r={1} fill={c} />
        </Svg>
      );
    case 'music':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18V5l12-2v13" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
          <Circle cx={6} cy={18} r={3} stroke={c} strokeWidth={1.8} />
          <Circle cx={18} cy={16} r={3} stroke={c} strokeWidth={1.8} />
        </Svg>
      );
    case 'cloud':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 18a5 5 0 01-1-9.9 6 6 0 0111.7 1.5A4 4 0 0117 18H7z"
            stroke={c}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'play':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <Path d="M7 5v14l12-7z" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12l5 5L20 7" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14m-5-5l5 5-5 5" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevRight':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M9 6l6 6-6 6" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevLeft':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M15 6l-6 6 6 6" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={5} width={18} height={16} rx={3} stroke={c} strokeWidth={1.8} />
          <Path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'dots':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <Circle cx={5} cy={12} r={2} />
          <Circle cx={12} cy={12} r={2} />
          <Circle cx={19} cy={12} r={2} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={c} strokeWidth={1.8} />
          <Path d="M20 20l-4-4" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'filter':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 6h16M7 12h10M10 18h4" stroke={c} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'lang':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={1.8} />
          <Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke={c} strokeWidth={1.6} />
        </Svg>
      );
    case 'sun':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4} stroke={c} strokeWidth={1.8} />
          <Path
            d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M20 14A8 8 0 1110 4a7 7 0 0010 10z" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      );
    case 'face':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={1.8} />
          <Circle cx={9} cy={10} r={1} fill={c} />
          <Circle cx={15} cy={10} r={1} fill={c} />
          <Path d="M8 15c1.2 1.4 2.6 2 4 2s2.8-.6 4-2" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M3 12h18"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'send':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 12h16m-4-5l5 5-5 5M20 18v3M4 18v3"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'stack':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={15} width={16} height={4} rx={2} stroke={c} strokeWidth={1.8} />
          <Rect x={4} y={10} width={16} height={4} rx={2} stroke={c} strokeWidth={1.8} />
          <Rect x={4} y={5} width={16} height={4} rx={2} stroke={c} strokeWidth={1.8} />
        </Svg>
      );
    case 'triangleUp':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <Path d="M12 4l8 10H4z" />
        </Svg>
      );
    case 'triangleDown':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <Path d="M12 20l8-10H4z" />
        </Svg>
      );
    default:
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <G />
        </Svg>
      );
  }
}
