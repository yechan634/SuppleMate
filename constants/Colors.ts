/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#7dd3c6';
const tintColorDark = '#7dd3c6';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#7dd3c6',
    secondary: '#5cb3a1',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#f44336',
    cardBackground: '#f8f9fa',
    border: '#E0E0E0',
    link: '#0a7ea4',
    secondaryText: '#666666',
    placeholder: '#999999',
  },
  dark: {
    text: '#FFFFFF',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#7dd3c6',
    secondary: '#5cb3a1',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#f44336',
    cardBackground: '#2a2d30',
    border: '#404040',
    link: '#64B5F6',
    secondaryText: '#CCCCCC',
    placeholder: '#888888',
  },
};
