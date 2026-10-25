// Plain-JS mirror of the Tailwind theme. Use these in inline styles, charts, etc.

export const colors = {
  green: {
    25: '#F4F8F5', 50: '#EDF3EE', 100: '#D4E3D8',
    400: '#5DA47B', 500: '#3D8862', 700: '#2D7A52',
    800: '#226342', 900: '#1B4332',
  },
  cream: '#F5F7F4',
  ink:        '#1A201A',
  inkMuted:   '#6B7268',
  inkDim:     '#9B9F97',
  border:     '#ECEAE4',
  borderSoft: '#F4F2EC',
  nutri: { a: '#1E8449', b: '#7CB342', c: '#F4C430', d: '#E89B3C', e: '#D14E36' },
};

export const fonts = {
  display: 'Fraunces, ui-serif, Georgia, serif',
  sans:    'Inter, ui-sans-serif, system-ui, sans-serif',
};

export const radius = { sm: 8, md: 10, lg: 14, xl: 18, '2xl': 24 };

export const shadow = {
  card: '0 1px 3px rgba(0,0,0,0.04)',
  elev: '0 4px 12px rgba(34,99,66,0.18)',
  pop:  '0 8px 24px rgba(0,0,0,0.12)',
};

export const NUTRI_GRADES = [
  { grade: 'A', count: 342, bg: colors.nutri.a, text: '#fff',     label: 'Excellent' },
  { grade: 'B', count: 528, bg: colors.nutri.b, text: '#fff',     label: 'Good' },
  { grade: 'C', count: 416, bg: colors.nutri.c, text: '#1A201A',  label: 'Fair' },
  { grade: 'D', count: 287, bg: colors.nutri.d, text: '#fff',     label: 'Poor' },
  { grade: 'E', count: 154, bg: colors.nutri.e, text: '#fff',     label: 'Avoid' },
];
