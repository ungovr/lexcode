// lexcode-expect: 1
import { ConfigContext, ExpoConfig } from 'expo/config';

const BUNDLE_ID = process.env.EXPO_PUBLIC_BUNDLE_ID ?? 'org.example.fieldnotes';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Field Notes',
  slug: 'field-notes',
  version: '2.4.0',
  orientation: 'portrait',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  plugins: ['expo-router'],
});
