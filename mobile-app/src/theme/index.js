export const theme = {
  colors: {
    // Brand greens
    primary: '#226342',        // was #1F6B4E → green-800
    primaryLight: '#2D7A52',   // green-700
    primaryLighter: '#3D8862', // green-500
    primarySoft: '#5DA47B',    // green-400
    green100: '#D4E3D8',
    green50: '#EDF3EE',
    green25: '#F4F8F5',

    // Surfaces
    background: '#F5F7F4',     // cream
    cardBackground: '#FFFFFF',

    // Text
    text: '#1A201A',           // ink
    textSecondary: '#6B7268',  // ink-muted
    textDim: '#9B9F97',        // ink-dim

    // Borders
    border: '#ECEAE4',         // line
    borderSoft: '#F4F2EC',     // line-soft

    // Semantic
    error: '#D14E36',          // nutri-e (updated from #D62828)
    success: '#1E8449',        // nutri-a
    warning: '#F4C430',        // nutri-c

    // Nutri-Score
    nutriA: '#1E8449',
    nutriB: '#7CB342',
    nutriC: '#F4C430',
    nutriD: '#E89B3C',
    nutriE: '#D14E36',

    // Safety scores
    scoreGood: '#2D6B4F',
    scoreGoodBg: '#D9E8DD',
    scoreMid: '#8B6F3D',
    scoreMidBg: '#F0E5D5',
    scoreBad: '#A8482E',
    scoreBadBg: '#F4DDD4',

    // Legacy compat
    locked: '#BDBDBD',
    accent: '#8A6E4B',
  },
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    // display maps to bold (Fraunces → Inter_700Bold)
    display: 'Inter_700Bold',
  },
  fontSize: {
    '2xs': 10,
    xs: 11,
    sm: 13,
    base: 14,
    md: 15,
    lg: 17,
    xl: 19,
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
  },
  lineHeight: {
    '2xs': 14,
    xs: 16,
    sm: 19.5,
    base: 21.7,
    md: 22.5,
    lg: 23.8,
    xl: 24.7,
    '2xl': 27.5,
    '3xl': 31.2,
    '4xl': 35.2,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 10, lg: 14, xl: 18, '2xl': 24 },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    elev: {
      shadowColor: '#226342',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 4,
    },
    pop: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};
