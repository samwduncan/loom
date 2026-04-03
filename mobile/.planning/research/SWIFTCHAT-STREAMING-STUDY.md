# Swift-Chat: Streaming Markdown & Multi-Provider Architecture Study

**Repository:** [aws-samples/swift-chat](https://github.com/aws-samples/swift-chat)  
**Tech Stack:** React Native, Expo, TypeScript, Zustand (implicit message state)  
**Key focus:** How a production React Native AI chat app handles streaming, markdown rendering, and provider abstraction.

---

## 1. Multi-Provider Streaming Pattern

### Architecture Overview

Swift-Chat abstracts provider differences via **provider-specific API modules** (`bedrock-api.ts`, `open-api.ts`, `ollama-api.ts`) that all export a **single unified callback interface:**

```typescript
type CallbackFunction = (
  result: string,
  complete: boolean,
  needStop: boolean,
  usage?: Usage,
  reasoning?: string
) => void;
```

### Provider Routing

The **bedrock-api.ts** module acts as a dispatcher that routes to the appropriate provider based on `getModelTag()`:

```typescript
export const invokeBedrockWithCallBack = async (
  messages: BedrockMessage[],
  chatMode: ChatMode,
  prompt: SystemPrompt | null,
  shouldStop: () => boolean,
  controller: AbortController,
  callback: CallbackFunction
) => {
  const currentModelTag = getModelTag(getTextModel());
  
  if (chatMode === ChatMode.Text && currentModelTag !== ModelTag.Bedrock) {
    if (currentModelTag === ModelTag.Ollama) {
      await invokeOllamaWithCallBack(messages, prompt, shouldStop, controller, callback);
    } else {
      // Routes to OpenAI, DeepSeek, or OpenAI-compatible (OpenRouter, etc.)
      await invokeOpenAIWithCallBack(messages, prompt, shouldStop, controller, callback);
    }
    return;
  }
  // ... handle Bedrock-specific flow
};
```

**Supported providers:**
- **Bedrock** (AWS SDK + Server API)
- **OpenAI** (direct API)
- **DeepSeek** (OpenAI-compatible endpoint)
- **Ollama** (local inference)
- **OpenRouter** (OpenAI-compatible aggregator)

### Streaming Callback Pattern

All providers follow this exact callback signature, ensuring downstream UI code is **provider-agnostic**:

```typescript
callback(
  accumulatedText,    // Full response text so far
  isComplete,         // true = stream ended or cancelled
  needStop,          // true = error or cancellation needed
  usageInfo?,        // Token counts when available
  reasoning?         // Extended thinking when supported
);
```

**Key observation:** The callback receives **accumulated text**, not deltas. The provider modules handle delta accumulation internally.

---

## 2. Streaming Implementation: Bedrock Example

### Raw Stream Reading & Chunk Parsing

```typescript
fetch(url!, options)
  .then(response => response.body)
  .then(async body => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let appendTimes = 0;
    let completeMessage = '';
    let completeReasoning = '';
    
    while (true) {
      if (shouldStop()) {
        await reader.cancel();
        callback(completeMessage, true, true, undefined, completeReasoning);
        return;
      }
      
      try {
        const { done, value } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });
        
        if (chunk.length > 0) {
          // SSE boundary: chunks may contain multiple \n\n-separated events
          const events = chunk.split('\n\n');
          for (const event of events) {
            const bedrockChunk = parseChunk(event);
            if (bedrockChunk) {
              // Accumulate reasoning
              if (bedrockChunk.reasoning) {
                completeReasoning += bedrockChunk.reasoning;
                callback(completeMessage, false, false, undefined, completeReasoning);
              }
              
              // Accumulate content with throttling
              if (bedrockChunk.text) {
                completeMessage += bedrockChunk.text;
                appendTimes++;
                // Skip re-renders after 500 accumulations (throttle to every 2nd)
                if (appendTimes > 500 && appendTimes % 2 === 0) continue;
                callback(completeMessage, false, false, undefined, completeReasoning);
              }
              
              // Emit token usage when available
              if (bedrockChunk.usage) {
                bedrockChunk.usage.modelName = getTextModel().modelName;
                callback(completeMessage, false, false, bedrockChunk.usage, completeReasoning);
              }
            }
          }
        }
        
        if (done) {
          callback(completeMessage, true, false, undefined, completeReasoning);
          return;
        }
      } catch (readError) {
        callback(completeMessage, true, true, undefined, completeReasoning);
        return;
      }
    }
  });
```

### SSE Parsing Detail

```typescript
function parseChunk(part: string) {
  if (part.length > 0) {
    try {
      const chunk: BedrockChunk = JSON.parse(part);
      const content = extractChunkContent(chunk, part);
      return {
        reasoning: content.reasoning,
        text: content.text,
        usage: content.usage,
      };
    } catch {
      // Fallback: treat malformed chunk as plain text
      return { reasoning: '', text: part, usage: undefined };
    }
  }
  return null;
}

function extractChunkContent(bedrockChunk: BedrockChunk, rawChunk: string) {
  const reasoning = bedrockChunk?.contentBlockDelta?.delta?.reasoningContent?.text;
  let text = bedrockChunk?.contentBlockDelta?.delta?.text;
  const usage = bedrockChunk?.metadata?.usage;
  if (bedrockChunk?.detail) {
    text = rawChunk;  // Fallback for detail errors
  }
  return { reasoning, text, usage };
}
```

### OpenAI Provider: ChatGPT-Compatible Streaming

```typescript
const parseStreamData = (chunk: string, lastChunk: string = '') => {
  const dataChunks = (lastChunk + chunk).split('\n\n');
  let content = '';
  let reason = '';
  let usage: Usage | undefined;
  
  for (let dataChunk of dataChunks) {
    if (!dataChunk.trim()) continue;
    
    const cleanedData = dataChunk.replace(/^data: /, '');
    if (cleanedData.trim() === '[DONE]') continue;
    
    try {
      const parsedData: ChatResponse = JSON.parse(cleanedData);
      
      // Content delta
      if (parsedData.choices[0]?.delta?.content) {
        content += parsedData.choices[0].delta.content;
      }
      
      // Extended thinking support
      if (parsedData.choices[0]?.delta?.reasoning_content) {
        reason += parsedData.choices[0].delta.reasoning_content;
      }
      if (parsedData.choices[0]?.delta?.reasoning) {
        reason += parsedData.choices[0].delta.reasoning;
      }
      
      // Usage accumulated at stream end
      if (parsedData.usage) {
        usage = {
          modelName: getTextModel().modelName,
          inputTokens: parsedData.usage.prompt_tokens - 
                       (parsedData.usage.prompt_cache_hit_tokens ?? 0),
          outputTokens: parsedData.usage.completion_tokens,
          totalTokens: parsedData.usage.total_tokens,
        };
      }
    } catch (error) {
      if (dataChunk === dataChunks[dataChunks.length - 1]) {
        return { reason, content, dataChunk, usage };  // Incomplete chunk
      } else {
        return { error: chunk };
      }
    }
  }
  
  return { reason, content, usage };
};
```

**Key difference from Bedrock:** OpenAI uses newline-delimited JSON (`data: {json}`), not SSE boundaries.

### Ollama Provider: Newline-Delimited JSON

```typescript
const parseStreamData = (chunk: string, lastChunk: string = '') => {
  let content = '';
  let usage: Usage | undefined;
  const dataChunks = (lastChunk + chunk).split('\n');  // Newline delimiters
  
  for (let dataChunk of dataChunks) {
    if (!dataChunk.trim()) continue;
    
    try {
      const parsedData: OllamaResponse = JSON.parse(dataChunk);
      
      if (parsedData.message?.content) {
        content += parsedData.message.content;
      }
      
      // Usage emitted when done=true
      if (parsedData.done) {
        usage = {
          modelName: getTextModel().modelName,
          inputTokens: parsedData.prompt_eval_count,
          outputTokens: parsedData.eval_count,
          totalTokens: parsedData.prompt_eval_count + parsedData.eval_count,
        };
      }
    } catch (error) {
      if (dataChunk === dataChunks[dataChunks.length - 1]) {
        return { content, dataChunk, usage };
      } else {
        return { error: chunk };
      }
    }
  }
  
  return { content, usage };
};
```

**Pattern:** Each provider accumulates deltas and re-emits the full accumulated response on every chunk, letting the UI do efficient diffing.

---

## 3. Markdown Rendering for Streaming Content

### React-Native-Marked Integration

Swift-Chat uses **[react-native-marked](https://github.com/jsamr/react-native-marked)** for markdown parsing + rendering.

#### Markdown Component Structure

```typescript
// src/chat/component/markdown/Markdown.tsx
const Markdown = ({
  value,
  flatListProps,
  theme,
  baseUrl,
  renderer,
  styles,
  tokenizer,
  chatStatus,
}: ChatMarkdownProps) => {
  const colorScheme = useColorScheme();

  // useMarkdown parses value once and returns React elements
  const rnElements = useMarkdown(value, {
    theme,
    baseUrl,
    renderer,
    colorScheme,
    styles,
    tokenizer,
    chatStatus,
  });

  return (
    <FlatList
      removeClippedSubviews={false}
      initialNumToRender={rnElements.length}
      data={rnElements}
      renderItem={({ item }) => item as ReactElement}
      keyExtractor={(_, index) => index.toString()}
    />
  );
};
```

**Why FlatList for markdown?** Efficient rendering of many inline elements (paragraphs, lists, code blocks, tables).

### Code Block Rendering: Chunked Strategy

The **ChunkedCodeView** component handles streaming code blocks by splitting into 100-line chunks and memoizing completed chunks:

```typescript
// src/chat/component/markdown/ChunkedCodeView.tsx
const CHUNK_SIZE = 100;

const ChunkText: FunctionComponent<ChunkTextProps> = memo(
  ({ content, textStyle }) => {
    return <Text style={textStyle}>{content}</Text>;
  },
  (prevProps, nextProps) => {
    // Memoization: complete chunks never re-render
    if (prevProps.isComplete) return true;
    return prevProps.content === nextProps.content;
  }
);

const useChunkedCode = (code: string, isCompleted?: boolean): string[] => {
  // Frozen complete chunks (each = 100 lines)
  const frozenChunksRef = useRef<string[]>([]);
  // Throttle counter
  const updateCountRef = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const lines = code ? code.split('\n') : [];
    const totalLines = lines.length;

    // How many complete 100-line chunks exist?
    const completeChunkCount =
      totalLines > 0 ? Math.floor((totalLines - 1) / CHUNK_SIZE) : 0;
    const frozenCount = frozenChunksRef.current.length;

    // Freeze new complete chunk when crossing boundary
    if (completeChunkCount > frozenCount) {
      const start = frozenCount * CHUNK_SIZE;
      const end = start + CHUNK_SIZE;
      const chunkContent = lines.slice(start, end).join('\n');
      frozenChunksRef.current.push(chunkContent);
    }

    // Throttle: skip odd updates during streaming
    updateCountRef.current++;
    if (!isCompleted && updateCountRef.current % 2 !== 0) {
      return;  // Don't re-render
    }

    forceUpdate(prev => prev + 1);
  }, [code, isCompleted]);

  // Return: frozen chunks + incomplete last chunk
  const lines = code ? code.split('\n') : [];
  const frozenCount = frozenChunksRef.current.length;
  const remainingStart = frozenCount * CHUNK_SIZE;
  const lastChunk = lines.slice(remainingStart).join('\n');

  return lastChunk
    ? [...frozenChunksRef.current, lastChunk]
    : [...frozenChunksRef.current];
};
```

**Streaming benefit:** 
- Frozen chunks (first 100 lines) never re-render, only the incomplete trailing chunk updates.
- Throttled updates (50% skipped) during high-frequency streaming.
- When stream completes, `isCompleted=true` triggers full re-render with proper memoization keys.

### Code Highlighter: Lazy-Loaded & Memoized

```typescript
const MemoizedCodeHighlighter = React.memo(
  ({ text, language, colors, isDark, isCompleted, ... }: {...}) => {
    const textRef = React.useRef(text);
    textRef.current = text;  // Always capture latest

    const hljsStyle = isDark ? vs2015 : github;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {language === '' ? 'code' : language}
          </Text>
          <CopyButton content={() => textRef.current} />
        </View>
        <Suspense fallback={<Text>Loading...</Text>}>
          <CustomCodeHighlighter
            hljsStyle={hljsStyle}
            scrollViewProps={{ /* ... */ }}
            textStyle={styles.text}
            language={language ?? 'code'}
            isCompleted={isCompleted}>
            {text}
          </CustomCodeHighlighter>
        </Suspense>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Don't memoize on every text change during streaming
    if (prevProps.text !== nextProps.text || 
        prevProps.language !== nextProps.language ||
        prevProps.colors !== nextProps.colors) {
      return false;  // Re-render
    }
    // Re-render once when stream completes
    if (!prevProps.isCompleted && nextProps.isCompleted) {
      return false;
    }
    return true;  // Otherwise skip re-render
  }
);
```

**Key pattern:** `textRef` captures latest text so copy button works on incomplete blocks. React.memo controls when highlighter actually re-renders.

### Custom Markdown Renderer: Inline Syntax Support

```typescript
// src/chat/component/markdown/CustomMarkdownRenderer.tsx
export class CustomMarkdownRenderer extends Renderer {
  // Handles: code blocks, tables, lists, citations, mermaid, HTML preview, math
  
  codespan(text: string): ReactElement {
    // Inline code: `text`
    return <Text style={styles.codespan}>{text}</Text>;
  }
  
  code(text: string, language?: string): ReactElement {
    // Block code: ```language\ntext\n```
    if (language === 'mermaid') {
      return <MermaidCodeRenderer text={text} />;
    }
    if (language === 'html') {
      return <HtmlCodeRenderer text={text} />;
    }
    return <MemoizedCodeHighlighter text={text} language={language} />;
  }
  
  table(header: TableHeader, body: TableBody): ReactElement {
    return (
      <Table borderStyle={{ borderColor: colors.border }}>
        <Row data={header} />
        <Rows data={body} />
      </Table>
    );
  }
}
```

---

## 4. Streaming State Flow: ChatScreen → UI

### Callback Invocation from ChatScreen

When `invokeBedrockWithCallBack()` is called, it receives a callback that updates React state:

```typescript
// ChatScreen.tsx line ~936
invokeBedrockWithCallBack(
  bedrockMessages.current,
  modeRef.current,
  effectiveSystemPrompt,
  () => localCancelFlag.current,
  controllerRef.current,
  (
    msg: string,              // Accumulated text
    complete: boolean,        // Stream done?
    needStop: boolean,        // Error/cancel?
    usageInfo?: Usage,        // Token counts
    reasoning?: string        // Extended thinking
  ) => {
    // Background stream handling (session switched)
    const isBackground = streamingSessionId !== sessionIdRef.current;
    if (isBackground) {
      backgroundStreamManager.update(streamingSessionId, {
        text: msg,
        reasoning,
        usage: usageInfo,
        metrics: bgMetrics,
        citations: webSearchCitations,
      });
      if (complete || needStop) {
        backgroundStreamManager.markComplete(streamingSessionId, needStop);
      }
      return;
    }

    // Foreground stream: update UI
    if (chatStatusRef.current !== ChatStatus.Running) return;

    const updateMessage = () => {
      if (usageInfo) {
        setUsage(prevUsage => ({
          modelName: usageInfo.modelName,
          inputTokens: (prevUsage?.inputTokens || 0) + usageInfo.inputTokens,
          outputTokens: (prevUsage?.outputTokens || 0) + usageInfo.outputTokens,
          totalTokens: (prevUsage?.totalTokens || 0) + usageInfo.totalTokens,
        }));
      }

      // Update latest message with streamed content
      const previousMessage = getLatestMessage(messagesRef.current);
      if (previousMessage && previousMessage.text !== msg) {
        setMessages(prevMessages =>
          updateLatestMessage(prevMessages, prevMsg => ({
            ...prevMsg,
            text: msg,
            reasoning: reasoning,
            metrics: metrics,
            citations: webSearchCitations,
          }))
        );
      }
    };

    if (modeRef.current === ChatMode.Text) {
      trigger(HapticFeedbackTypes.selection);  // Haptic feedback per chunk
      updateMessage();
      if (complete) {
        trigger(HapticFeedbackTypes.notificationSuccess);
        setChatStatus(ChatStatus.Complete);
      }
    }
  }
);
```

### Message List: Inverted FlatList Pattern

```typescript
// MessageList.tsx
export const MessageList = forwardRef<MessageListRef, MessageListProps>(
  ({
    messages,
    renderMessage,
    renderChatEmpty,
    scrollToBottomOffset = 200,
    // ... other props
  }, ref) => {
    const flatListRef = useRef<FlatList<SwiftChatMessage>>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    return (
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => renderMessage({ currentMessage: item })}
          keyExtractor={(item) => String(item._id)}
          inverted={true}              // Newest message at top
          scrollsToTop={true}
          scrollEventThrottle={100}
          onScroll={(event) => {
            const { contentOffset } = event.nativeEvent;
            setShowScrollBottom(contentOffset.y > scrollToBottomOffset);
          }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          ListEmptyComponent={renderChatEmpty}
        />
        <ScrollToBottomButton
          visible={showScrollBottom}
          onPress={() => flatListRef.current?.scrollToOffset({ offset: 0 })}
        />
      </View>
    );
  }
);
```

**Key insight:** `inverted={true}` means:
- Newest message is at top (index 0)
- Scrolling down = `contentOffset.y = 0`
- ScrollToBottom = `scrollToOffset({ offset: 0 })`

---

## 5. Message List Performance & Scroll Handling

### Virtualization via FlatList

- **Automatic:** FlatList only renders visible + buffer items
- **initialNumToRender:** For markdown FlatList, set to `rnElements.length` (all markdown block elements rendered together)
- **keyExtractor:** Stable keys prevent re-layout on updates
- **scrollEventThrottle:** 100ms throttle prevents callback spam

### ScrollToBottomButton Implementation

```typescript
// CustomScrollToBottomComponent.tsx
export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onPress,
  style,
}) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Image
        source={require('../../assets/scroll_down.png')}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
```

**Pattern:** Overlay button with absolute positioning, only mounts when user scrolls away.

### Handling 50+ Messages

For chat sessions with many messages:
1. **Inverted FlatList** only renders viewport + small buffer
2. **Message update efficiency:** Only latest message (bot response) gets diffs; historical messages never re-render
3. **Batch pagination:** Load older messages on scroll-to-top (not shown, but recommended pattern)

---

## 6. Citations & Sources Pattern

### Citation Types

```typescript
export interface Citation {
  number: number;        // [1], [2], [3]...
  title: string;         // Link title from web search
  url: string;           // Full URL
  excerpt?: string;      // Optional snippet
}
```

### CitationBadge: Inline Numbered Reference

```typescript
// CitationBadge.tsx
const CitationBadge: React.FC<CitationBadgeProps> = ({ number, url }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = async () => {
    trigger(HapticFeedbackTypes.impactLight);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.badge}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={handlePress}>
      <Text style={styles.badgeText}>{number}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    badge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.citationBadgeBackground,
      justifyContent: 'center',
      alignItems: 'center',
      transform: isAndroid ? [{ translateY: 3 }] : [],
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.citationBadgeText,
    },
  });
```

**Usage in markdown:** Rendered inline where `[1]` appears in text.

### CitationList: Stacked Favicon + Count

```typescript
// CitationList.tsx
const CitationList: React.FC<CitationListProps> = ({ citations }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);

  // Memoize favicon URLs to prevent re-fetching
  const faviconUrls = useMemo(() => {
    return citations.slice(0, 4).map(citation => getFaviconUrl(citation.url));
  }, [citations]);

  if (!citations?.length) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}>
        <View style={styles.iconsRow}>
          {faviconUrls.map((faviconUrl, index) => (
            <View
              key={index}
              style={[
                styles.faviconContainer,
                index > 0 && styles.faviconContainerOverlap,
              ]}>
              {faviconUrl ? (
                <Image
                  source={{ uri: faviconUrl }}
                  style={styles.faviconImage}
                  defaultSource={require('../../assets/link.png')}
                />
              ) : (
                <View style={styles.faviconPlaceholder} />
              )}
            </View>
          ))}
          <Text style={styles.sourceCount}>
            {citations.length} website{citations.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>

      <CitationModal
        visible={modalVisible}
        citations={citations}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};
```

**Pattern:**
1. Show first 4 favicons with negative margin overlap
2. Display total count
3. Modal on tap shows full list with titles and excerpts

---

## 7. Keyboard Handling & Composer

### CustomChatComponent: Composed Layout

```typescript
// CustomChatComponent.tsx
export const CustomChatComponent = forwardRef<
  CustomChatComponentRef,
  CustomChatComponentProps
>((props, ref) => {
  const { messages, onSend, renderMessage, renderChatEmpty, ... } = props;
  const messageListRef = useRef<MessageListRef>(null);
  const inputAreaRef = useRef<InputAreaRef>(null);

  useImperativeHandle(ref, () => ({
    scrollToEnd: (options) => messageListRef.current?.scrollToEnd(options),
    clearInput: () => inputAreaRef.current?.clear(),
    focusInput: () => inputAreaRef.current?.focus(),
    // ... other imperative APIs
  }));

  const handleSend = useCallback((text: string) => {
    const message: SwiftChatMessage = {
      _id: Date.now().toString(),
      text,
      createdAt: new Date(),
      user,
    };
    onSend([message]);
  }, [onSend, user]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 106 : 114}>
      <View style={styles.container}>
        <MessageList
          ref={messageListRef}
          messages={messages}
          renderMessage={renderMessage}
          renderChatEmpty={renderChatEmpty}
          onScrollEvent={props.onScrollEvent}
        />
        <InputArea
          ref={inputAreaRef}
          onSend={handleSend}
          renderSend={props.renderSend}
          maxComposerHeight={props.maxComposerHeight}
        />
      </View>
    </KeyboardAvoidingView>
  );
});
```

**Keyboard strategy:** `KeyboardAvoidingView` with platform-specific offsets (iOS: 106px, Android: 114px).

### InputArea: Growing Text Input

```typescript
// CustomChatComponent.tsx shows pattern but implementation in InputArea:
// - TextInput grows with content (max height = maxComposerHeight)
// - onSubmitEditing triggers onSend
// - Placeholder text encourages typing
// - Send button enabled when hasText
```

---

## 8. What's Worth Stealing for Loom

### For WebSocket Streaming (Not HTTP)

**Streaming callback abstraction:**
- Single callback signature for all providers (✓ Loom already does this)
- Accumulated text passed (not deltas) — use refs + efficient state updates
- Usage/reasoning split in callback signature

**Adaptation for WebSocket:**
```typescript
// Instead of fetch().then(reader), use WebSocket.onmessage
const onMessage = (event: MessageEvent) => {
  const chunk = event.data;
  if (chunk.type === 'text') {
    accumulatedText += chunk.content;
  }
  if (chunk.type === 'usage') {
    // Emit usage separately
  }
  callback(accumulatedText, chunk.isComplete, chunk.needStop, ...);
};
```

### Markdown Rendering for Streaming

**ChunkedCodeView pattern is GOLD:**
- **100-line chunk frozen strategy** prevents re-render of complete code
- **Throttled updates (50% skip)** during streaming
- **Proper memoization** with `isComplete` flag
- Applies to ALL code blocks, not just markdown code

**For Loom (currently using custom streaming markdown):**
```typescript
// Stolen concept: apply chunking to content blocks
const useChunkedContent = (text: string, isCompleted?: boolean) => {
  const frozenChunksRef = useRef<string[]>([]);
  // Every 2000 chars (or 100 lines), freeze a chunk
  // Only trailing chunk updates during stream
};
```

### Message List: FlatList Inverted Pattern

- Inverted list (newest at top) is standard in React Native chat
- `scrollToOffset({ offset: 0 })` = scroll to newest
- `scrollEventThrottle={100}` prevents callback spam
- Platform-specific keyboard offset (iOS 106px, Android 114px)

### Citations/Sources: Two-Tier UI

**CitationList design transfers directly:**
1. **Compact:** Show stacked favicons + count on message
2. **Expanded:** Full modal with title + excerpt on tap
3. **Inline badges:** `[1]` → tappable number opens URL

**For Loom tool references:**
- Use same favicon-stacking pattern
- Modal shows tool usage details (input params, output preview)
- Badges could link to tool documentation or result viewer

### Multi-Provider Pattern

**Dispatcher routing (bedrock-api.ts dispatch pattern):**
```typescript
// Already in Loom but worth reinforcing
export const invokeStreamingAPI = async (
  provider: 'claude' | 'gemini' | 'codex',
  prompt: string,
  callback: StreamCallback
) => {
  if (provider === 'gemini') {
    invokeGeminiStream(prompt, callback);
  } else if (provider === 'codex') {
    invokeCodexStream(prompt, callback);
  } else {
    invokeClaudeStream(prompt, callback);
  }
};
```

**This is exactly what Swift-Chat does.**

### Performance Optimizations Worth Stealing

1. **Throttled callbacks:** After 500 appends, skip every other callback (Bedrock does this)
2. **Ref-based text accumulation:** Use `textRef.current` in code blocks for copy, don't update state every character
3. **Haptic feedback per chunk:** `trigger(HapticFeedbackTypes.selection)` on each callback — cheap feedback loop
4. **Keep-awake during streaming:** `activateKeepAwake()` when ChatStatus.Running
5. **Absolute positioned scroll button:** Overlay, doesn't affect list layout

---

## 9. Key Files for Reference

| File | Purpose | Key Insight |
|------|---------|-------------|
| `bedrock-api.ts` | Streaming provider dispatcher | Unified callback, multi-chunk SSE parsing |
| `open-api.ts` | OpenAI/DeepSeek/OpenRouter provider | Newline-delimited JSON, reasoning support |
| `ollama-api.ts` | Local LLM provider | Minimal changes from OpenAI pattern |
| `ChatScreen.tsx` | Main chat orchestrator | Callback → setMessages state update |
| `MessageList.tsx` | FlatList virtualization | Inverted, scroll-to-bottom logic |
| `ChunkedCodeView.tsx` | Streaming code blocks | **100-line chunk + memoization pattern** |
| `CustomMarkdownRenderer.tsx` | Markdown to RN elements | Lazy code highlighter, special renderers |
| `CitationBadge.tsx` | Inline reference links | Tappable, haptic feedback |
| `CitationList.tsx` | Stacked favicon UI | Compact + expandable modal |
| `CustomChatComponent.tsx` | Layout composition | MessageList + InputArea wrapper |

---

## 10. Applicable Patterns for Loom v3.0

### Immediate Wins (Copy Pattern)

1. **ChunkedCodeView for markdown code:**
   - Split markdown body into chunks
   - Freeze complete chunks, only trailing updates
   - Memoize with `isCompleted` flag

2. **CitationList for tool references:**
   - Show compact icon set on message
   - Modal expands to full tool usage detail
   - Badges link to tool definitions

3. **Throttled streaming callbacks:**
   - After N updates, skip every other callback
   - Reduces React reconciliation overhead

4. **Keep-awake during streaming:**
   - Prevent screen sleep on long streams

### Integration Points

1. **Provider abstraction:** Already have it; align callback signatures
2. **Message state updates:** Pattern of `getLatestMessage()` + `updateLatestMessage()` is clean
3. **Keyboard offset:** Use same iOS/Android split (106/114px)
4. **FlatList inverted:** Standard, apply universally
5. **Feedback:** Haptic on chunk callback maintains tactile feel

---

## 11. Differences from Loom Architecture

| Aspect | Swift-Chat | Loom |
|--------|-----------|------|
| **State** | React useState | Zustand stores |
| **Markdown** | react-native-marked | Custom DOM-based |
| **Storage** | AsyncStorage | MMKV (native) |
| **Navigation** | React Navigation | Expo Router |
| **Streaming** | HTTP fetch | WebSocket (multiplexer) |
| **Providers** | 4 (Bedrock, OAI, DeepSeek, Ollama) | 3 (Claude SDK, Gemini CLI, Codex CLI) |

**Despite differences, the streaming callback pattern and UI composition patterns are universal.**

---

## Summary

Swift-Chat's architecture excels at:

1. **Provider abstraction:** Single callback signature, multiple backends
2. **Streaming optimization:** Chunk freezing, throttled updates, lazy rendering
3. **Message virtualization:** Inverted FlatList, efficient diffing
4. **Citation UX:** Two-tier (compact + expandable) works for any reference type
5. **Keyboard safety:** Platform-aware offsets and KeyboardAvoidingView

**Key insight:** The app doesn't try to optimize at render time; it optimizes **before** React sees the updates (frozen chunks, throttled callbacks, memoized markdown parsing). This is why it can handle 50+ messages + streaming without lag.

For Loom Phase 69+, apply:
- **ChunkedCodeView for Markdown:** Freeze completed blocks
- **CitationList for tool refs:** Same two-tier pattern
- **Callback throttling:** Skip updates after N appends
- **Haptic feedback loop:** Per-chunk feedback
- **FlatList inverted + scroll logic:** Standard, apply universally
