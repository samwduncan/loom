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
}

const PROVIDER_CONFIG = {
  claude: { color: ACCENT, label: 'C' },
  codex: { color: 'rgb(82, 175, 108)', label: 'X' },
  gemini: { color: 'rgb(88, 140, 210)', label: 'G' },
} as const;

export function ProviderAvatar({ provider = 'claude' }: ProviderAvatarProps) {
  const config = PROVIDER_CONFIG[provider];

  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: config.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 12,
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
