export const colors = {
  bg: {
    base: '#06060d',
    mid: '#0c0717',
    surface: 'rgba(10,10,14,0.54)',
    elevated: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.10)',
  },
  brand: {
    purple: '#c39fff',
    purpleRgb: '195,153,255',
    teal: '#74ddd6',
    tealRgb: '116,221,214',
  },
  text: {
    primary: 'rgba(249,244,255,0.97)',
    secondary: 'rgba(241,234,253,0.70)',
    muted: 'rgba(241,234,253,0.52)',
    faint: 'rgba(241,234,253,0.32)',
  },
  axis: {
    body:    '246,188,100',
    mind:    '116,221,214',
    heart:   '246,116,116',
    spirit:  '185,140,255',
    clarity: '185,140,255',
  },
} as const;

export type Colors = typeof colors;
