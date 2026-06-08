import '@/services/locationTask'; // register background GPS task at module load
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SettingsProvider, useSettings } from '@/hooks/useSettings';
import { RunProvider } from '@/store/RunContext';

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { colors, isDark } = useSettings();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name='index' />
        <Stack.Screen
          name='run/active'
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
        <Stack.Screen name='run/summary/[id]' />
        <Stack.Screen name='history' />
        <Stack.Screen name='history/[id]' />
        <Stack.Screen name='settings' />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SFProDisplay-Regular': require('@/assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('@/assets/fonts/SFProDisplay-Medium.otf'),
    'SFProDisplay-Bold': require('@/assets/fonts/SFProDisplay-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <RunProvider>
          <AppNavigator />
        </RunProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
