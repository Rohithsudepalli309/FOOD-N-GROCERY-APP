import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

// Keep splash visible until ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appReady, setAppReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Any async initialization (fonts, assets, etc.) goes here
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <View style={styles.container} onLayout={onLayoutRootView}>
            <StatusBar style="light" backgroundColor="#0F0F0F" />
            <RootNavigator />
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
});
