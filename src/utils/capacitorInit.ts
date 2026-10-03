import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export function initCapacitorNativeHandlers(onBackPressed?: () => boolean) {
  try {
    if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
      return;
    }

    // Dismiss native splash screen safely once web view has booted
    if (Capacitor.isPluginAvailable('SplashScreen')) {
      try {
        SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
      } catch (e) {
        console.warn('SplashScreen hide skipped:', e);
      }
    }

    // Configure Status Bar on Native Mobile safely
    if (Capacitor.isPluginAvailable('StatusBar')) {
      try {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        StatusBar.setBackgroundColor({ color: '#011c14' }).catch(() => {});
      } catch (e) {
        console.warn('StatusBar configuration not available:', e);
      }
    }

    // Handle Android Hardware Back Button safely
    if (Capacitor.isPluginAvailable('App')) {
      try {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          try {
            if (onBackPressed) {
              const handled = onBackPressed();
              if (handled) return;
            }

            // Prevent accidental exiting when swiping from edges
            if (canGoBack) {
              window.history.back();
            }
            // Do not call CapApp.exitApp() on backButton event to prevent exit on edge swipes
          } catch {
            // Ignore back action error
          }
        }).catch(() => {});
      } catch (e) {
        console.warn('App backButton listener skipped:', e);
      }
    }
  } catch (err) {
    console.warn('initCapacitorNativeHandlers skipped:', err);
  }
}
