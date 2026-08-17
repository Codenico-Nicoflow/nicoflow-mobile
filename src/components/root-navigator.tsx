import { Stack } from 'expo-router';

import { useAppUser } from '@/lib/store';

// Auth guard: mirrors nicoflow-frontend's PrivateRoutes (reads the Redux auth
// slice's user, not a token check — the token is memory-only and refreshed
// reactively by baseQueryWithReauth). Expo Router's <Stack.Protected> switches
// the whole (tabs)/(auth) group based on this condition; unlike React Router
// there's no separate redirect step to write.
export function RootNavigator() {
  const user = useAppUser();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
