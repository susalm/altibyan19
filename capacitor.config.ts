import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.altibyan.quran',
  appName: 'مصحف التبيان الإلكتروني',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#011c14',
      style: 'DARK',
      overlaysWebView: false
    },
    ScreenOrientation: {},
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: '#011c14',
      showSpinner: false
    }
  }
};

export default config;
