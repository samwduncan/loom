/**
 * Markdown PoC evaluation screen.
 *
 * Tests react-native-enriched-markdown with:
 * 1. Simulated streaming (character-by-character at 50ms intervals)
 * 2. Static rendering of a comprehensive test string
 * 3. FPS counter via requestAnimationFrame
 *
 * GFM table, headings, bold, italic, code blocks, lists, blockquotes,
 * links, horizontal rule -- all tested.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MarkdownRendererPoC } from '../../components/chat/MarkdownRendererPoC';
import { MarkdownRenderer } from '../../components/chat/MarkdownRenderer';

// Comprehensive test markdown covering all D-02 elements
const TEST_MARKDOWN = `# Heading 1

## Heading 2

### Heading 3

This is a paragraph with **bold text**, *italic text*, and \`inline code\`. Here is some more text to fill out the paragraph and test line wrapping behavior across multiple lines of content.

- First bullet item
- Second bullet item with **bold**
- Third bullet item with \`code\`

1. First numbered item
2. Second numbered item
3. Third numbered item

\`\`\`typescript
interface Config {
  name: string;
  value: number;
  enabled: boolean;
}

const config: Config = {
  name: "loom",
  value: 42,
  enabled: true,
};
\`\`\`

> This is a blockquote with some wisdom.
> It spans multiple lines to test rendering.

| Feature | Status | Priority |
|---------|--------|----------|
| Streaming | Working | High |
| Tables | Supported | Medium |
| Code blocks | Basic | High |

---

[Example link](https://example.com)

Here is a final paragraph with approximately one hundred words of content to test how the renderer handles longer text blocks. The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;

export default function MarkdownPoCScreen() {
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showProduction, setShowProduction] = useState(false);
  const [fps, setFps] = useState(0);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamIndexRef = useRef(0);
  const fpsFrameCountRef = useRef(0);
  const fpsLastTimeRef = useRef(0);
  const fpsRafRef = useRef<number | null>(null);

  // FPS counter using requestAnimationFrame
  const measureFps = useCallback((time: number) => {
    fpsFrameCountRef.current++;
    if (time - fpsLastTimeRef.current >= 1000) {
      setFps(fpsFrameCountRef.current);
      fpsFrameCountRef.current = 0;
      fpsLastTimeRef.current = time;
    }
    fpsRafRef.current = requestAnimationFrame(measureFps);
  }, []);

  useEffect(() => {
    fpsRafRef.current = requestAnimationFrame(measureFps);
    return () => {
      if (fpsRafRef.current !== null) {
        cancelAnimationFrame(fpsRafRef.current);
      }
    };
  }, [measureFps]);

  const startStreaming = useCallback(() => {
    // Reset
    setStreamContent('');
    streamIndexRef.current = 0;
    setIsStreaming(true);

    const tick = () => {
      if (streamIndexRef.current >= TEST_MARKDOWN.length) {
        setIsStreaming(false);
        streamTimerRef.current = null;
        return;
      }
      streamIndexRef.current++;
      setStreamContent(TEST_MARKDOWN.slice(0, streamIndexRef.current));
      streamTimerRef.current = setTimeout(tick, 50);
    };
    tick();
  }, []);

  const stopStreaming = useCallback(() => {
    if (streamTimerRef.current !== null) {
      clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setIsStreaming(false);
    setStreamContent(TEST_MARKDOWN);
  }, []);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current !== null) {
        clearTimeout(streamTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(46, 42, 40)' }} edges={['bottom']}>
      {/* FPS counter */}
      <View style={{
        position: 'absolute',
        top: 8,
        right: 16,
        zIndex: 10,
        backgroundColor: fps >= 55 ? 'rgba(82, 175, 108, 0.8)' : fps >= 30 ? 'rgba(196, 108, 88, 0.8)' : 'rgba(210, 112, 88, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
      }}>
        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
          {fps} FPS
        </Text>
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        <Pressable
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            backgroundColor: pressed ? 'rgb(62, 59, 56)' : isStreaming ? 'rgb(210, 112, 88)' : 'rgb(196, 108, 88)',
            borderRadius: 12,
            alignItems: 'center' as const,
            minHeight: 44,
            justifyContent: 'center' as const,
          })}
          onPress={isStreaming ? stopStreaming : startStreaming}
        >
          <Text style={{ color: 'rgb(230, 222, 216)', fontSize: 15, fontWeight: '600' }}>
            {isStreaming ? 'Stop Streaming' : 'Simulate Streaming'}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            backgroundColor: pressed ? 'rgb(62, 59, 56)' : showProduction ? 'rgb(196, 108, 88)' : 'rgb(54, 50, 48)',
            borderRadius: 12,
            alignItems: 'center' as const,
            minHeight: 44,
            justifyContent: 'center' as const,
          })}
          onPress={() => setShowProduction(!showProduction)}
        >
          <Text style={{ color: 'rgb(230, 222, 216)', fontSize: 15, fontWeight: '600' }}>
            {showProduction ? 'Show PoC' : 'Show Production'}
          </Text>
        </Pressable>
      </View>

      {/* Streaming status */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 12, color: 'rgb(148, 144, 141)' }}>
          {isStreaming
            ? `Streaming... ${streamContent.length}/${TEST_MARKDOWN.length} chars`
            : streamContent.length > 0
              ? `Complete: ${streamContent.length} chars`
              : 'Tap "Simulate Streaming" to begin'}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgb(148, 144, 141)', marginTop: 2 }}>
          Renderer: {showProduction ? 'Production (MarkdownRenderer)' : 'PoC (MarkdownRendererPoC)'}
        </Text>
      </View>

      {/* Markdown content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {showProduction ? (
          <MarkdownRenderer
            content={streamContent || TEST_MARKDOWN}
            isStreaming={isStreaming}
          />
        ) : (
          <MarkdownRendererPoC
            content={streamContent || TEST_MARKDOWN}
            isStreaming={isStreaming}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
