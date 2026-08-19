import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { RootNavigator } from '@/components/root-navigator';
import i18n, { initI18n } from '@/lib/i18n';
import { persistor, store } from '@/lib/store';
import { useSessionRestore } from '@/lib/store/useSessionRestore';
import { AnalyticsProvider } from '@/lib/observability/AnalyticsProvider';
import { initSentry } from '@/lib/observability/sentry';
import { ThemeOverrideProvider } from '@/lib/theme/ThemeOverrideProvider';

SplashScreen.preventAutoHideAsync();
initSentry();

function SessionRestoringNavigator() {
  useSessionRestore();
  return <RootNavigator />;
}

function RootLayout() {
  const colorScheme = useColorScheme();
  // i18n resources are bundled, but the *active* language is resolved from
  // AsyncStorage/device locale (resolveInitialLanguage) — that lookup is
  // async, so translated text can't render until it resolves. The splash
  // screen (already held open above) covers this gap.
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    void initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <AnalyticsProvider>
              <ThemeOverrideProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <BottomSheetModalProvider>
                    <AnimatedSplashOverlay />
                    <SessionRestoringNavigator />
                  </BottomSheetModalProvider>
                </ThemeProvider>
              </ThemeOverrideProvider>
            </AnalyticsProvider>
          </PersistGate>
        </Provider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
