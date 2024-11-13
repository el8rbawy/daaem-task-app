import React from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

const MAIN_COLOR = '#1c6f96';
const SCREEN_OPTIONS = { headerShown: false, contentStyle: { backgroundColor: MAIN_COLOR }};

// Set current root view background
SystemUI.setBackgroundColorAsync(MAIN_COLOR);
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
   const [loaded, error] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')});

   React.useEffect(() => { if (loaded || error) SplashScreen.hideAsync(); }, [loaded, error]);
   if (!loaded && !error) return null;

   // ---
   return (<>
      <StatusBar backgroundColor={ MAIN_COLOR } style="light" />
      <Stack>
         <Stack.Screen name="index" options={ SCREEN_OPTIONS } />
         <Stack.Screen name="home" options={ SCREEN_OPTIONS } />
      </Stack>
   </>);
}