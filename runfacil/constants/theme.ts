export type ThemeMode = 'light' | 'dark' | 'system';

export const lightColors = {
  bg: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#E0E0E0',
  primary: '#FF6B35',
  primaryDark: '#E55A25',
  primaryLight: '#FF8C5A',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  heartRate: '#E53935',
  pace: '#1E88E5',
  distance: '#43A047',
};

export const darkColors = {
  bg: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  text: '#F5F5F5',
  textSecondary: '#AAAAAA',
  textTertiary: '#777777',
  border: '#333333',
  primary: '#FF6B35',
  primaryDark: '#E55A25',
  primaryLight: '#FF8C5A',
  success: '#66BB6A',
  warning: '#FFA726',
  danger: '#EF5350',
  heartRate: '#EF5350',
  pace: '#42A5F5',
  distance: '#66BB6A',
};

export type Colors = typeof lightColors;
