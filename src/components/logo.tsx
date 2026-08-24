import { Text, useColorScheme, View } from 'react-native';

import Svg, { Path } from 'react-native-svg';

import { Colors, Spacing } from '@/constants/theme';

// Exact paths from nicoflow-frontend's Logo (src/components/Logo/index.tsx) —
// same mark everywhere, not a mobile-specific re-draw.
const RING = 'M49.2 20A21 21 0 1 0 49.2 44';
const FLOW = 'M20 37C27 37 27 26 34 26C40 26 41 32 47 32H56';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

export function Logo({ size = 28, showWordmark = true }: LogoProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const markColor = scheme === 'dark' ? '#818cf8' : '#4f46e5';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path d={RING} stroke={markColor} strokeWidth={5} strokeLinecap="round" />
        <Path d={FLOW} stroke={markColor} strokeWidth={5} strokeLinecap="round" />
      </Svg>
      {showWordmark && (
        <Text
          style={{
            fontSize: Math.round(size * 0.5),
            fontWeight: '600',
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: colors.text,
          }}
        >
          Nicoflow
        </Text>
      )}
    </View>
  );
}
