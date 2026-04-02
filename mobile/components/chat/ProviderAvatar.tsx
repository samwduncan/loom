/**
 * ProviderAvatar -- 24px circular avatar for assistant messages.
 *
 * Per D-19: Claude gets terracotta accent color circle with "C" text.
 * Only renders for first message in a same-role group of assistant messages.
 */

import { View, Text } from 'react-native';
import { ACCENT } from '../../lib/colors';

interface ProviderAvatarProps {
  provider?: 'claude' | 'codex' | 'gemini';
  size?: number;
}

const PROVIDER_CONFIG = {
  claude: { color: ACCENT, label: 'C' },
  codex: { color: 'rgb(82, 175, 108)', label: 'X' },
  gemini: { color: 'rgb(88, 140, 210)', label: 'G' },
} as const;

export function ProviderAvatar({ provider = 'claude', size = 24 }: ProviderAvatarProps) {
  const config = PROVIDER_CONFIG[provider];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: config.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.5,
          fontWeight: '600',
          color: 'rgb(255, 255, 255)',
          fontFamily: 'Inter',
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
