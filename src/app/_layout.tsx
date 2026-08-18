import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { RootNavigator } from '@/components/root-navigator';
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
