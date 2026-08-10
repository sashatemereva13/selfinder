import { useThemeStore } from '../store/themeStore';
import { darkColors, lightColors, Colors } from './colors';

export function useThemeColors(): Colors {
  const theme = useThemeStore((s) => s.theme);
  return theme === 'light' ? lightColors : darkColors;
}
