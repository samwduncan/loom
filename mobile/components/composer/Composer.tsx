/**
 * Composer -- glass backdrop chat input with expanding TextInput, send/stop button, and status bar.
 *
 * Per D-14: Glass backdrop (blur showing last messages), or opaque surface-raised fallback.
 * Per D-16: Wrapped in KeyboardStickyView from react-native-keyboard-controller for
 * perfect iOS keyboard curve matching (NOT a spring).
 * Per D-17: Glass first, fallback to opaque if performance issues on device.
 *
 * Layout:
 * - GlassSurface with border-t border-border-subtle
 * - ComposerInput (expanding, with attachment button)
 * - SendButton (positioned right of input, vertically centered)
 * - ComposerStatus (below input)
 * - Safe area bottom inset as bottom padding
 *
 * On send: clear input text, contract to single line (Standard spring).
 * During streaming: SendButton shows stop icon, input disabled.
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { GlassSurface } from '../primitives/GlassSurface';
import { ComposerInput } from './ComposerInput';
import { SendButton } from './SendButton';
import { ComposerStatus } from './ComposerStatus';

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
    <KeyboardStickyView>
      <GlassSurface
        intensity={40}
        className="rounded-none"
        style={styles.surface}
      >
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
        {/* Safe area bottom inset */}
        {insets.bottom > 0 && <View style={{ height: insets.bottom }} />}
      </GlassSurface>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)', // border-subtle
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
