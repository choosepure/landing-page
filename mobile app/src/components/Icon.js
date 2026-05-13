import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { theme } from '../theme';

/**
 * SVG icon set using react-native-svg. All icons use a 24×24 viewBox
 * scaled to the requested `size`. Stroke-based icons use `stroke={color}`
 * with `fill="none"`; fill-based icons (star, leaf, flash, check-circle)
 * use `fill={color}`.
 *
 * Usage:
 *   <Icon name="scan" size={24} color={theme.colors.primary} />
 */
function Icon({ name, size = 20, color = theme.colors.text, strokeWidth = 1.7 }) {
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'home':
      return (
        <Svg {...svgProps}>
          <Path d="M3 11 12 3l9 8v9a2 2 0 0 1-2 2h-3v-7H10v7H5a2 2 0 0 1-2-2z" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg {...svgProps}>
          <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          <Path d="M7 12h10" />
        </Svg>
      );
    case 'scan-corners':
      return (
        <Svg {...svgProps}>
          <Path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
        </Svg>
      );
    case 'flask':
      return (
        <Svg {...svgProps}>
          <Path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" />
          <Path d="M7.5 14h9" />
        </Svg>
      );
    case 'tag':
      return (
        <Svg {...svgProps}>
          <Path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
          <Circle cx="7.5" cy="7.5" r="1.5" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...svgProps}>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...svgProps}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...svgProps}>
          <Circle cx="11" cy="11" r="7" />
          <Path d="m20 20-3.5-3.5" />
        </Svg>
      );
    case 'arrow-left':
      return (
        <Svg {...svgProps}>
          <Path d="M19 12H5M12 19l-7-7 7-7" />
        </Svg>
      );
    case 'arrow-right':
      return (
        <Svg {...svgProps}>
          <Path d="M5 12h14M12 5l7 7-7 7" />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg {...svgProps}>
          <Path d="m9 6 6 6-6 6" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg {...svgProps}>
          <Path d="m6 9 6 6 6-6" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...svgProps}>
          <Path d="m5 12 5 5L20 7" />
        </Svg>
      );
    case 'check-circle':
      return (
        <Svg {...svgProps} fill={color} stroke="none">
          <Circle cx="12" cy="12" r="10" />
          <Path d="m8 12 3 3 5-6" stroke="#fff" strokeWidth={2.4} />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...svgProps}>
          <Path d="M6 6l12 12M6 18 18 6" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...svgProps}>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <Circle cx="12" cy="12" r="3" />
        </Svg>
      );
    case 'eye-off':
      return (
        <Svg {...svgProps}>
          <Path d="M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2 2.7" />
          <Path d="m14.1 14.1a3 3 0 1 1-4.2-4.2" />
          <Path d="M2 2l20 20" />
        </Svg>
      );
    case 'map-pin':
      return (
        <Svg {...svgProps}>
          <Path d="M12 21c-4-4-7-7.3-7-10a7 7 0 1 1 14 0c0 2.7-3 6-7 10z" />
          <Circle cx="12" cy="11" r="2" />
        </Svg>
      );
    case 'mail':
      return (
        <Svg {...svgProps}>
          <Rect x="3" y="5" width="18" height="14" rx="2" />
          <Path d="m3 7 9 6 9-6" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...svgProps}>
          <Path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L7.9 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.6A2 2 0 0 1 22 16.9z" />
        </Svg>
      );
    case 'flash':
      return (
        <Svg {...svgProps} fill={color} stroke="none">
          <Path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </Svg>
      );
    case 'image':
      return (
        <Svg {...svgProps}>
          <Rect x="3" y="3" width="18" height="18" rx="2" />
          <Circle cx="8.5" cy="8.5" r="1.5" />
          <Path d="m21 15-5-5L5 21" />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...svgProps}>
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 16v-4M12 8h.01" />
        </Svg>
      );
    case 'shield-check':
      return (
        <Svg {...svgProps}>
          <Path d="M12 2 4 5v6.5c0 5 3.4 9 8 10 4.6-1 8-5 8-10V5z" />
          <Path d="m9 12 2 2 4-4" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg {...svgProps} fill={color} stroke="none">
          <Path d="M11 20A7 7 0 0 1 9.8 6.6 7 7 0 0 1 21 12c0 4.4-3.6 8-8 8-1.5 0-3-.4-4-1z" />
        </Svg>
      );
    case 'gift':
      return (
        <Svg {...svgProps}>
          <Rect x="3" y="8" width="18" height="13" rx="2" />
          <Path d="M3 12h18M12 8v13M8 8a2 2 0 1 1 0-4c1 0 2 1 4 4M16 8a2 2 0 1 0 0-4c-1 0-2 1-4 4" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...svgProps} fill={color} stroke="none">
          <Path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3 1.2-6.9-5-4.9 7-1z" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...svgProps}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...svgProps}>
          <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 0 1-4 0" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...svgProps}>
          <Rect x="3" y="11" width="18" height="11" rx="2" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </Svg>
      );
    case 'help':
      return (
        <Svg {...svgProps}>
          <Circle cx="12" cy="12" r="10" />
          <Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
        </Svg>
      );
    case 'logout':
      return (
        <Svg {...svgProps}>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...svgProps}>
          <Circle cx="18" cy="5" r="3" />
          <Circle cx="6" cy="12" r="3" />
          <Circle cx="18" cy="19" r="3" />
          <Path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </Svg>
      );
    case 'sliders':
      return (
        <Svg {...svgProps}>
          <Path d="M4 21V14M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
        </Svg>
      );
    case 'warn-tri':
      return (
        <Svg {...svgProps}>
          <Path d="m10.3 3.9-8 13.6A2 2 0 0 0 4 20.5h16a2 2 0 0 0 1.7-3l-8-13.6a2 2 0 0 0-3.4 0z" />
          <Path d="M12 9v4M12 17h.01" />
        </Svg>
      );
    default:
      return null;
  }
}

export default React.memo(Icon);
