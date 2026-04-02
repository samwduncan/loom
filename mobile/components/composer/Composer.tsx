/**
 * Composer -- chat input bar with expanding TextInput, send/stop button, and status.
 *
 * Layout: opaque surface-raised bar with border-top. GlassSurface removed —
 * its overflow:hidden + nested flex:1 was collapsing the layout and clipping
 * the send button. Blur can be re-added once layout is stable on device.
 *
 * Parent screen (ChatScreen) wraps in KeyboardAvoidingView behavior="padding",
 * so NO manual safe-area bottom padding here — KAV already accounts for it.
 * We only add insets.bottom when keyboard is NOT showing (to clear home indicator).
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComposerInput } from './ComposerInput';
import { SendButton } from './SendButton';
import { ComposerStatus } from './ComposerStatus';
import { SURFACE } from '../../lib/colors';

interface ComposerProps {
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
}

export function Composer({ isStreaming, onSendMessage, onStopStreaming }: ComposerProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
  }, [text, onSendMessage]);

  const handleStop = useCallback(() => {
    onStopStreaming();
  }, [onStopStreaming]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <ComposerInput
            value={text}
            onChangeText={setText}
            onSubmit={handleSend}
            disabled={isStreaming}
          />
        </View>
        <View style={styles.sendWrapper}>
          <SendButton
            hasText={text.trim().length > 0}
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={handleStop}
          />
        </View>
      </View>
      <ComposerStatus />
      {/* Bottom safe area — only needed to clear home indicator.
          When keyboard is open, KAV handles the offset. */}
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SURFACE.raised,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    // Depth: composer floats above content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  sendWrapper: {
    marginBottom: 2,
  },
});
