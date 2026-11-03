// lexcode-expect: 1
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.example.fieldnotes',
  appName: 'Field Notes',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
