// F&G App Theme - Colors, Typography, Spacing
export const COLORS = {
  // Brand
  brand: '#FF6B35',
  brandDark: '#E85D2A',
  brandLight: '#FFF0EB',
  
  // Accents
  accent: '#2D9CDB',
  green: '#27AE60',
  yellow: '#F2C94C',
  purple: '#9B51E0',
  red: '#EB5757',
  
  // Dark Theme Backgrounds
  dark: '#0F0F0F',
  darkCard: '#1A1A1A',
  darkCard2: '#222222',
  darkBorder: '#2A2A2A',
  darkBorder2: '#333333',
  
  // Text
  text: '#F5F5F5',
  textMuted: '#888888',
  textDim: '#555555',
  
  // Gradients
  gradient1: '#1a0a00',
  gradient2: '#000d1a',
  
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  transparent: 'transparent',
};

export const FONTS = {
  // Weights
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
};

export const SIZES = {
  // Font sizes
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  giant: 36,
  
  // Spacing
  space2: 2,
  space4: 4,
  space6: 6,
  space8: 8,
  space10: 10,
  space12: 12,
  space16: 16,
  space20: 20,
  space24: 24,
  space28: 28,
  space32: 32,
  space40: 40,
  space48: 48,
  
  // Radius
  radius4: 4,
  radius6: 6,
  radius8: 8,
  radius10: 10,
  radius12: 12,
  radius16: 16,
  radius20: 20,
  radius24: 24,
  radiusFull: 999,
  
  // Components
  buttonHeight: 52,
  inputHeight: 52,
  tabBarHeight: 60,
  headerHeight: 60,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  brand: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export default { COLORS, FONTS, SIZES, SHADOWS };
