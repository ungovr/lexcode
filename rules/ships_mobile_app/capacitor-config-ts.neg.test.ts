// lexcode-expect: 0
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
