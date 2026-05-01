import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.natsu.voiceai',
  appName: 'NATSU Voice AI',
  webDir: 'dist/web',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SpeechRecognition: {
      language: 'en-US',
    },
  },
};

export default config;
