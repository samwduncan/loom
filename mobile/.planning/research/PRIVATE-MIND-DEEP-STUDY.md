# Private Mind Deep-Study Analysis

## Overview
Private Mind is a production React Native chat app using Expo SDK 54, built with modern architecture patterns: Zustand stores, expo-sqlite for persistence, expo-router for navigation, and react-native-keyboard-controller for keyboard handling. This document extracts concrete patterns worth transplanting to Loom's iOS app.

---

## 1. Navigation & Drawer

### Drawer Configuration

**File**: `app/(drawer)/_layout.tsx`

```typescript
const DrawerLayout = () => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        overlayColor: theme.bg.overlay,
        swipeEdgeWidth: width,        // Full-width swipe edge
        drawerType: 'slide',           // Slide over, not permanent
        headerShadowVisible: false,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.bg.softPrimary,
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: theme.text.primary,
          fontFamily: fontFamily.medium,
          fontSize: fontSizes.md,
        },
      }}
    >
      <Drawer.Screen name="index" options={{ title: '' }} />
      <Drawer.Screen name="model-hub" options={{ title: 'Models' }} />
      <Drawer.Screen name="benchmark" options={{ title: 'Benchmark' }} />
      <Drawer.Screen name="sources" options={{ title: 'Sources' }} />
      <Drawer.Screen name="chat/[id]" />
    </Drawer>
  );
};
```

**Key decisions:**
- `swipeEdgeWidth: width` enables full-width swipe (not edge-only)
- `drawerType: 'slide'` overlays content instead of pushing
- Drawer headings auto-generated from `title` prop
- Theme colors passed via context (no hardcoding)

### Session List Rendering

**File**: `components/drawer/DrawerMenu.tsx`

```typescript
const groupChatsByDate = (chats: Chat[]): Record<string, Chat[]> => {
  const sections: Record<string, Chat[]> = {};
  chats.forEach((chat) => {
    const date = new Date(chat.lastUsed);
    const section = getRelativeDateSection(date);
    if (!sections[section]) {
      sections[section] = [];
    }
    sections[section].push(chat);
  });
  return sections;
};

// In component:
const groupedChats = groupChatsByDate(
  [...chats].sort((a, b) => b.lastUsed - a.lastUsed)
);

return (
  <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.section}>
      <DrawerItem
        icon={<ChatIcon width={18} height={18} />}
        label="New chat"
        active={pathname === '/'}
        onPress={() => navigate('/')}
      />
      {/* Other main items */}
    </View>

    {Object.entries(groupedChats).map(([sectionTitle, sectionChats]) => (
      <View key={sectionTitle} style={styles.subSectionContainer}>
        <Text style={styles.subSection}>{sectionTitle}</Text>
        <View>
          {sectionChats.map((chat) => {
            const path = `/chat/${chat.id}`;
            return (
              <DrawerItem
                key={chat.id}
                label={chat.title || `Chat ${chat.id}`}
                active={pathname === path}
                onPress={() => navigate(path)}
              />
            );
          })}
        </View>
      </View>
    ))}
  </ScrollView>
);
```

**Key patterns:**
- **Grouping logic**: Helper function groups chats by relative date (Today, Yesterday, Last week, etc.)
- **Active state**: Compares `pathname` against route to determine highlight
- **Sort order**: Most recent first (`sort((a, b) => b.lastUsed - a.lastUsed)`)
- **Navigation**: Calls `router.replace()` on item press (not `push`)
- **Interrupt on nav**: Calls `interrupt()` from LLMStore before navigation to stop any in-flight generation

**DrawerItem component** (`components/drawer/DrawerItem.tsx` — not shown, but referenced):
- Takes `icon`, `label`, `active`, `onPress`
- Renders SVG icon + text
- Highlights text color based on `active` state

---

## 2. Chat Screen Composition

### ChatScreen Structure

**File**: `components/chat-screen/ChatScreen.tsx`

```typescript
export default function ChatScreen({
  chatId,
  chat,
  messageHistory,
  model,
  selectModel,
}: Props) {
  const inputRef = useRef<{
    clear: () => void;
    setInput: (text: string) => void;
  }>(null);
  const scrollRef = useRef<ScrollView>(null);
  const modelBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const sourceBottomSheetModalRef = useRef<BottomSheetModal>(null);

  // ... state and handlers ...

  return (
    <CustomKeyboardAvoidingView style={styles.container} collapsable={false}>
      <View style={styles.messagesContainer}>
        <Messages
          chatHistory={messageHistory}
          ref={scrollRef}
          isAtBottom={isAtBottom}
          setIsAtBottom={setIsAtBottom}
        />
      </View>

      <View style={styles.barContainer}>
        <ChatBar
          chatId={chatId}
          onSend={handleSendMessage}
          onSelectModel={handlePresentModelSheet}
          onSelectSource={handlePresentSourceSheet}
          onSelectPrompt={handleSelectPrompt}
          ref={inputRef}
          model={model}
          scrollRef={scrollRef}
          isAtBottom={isAtBottom}
          activeSourcesCount={enabledSources.length}
          thinkingEnabled={chatSettings?.thinkingEnabled || false}
          onThinkingToggle={handleThinkingToggle}
          hasMessages={messageHistory.length > 0}
        />
      </View>

      <ModelSelectSheet bottomSheetModalRef={modelBottomSheetModalRef} />
      <SourceSelectSheet bottomSheetModalRef={sourceBottomSheetModalRef} />
    </CustomKeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg.softPrimary,
    },
    messagesContainer: {
      flex: 1,
      paddingTop: 16,
      paddingBottom: 8,
      backgroundColor: theme.bg.softPrimary,
    },
    barContainer: {
      paddingBottom: theme.insets.bottom + 16,
    },
  });
```

**Composition hierarchy:**
1. `CustomKeyboardAvoidingView` wraps entire screen (handles kb offset math)
2. `messagesContainer` (flex: 1) contains scrollable Messages
3. `barContainer` contains ChatBar with safe-area inset padding
4. Bottom sheets rendered as portals (modals)

### Keyboard Handling

**File**: `components/CustomKeyboardAvoidingView.tsx`

```typescript
import {
  KeyboardAvoidingView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const headerBarHeight = Platform.select({
  ios: 40,
  android: 56,
  default: 0,
});

export const CustomKeyboardAvoidingView: React.FC<Props> = ({
  isModalScreen,
  ...props
}: Props) => {
  const insets = useSafeAreaInsets();

  const topOffset = isModalScreen
    ? Platform.select({ ios: insets.top + 10, default: 0 })
    : insets.top + headerBarHeight;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={topOffset - insets.bottom}
      {...props}
    />
  );
};
```

**Key decisions:**
- Uses `react-native-keyboard-controller` (not standard KeyboardAvoidingView)
- Calculates `keyboardVerticalOffset` = top inset + header height − bottom inset
- Platform-specific header heights (iOS 40px, Android 56px)
- Modal screens skip header height since header is inside KAV

### Message Rendering

**File**: `components/chat-screen/Messages.tsx`

```typescript
const Messages = ({ chatHistory, ref, isAtBottom, setIsAtBottom }: Props) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isProcessingPrompt } = useLLMStore();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setIsAtBottom(distanceFromBottom < 50);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={ref}
        onScroll={handleScroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="never"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onContentSizeChange={() => {
          if (
            isAtBottom ||
            chatHistory[chatHistory.length - 1]?.content === ''
          ) {
            ref.current?.scrollToEnd({ animated: true });
          }
        }}
      >
        <View onStartShouldSetResponder={() => true}>
          {chatHistory.map((message, index) => {
            const isLastMessage = index === chatHistory.length - 1;
            return (
              <MessageItem
                key={`${message.role}-${index}`}
                content={message.content}
                modelName={message.modelName}
                role={message.role}
                tokensPerSecond={message.tokensPerSecond}
                timeToFirstToken={message.timeToFirstToken}
                isLastMessage={isLastMessage}
              />
            );
          })}
          {isProcessingPrompt && (
            <View style={styles.aiRow}>
              <View style={styles.loadingWrapper}>
                <AnimatedChatLoading />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
```

**Key patterns:**
- **Scroll-to-bottom detection**: `distanceFromBottom < 50` threshold (not exact 0)
- **Auto-scroll condition**: Re-evaluates on `onContentSizeChange`
- **Placeholder detection**: Scrolls if last message has `content === ''` (assistant placeholder)
- **Loading indicator**: Rendered below message list when `isProcessingPrompt`
- **Key strategy**: `${message.role}-${index}` (not just index)

---

## 3. Composer (ChatBar)

### ChatBar Structure

**File**: `components/chat-screen/ChatBar.tsx`

```typescript
const ChatBar = ({
  chatId,
  onSend,
  onSelectModel,
  onSelectSource,
  onSelectPrompt,
  ref,
  model,
  scrollRef,
  isAtBottom,
  activeSourcesCount,
  thinkingEnabled,
  onThinkingToggle,
  hasMessages,
}: Props) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [userInput, setUserInput] = useState('');

  useImperativeHandle(
    ref,
    () => ({
      clear: () => setUserInput(''),
      setInput: (text: string) => setUserInput(text),
    }),
    []
  );

  // Model auto-load on focus:
  const loadSelectedModel = async () => {
    if (model?.isDownloaded && loadedModel?.id !== model.id) {
      return loadModel(model);
    }
  };

  // If no model selected, show selection UI:
  if (chatId && !model) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.modelSelection} onPress={onSelectModel}>
          <Text style={styles.selectedModel}>Select Model</Text>
          <RotateLeft width={20} height={20} />
        </TouchableOpacity>
      </View>
    );
  }

  // If model not downloaded, show empty state:
  if (!model?.isDownloaded) {
    return null; // Parent component handles this
  }

  return (
    <View style={styles.container}>
      {/* Prompt suggestions (only if no messages) */}
      {!hasMessages && (
        <View style={styles.suggestionsContainer}>
          <PromptSuggestions onSelectPrompt={onSelectPrompt} />
        </View>
      )}

      {/* Input box */}
      <View style={styles.inputContainer}>
        <View style={styles.content}>
          <TextInput
            style={styles.input}
            multiline
            onFocus={async () => {
              if (!isAtBottom) return;
              await loadSelectedModel();
              setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }, 25);
            }}
            placeholder="Ask about anything..."
            placeholderTextColor={theme.text.contrastTertiary}
            value={userInput}
            onChangeText={setUserInput}
            numberOfLines={3}
          />
        </View>

        {/* Actions row */}
        <ChatBarActions
          onSelectSource={onSelectSource}
          activeSourcesCount={activeSourcesCount}
          userInput={userInput}
          onSend={() => onSend(userInput)}
          isGenerating={isGenerating}
          isProcessingPrompt={isProcessingPrompt}
          onInterrupt={interrupt}
          onSpeechInput={openSpeechInput}
          thinkingEnabled={thinkingEnabled}
          onThinkingToggle={onThinkingToggle}
        />
      </View>
    </View>
  );
};
```

**Key patterns:**
- **Imperative ref**: Exposes `clear()` and `setInput()` to parent
- **Conditional rendering**: Shows different UI based on model state
- **Model loading on focus**: Loads model only if not already loaded
- **Auto-scroll on focus**: Scrolls to bottom with 25ms delay
- **Prompt suggestions**: Only shown if `!hasMessages`
- **States**:
  1. No model selected → show "Select Model" button
  2. Model downloading → show placeholder (or null)
  3. Model ready → show input + actions

### Auto-Grow Input

Private Mind's TextInput uses `multiline` + `numberOfLines={3}` but doesn't show explicit auto-grow code. The behavior is:
- Default height fits 3 lines
- Content expands naturally up to 3 lines
- Scrolls internally if larger

For true auto-grow, would need a custom component or `react-native-text-input-reset`.

### Send Button State Machine

**File**: `components/chat-screen/ChatBarActions.tsx`

```typescript
const ChatBarActions = ({
  onSelectSource,
  activeSourcesCount,
  userInput,
  onSend,
  isGenerating,
  isProcessingPrompt,
  onInterrupt,
  onSpeechInput,
  thinkingEnabled,
  onThinkingToggle,
}: Props) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderButton = () => {
    // State 1: Generation in progress → Pause button
    if (isGenerating || isProcessingPrompt) {
      return (
        <CircleButton
          icon={PauseIcon}
          size={13.33}
          onPress={onInterrupt}
          backgroundColor={theme.bg.main}
          color={theme.text.contrastPrimary}
        />
      );
    }

    // State 2: Text in input → Send button
    if (userInput) {
      return (
        <CircleButton
          icon={SendIcon}
          onPress={onSend}
          backgroundColor={theme.bg.main}
          color={theme.text.contrastPrimary}
        />
      );
    }

    // State 3: Empty input → Microphone button
    return (
      <CircleButton
        icon={SoundwaveIcon}
        onPress={onSpeechInput}
        backgroundColor="transparent"
        color={theme.text.contrastPrimary}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        {/* Sources button with badge */}
        <TouchableOpacity onPress={onSelectSource}>
          {activeSourcesCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{activeSourcesCount}</Text>
            </View>
          )}
          <Text style={styles.sourceText}>Sources</Text>
        </TouchableOpacity>

        {/* Thinking toggle */}
        <TouchableOpacity
          onPress={onThinkingToggle}
          style={[styles.sourceButton, !thinkingEnabled && { opacity: 0.4 }]}
        >
          {!thinkingEnabled ? (
            <LightBulbCrossedIcon />
          ) : (
            <LightBulbIcon />
          )}
          <Text style={styles.sourceText}>Think</Text>
        </TouchableOpacity>
      </View>

      {renderButton()}
    </View>
  );
};
```

**State machine:**
1. **Generating** (`isGenerating || isProcessingPrompt`) → Pause/Stop icon (red)
2. **Idle + text** (`userInput.trim()`) → Send icon (blue, enabled)
3. **Idle + empty** (`!userInput.trim()`) → Mic icon (transparent background)

**Left action buttons:**
- **Sources**: Shows count badge if > 0, always tappable
- **Think**: Shows lightbulb icon (filled/crossed based on state), toggled on press

### Prompt Suggestions / Empty State

**File**: `components/chat-screen/PromptSuggestions.tsx`

```typescript
interface Props {
  onSelectPrompt: (prompt: string) => void;
}

const PromptSuggestions = ({ onSelectPrompt }: Props) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePromptPress = (prompt: string) => {
    onSelectPrompt(prompt);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{PROMPT_SUGGESTIONS_TEXT.title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DEFAULT_PROMPT_SUGGESTIONS.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={styles.suggestionCard}
            onPress={() => handlePromptPress(suggestion.prompt)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <Text style={styles.suggestionPrompt} numberOfLines={3}>
              {suggestion.prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: 8,
    },
    title: {
      fontSize: fontSizes.md,
      fontFamily: fontFamily.medium,
      color: theme.text.primary,
      marginBottom: 12,
    },
    scrollContent: {
      gap: 8,
    },
    suggestionCard: {
      width: 160,
      backgroundColor: theme.bg.softSecondary,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.bg.softSecondary,
    },
    suggestionTitle: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamily.medium,
      color: theme.text.primary,
      marginBottom: 6,
    },
    suggestionPrompt: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamily.regular,
      color: theme.text.defaultSecondary,
      lineHeight: lineHeights.xs,
    },
  });
```

**Key decisions:**
- Horizontal scrolling (not grid)
- Fixed card width (160px)
- 3-line truncation on prompt text
- Title from `DEFAULT_PROMPT_SUGGESTIONS` constant (not props)
- On tap → calls parent's `onSelectPrompt()` with full prompt text

---

## 4. Zustand Store Architecture

### Store Pattern Overview

Private Mind uses **Zustand v5** with a factory pattern where each store manages a domain:

```typescript
import { create } from 'zustand';

interface StoreInterface {
  state1: Type1;
  state2: Type2;
  action1: () => void;
  action2: () => Promise<void>;
}

export const useStoreNameStore = create<StoreInterface>((set, get) => ({
  state1: initialValue,
  state2: initialValue,

  action1: () => {
    set({ state1: newValue });
  },

  action2: async () => {
    const currentState = get();
    // Use currentState...
    set({ state2: newValue });
  },
}));
```

### Store Instances

**1. useChatStore** (`store/chatStore.ts`)

```typescript
interface ChatStore {
  chats: Chat[];
  db: SQLiteDatabase | null;
  phantomChat: Chat | null;

  setDB: (db: SQLiteDatabase) => void;
  loadChats: () => Promise<void>;
  getChatById: (id: number) => Chat | undefined;
  addChat: (title: string, modelId: number) => Promise<number | undefined>;
  renameChat: (id: number, newTitle: string) => Promise<void>;
  setChatModel: (id: number, modelId: number) => Promise<void>;
  deleteChat: (id: number) => Promise<void>;
  enableSource: (chatId: number, sourceId: number) => Promise<void>;
  initPhantomChat: (phantomChatId: number) => Promise<void>;
  setPhantomChatSettings: (settings: ChatSettings) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  db: null,
  phantomChat: null,

  setDB: (db) => {
    set({ db });
    get().loadChats();
  },

  loadChats: async () => {
    const db = get().db;
    if (!db) return;
    const chats = await getAllChats(db);
    set({ chats });
  },

  addChat: async (title: string, modelId: number) => {
    const db = get().db;
    if (!db) return;
    const phantomChat = get().phantomChat;
    const newChatId = await createChat(db, title, modelId);
    if (newChatId === undefined) return;
    
    // Transfer phantom chat settings to real chat:
    const enabledSources = phantomChat?.enabledSources || [];
    for (const enabledSource of enabledSources) {
      await activateSource(db, newChatId, enabledSource);
    }
    if (phantomChat?.settings) {
      await setChatSettings(db, newChatId, phantomChat?.settings);
    }

    set((state) => ({
      chats: [
        {
          id: newChatId,
          title: title,
          lastUsed: Date.now(),
          modelId: modelId,
          enabledSources: enabledSources,
        },
        ...state.chats,
      ],
      phantomChat: undefined,
    }));

    return newChatId;
  },

  // ... other actions
}));
```

**2. useLLMStore** (`store/llmStore.ts` — excerpt)

```typescript
interface LLMStore {
  isLoading: boolean;
  isGenerating: boolean;
  isProcessingPrompt: boolean;
  db: SQLiteDatabase | null;
  model: Model | null;
  activeChatId: number | null;
  activeChatMessages: Message[];
  performance: { tokenCount: number; firstTokenTime: number };

  setDB: (db: SQLiteDatabase) => void;
  loadModel: (model: Model, hardReload?: boolean) => Promise<void>;
  setActiveChatId: (chatId: number | null) => Promise<void>;
  sendChatMessage: (
    newMessage: string,
    chatId: number,
    context: string[],
    settings: ChatSettings
  ) => Promise<void>;
  interrupt: () => void;
}

let llmInstance: LLMModule | null = null;

export const useLLMStore = create<LLMStore>((set, get) => ({
  isLoading: false,
  isGenerating: false,
  isProcessingPrompt: false,
  db: null,
  model: null,
  activeChatId: null,
  activeChatMessages: [],
  performance: { tokenCount: 0, firstTokenTime: 0 },

  setActiveChatId: async (chatId: number | null) => {
    set({ activeChatId: chatId });
    if (chatId) {
      const messages = await getChatMessages(db, chatId);
      set({ activeChatMessages: messages });
    }
  },

  sendChatMessage: async (
    newMessage: string,
    chatId: number,
    context: string[],
    settings: ChatSettings
  ) => {
    // 1. Add user message to state + DB
    const userMessage: Message = {
      chatId,
      role: 'user',
      content: newMessage,
      timestamp: Date.now(),
    };
    set((state) => ({
      activeChatMessages: [...state.activeChatMessages, userMessage],
    }));
    await persistMessage(db, userMessage);

    // 2. Add assistant placeholder
    const assistantPlaceholder: Message = {
      chatId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    set((state) => ({
      activeChatMessages: [...state.activeChatMessages, assistantPlaceholder],
    }));

    // 3. Generate response
    updateChatStateForGeneration(set, 'start', { chatId });
    updateChatStateForGeneration(set, 'generating');

    // Construct messages for LLM...
    const { response, performance } = await generateLLMResponse(messages, get);

    // 4. Update placeholder with response
    set((state) => ({
      activeChatMessages: state.activeChatMessages.map((msg, idx) =>
        idx === state.activeChatMessages.length - 1
          ? { ...msg, content: response }
          : msg
      ),
      isGenerating: false,
    }));

    // Persist final message...
    updateChatStateForGeneration(set, 'complete', { performance });
  },

  interrupt: () => {
    if (llmInstance) {
      llmInstance.interrupt();
    }
    set({ isGenerating: false, isProcessingPrompt: false });
  },
}));
```

**3. useModelStore** (`store/modelStore.ts` — excerpt)

```typescript
interface ModelStore {
  db: SQLiteDatabase | null;
  models: Model[];
  downloadedModels: Model[];
  downloadStates: Record<string, DownloadState>;

  setDB: (db: SQLiteDatabase) => void;
  loadModels: () => Promise<void>;
  getModelById: (id: number) => Model | undefined;
  downloadModel: (model: Model) => Promise<void>;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  db: null,
  models: [],
  downloadedModels: [],
  downloadStates: {},

  loadModels: async () => {
    const db = get().db;
    if (!db) return;
    const models = await getAllModels(db);
    set({
      models,
      downloadedModels: models.filter((m) => m.isDownloaded),
    });
  },

  getModelById: (id: number) => {
    const models = get().models;
    return models.find((model) => model.id === id);
  },
}));
```

### Phantom Chat Pattern (New Session Flow)

The "phantom chat" pattern allows users to start conversations without immediately creating a database record:

**In home screen** (`app/(drawer)/index.tsx`):
```typescript
const handleSetModel = async (model: Model) => {
  const nextChatId = await getNextChatId(db);  // Reserve next ID (not in DB yet)
  await initPhantomChat(nextChatId);            // Create phantom in store
  await setActiveChatId(null);                  // Clear current active
  router.push({
    pathname: `/chat/${nextChatId}`,
    params: { modelId: model.id },
  });
};
```

**In chatStore**:
```typescript
initPhantomChat: async (phantomChatId) => {
  const db = get().db;
  if (!db) return;
  const defaultSettings = await getChatSettings(db, null);
  set({
    phantomChat: {
      id: phantomChatId,
      title: '',
      lastUsed: Date.now(),
      modelId: -1,
      enabledSources: [],
      settings: defaultSettings,
    },
  });
},

setPhantomChatSettings: async (newSettings) => {
  const phantomChat = get().phantomChat;
  if (phantomChat) {
    set({
      phantomChat: {
        ...phantomChat,
        settings: newSettings,
      },
    });
  }
},
```

**When first message is sent** (`components/chat-screen/ChatScreen.tsx`):
```typescript
const handleSendMessage = async (userInput: string) => {
  if (!(await checkIfChatExists(db, chatId!))) {
    // Chat doesn't exist in DB → create it from phantom
    const newChatTitle =
      userInput.length > 25 ? userInput.slice(0, 25) + '...' : userInput;
    await addChat(newChatTitle, model!.id);
  }
  // ... proceed with normal send
};
```

**In chatStore's `addChat`**:
```typescript
addChat: async (title: string, modelId: number) => {
  const phantomChat = get().phantomChat;
  const newChatId = await createChat(db, title, modelId);
  
  // Transfer phantom's sources and settings:
  const enabledSources = phantomChat?.enabledSources || [];
  for (const enabledSource of enabledSources) {
    await activateSource(db, newChatId, enabledSource);
  }
  if (phantomChat?.settings) {
    await setChatSettings(db, newChatId, phantomChat?.settings);
  }

  set((state) => ({
    chats: [
      {
        id: newChatId,
        title,
        lastUsed: Date.now(),
        modelId,
        enabledSources,
      },
      ...state.chats,
    ],
    phantomChat: undefined,  // Clear phantom after converting to real
  }));

  return newChatId;
},
```

**Benefits:**
- User sees chat UI immediately without DB insert lag
- Can configure sources/settings before sending first message
- On send → phantom converts to real chat atomically
- If user navigates away → phantom is discarded (no cleanup needed)

---

## 5. Database / Repository Pattern

### expo-sqlite Usage

**File**: `database/db.ts`

```typescript
import { type SQLiteDatabase } from 'expo-sqlite';

export const initDatabase = async (db: SQLiteDatabase) => {
  // Enable WAL mode
  await db.execAsync(`PRAGMA journal_mode = 'wal';`);

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lastUsed timestamp DEFAULT CURRENT_TIMESTAMP,
      modelId INTEGER,
      title TEXT DEFAULT '',
      FOREIGN KEY (modelId) REFERENCES models (id) ON DELETE SET NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modelName TEXT,
      timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
      chatId INTEGER,
      role TEXT,
      content TEXT,
      tokensPerSecond INTEGER DEFAULT 0,
      timeToFirstToken INTEGER DEFAULT 0,
      FOREIGN KEY (chatId) REFERENCES chats (id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chatSettings (
      chatId INTEGER PRIMARY KEY NOT NULL,
      systemPrompt TEXT DEFAULT '',
      contextWindow INTEGER DEFAULT 10,
      thinkingEnabled INTEGER DEFAULT NULL,
      FOREIGN KEY(chatId) REFERENCES chats(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chatSources (
      chatId INTEGER NOT NULL,
      sourceId INTEGER NOT NULL,
      PRIMARY KEY (chatId, sourceId),
      FOREIGN KEY(chatId) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY(sourceId) REFERENCES sources(id) ON DELETE CASCADE
    );
  `);

  // Mutations/migrations
  await runMigrations(db);

  // Initialize stores
  useChatStore.getState().setDB(db);
  useModelStore.getState().setDB(db);
  useLLMStore.getState().setDB(db);
};

const runMigrations = async (db: SQLiteDatabase) => {
  // Check schema version
  const modelsTableInfo = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(models)`
  );
  const hasFeatured = modelsTableInfo.some((col) => col.name === 'featured');

  // Add missing columns
  if (!hasFeatured) {
    await db.execAsync(
      `ALTER TABLE models ADD COLUMN featured INTEGER DEFAULT 0`
    );
  }
};
```

### Chat Repository

**File**: `database/chatRepository.ts` (excerpt)

```typescript
export type Chat = {
  id: number;
  modelId: number;
  title: string;
  lastUsed: number;
  enabledSources?: number[];
  settings?: ChatSettings;
};

export type ChatSettings = {
  systemPrompt: string;
  contextWindow: number;
  thinkingEnabled?: boolean;
};

export type Message = {
  id: number;
  chatId: number;
  modelName?: string;
  role: 'user' | 'assistant' | 'system' | 'event';
  content: string;
  tokensPerSecond?: number;
  timeToFirstToken?: number;
  timestamp: number;
};

// Create new chat
export const createChat = async (
  db: SQLiteDatabase,
  title: string,
  modelId: number
): Promise<number | void> => {
  try {
    const result = await db.runAsync(
      `INSERT INTO chats (title, modelId) VALUES (?, ?)`,
      [title, modelId]
    );

    if (result.lastInsertRowId) {
      const defaultSettings = await AsyncStorage.getItem('default_chat_settings');
      if (defaultSettings) {
        const parsedSettings: ChatSettings = JSON.parse(defaultSettings);
        await setChatSettings(db, result.lastInsertRowId, {
          systemPrompt: parsedSettings.systemPrompt,
          contextWindow: parsedSettings.contextWindow,
        });
      }
    }

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};

// Get all chats with sources (via GROUP_CONCAT)
export const getAllChats = async (
  db: SQLiteDatabase
): Promise<Chat[]> => {
  const chats = await db.getAllAsync<Chat & { enabledSources: string | null }>(
    `SELECT c.*, 
            GROUP_CONCAT(cs.sourceId) as enabledSources
     FROM chats c
     LEFT JOIN chatSources cs ON c.id = cs.chatId
     GROUP BY c.id
     ORDER BY c.id DESC`
  );

  return chats.map((chat) => ({
    ...chat,
    enabledSources: chat.enabledSources
      ? chat.enabledSources.split(',').map((id) => parseInt(id, 10))
      : [],
  }));
};

// Get messages for a chat
export const getChatMessages = async (
  db: SQLiteDatabase,
  chatId: number
): Promise<Message[]> => {
  return db.getAllAsync<Message>(
    `SELECT * FROM messages WHERE chatId = ? ORDER BY id ASC`,
    [chatId]
  );
};

// Persist a single message
export const persistMessage = async (
  db: SQLiteDatabase,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<number> => {
  const result = await db.runAsync(
    `INSERT INTO messages (chatId, role, content, modelName, tokensPerSecond, timeToFirstToken) 
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      message.chatId,
      message.role,
      message.content,
      message.modelName || '',
      message.tokensPerSecond || 0,
      message.timeToFirstToken || 0,
    ]
  );

  // Update lastUsed only for non-event messages
  if (message.role !== 'event') {
    const timestamp = Date.now();
    await db.runAsync(`UPDATE chats SET lastUsed = ? WHERE id = ?`, [
      timestamp,
      message.chatId,
    ]);
  }

  return result.lastInsertRowId;
};
```

### Message Persistence Flow

1. **User sends message**:
   ```typescript
   const userMessage = { chatId, role: 'user', content, timestamp };
   await persistMessage(db, userMessage);
   set(state => ({ activeChatMessages: [...state.activeChatMessages, userMessage] }));
   ```

2. **Add placeholder before generation**:
   ```typescript
   const assistantPlaceholder = { chatId, role: 'assistant', content: '', timestamp };
   set(state => ({ activeChatMessages: [...state.activeChatMessages, assistantPlaceholder] }));
   ```

3. **Update placeholder as tokens arrive** (via rAF buffer in streaming):
   ```typescript
   set(state => ({
     activeChatMessages: state.activeChatMessages.map((msg, idx) =>
       idx === state.activeChatMessages.length - 1
         ? { ...msg, content: updatedContent }
         : msg
     ),
   }));
   ```

4. **Persist final message**:
   ```typescript
   await persistMessage(db, {
     chatId,
     role: 'assistant',
     content: finalResponse,
     tokensPerSecond,
     timeToFirstToken,
   });
   ```

---

## 6. Theme System

### Theme Definition

**File**: `styles/colors.ts`

```typescript
export const lightTheme = {
  bg: {
    main: '#3D61D6',           // Primary action color
    softPrimary: '#ffffff',    // Default background
    softSecondary: '#e6e7eb',  // Secondary background (cards, inputs)
    strongPrimary: '#020f3c',  // Inverse (text on main)
    errorSecondary: '#F5D0D1',
    errorPrimary: '#DE595B',
    overlay: 'rgba(2, 15, 60, 0.2)',
  },
  text: {
    primary: '#020f3c',                       // Headline text
    defaultSecondary: 'rgba(2, 15, 60, 0.8)', // Body text
    defaultTertiary: 'rgba(2, 15, 60, 0.6)',  // Tertiary text (timestamps, hints)
    contrastTertiary: 'rgba(255, 255, 255, 0.6)', // On dark backgrounds
    contrastPrimary: '#ffffff',                   // On dark backgrounds (primary)
    error: '#DE595B',
  },
  border: {
    soft: 'rgba(2, 15, 60, 0.2)',
    contrast: '#fff',
  },
};

export const darkTheme = {
  bg: {
    main: '#7E9DF5',           // Lighter blue for dark mode
    softPrimary: '#020F3C',
    softSecondary: '#1b2750',
    strongPrimary: '#FFFFFF',
    errorSecondary: '#8B2728',
    errorPrimary: '#DE595B',
    overlay: 'rgba(255, 255, 255, 0.4)',
  },
  text: {
    primary: '#FFFFFF',
    defaultSecondary: 'rgba(255, 255, 255, 0.8)',
    defaultTertiary: 'rgba(255, 255, 255, 0.6)',
    contrastTertiary: 'rgba(2, 15, 60, 0.6)',
    contrastPrimary: '#020F3C',
    error: '#E68485',
  },
  border: {
    soft: 'rgba(255, 255, 255, 0.2)',
    contrast: '#020F3C',
  },
};

export type ThemeColors = typeof lightTheme;
export type Theme = ThemeColors & { insets: EdgeInsets };
```

**Color palette strategy:**
- **Bg colors**: `softPrimary` (main background), `softSecondary` (cards/inputs), `strongPrimary` (inverse)
- **Text colors**: `primary` (headlines), `defaultSecondary` (body), `defaultTertiary` (hints/timestamps)
- **Contrast colors**: `contrastPrimary`/`contrastTertiary` for text on dark backgrounds
- **Single accent**: `bg.main` (primary action color)
- **Semantic**: `error*` for error states

### ThemeProvider & Consumer

**File**: `context/ThemeContext.tsx`

```typescript
import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../styles/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ThemeContext = createContext<{ theme: Theme }>({
  theme: { ...lightTheme, insets: { top: 0, bottom: 0, left: 0, right: 0 } },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = Appearance.getColorScheme();
  const [themeColors, setThemeColors] = useState(
    colorScheme === 'dark' ? darkTheme : lightTheme
  );
  const insets = useSafeAreaInsets();

  const theme = useMemo(
    () => ({ ...themeColors, insets }),
    [themeColors, insets]
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setThemeColors(colorScheme === 'dark' ? darkTheme : lightTheme);
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

**Usage in components**:
```typescript
export default function MyComponent() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={styles.container} />;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.bg.softPrimary,
      borderColor: theme.border.soft,
    },
  });
```

**Dark mode handling:**
- Automatic via `Appearance.getColorScheme()`
- No toggle needed (respects system settings)
- Safe area insets automatically included in theme

---

## 7. Message Types & Extensibility

### Message Role Types

**File**: `database/chatRepository.ts`

```typescript
export type Message = {
  id: number;
  chatId: number;
  modelName?: string;
  role: 'user' | 'assistant' | 'system' | 'event';
  content: string;
  tokensPerSecond?: number;
  timeToFirstToken?: number;
  timestamp: number;
};
```

**Role types:**
- **user**: User input (right-aligned, light background)
- **assistant**: Model response (left-aligned, larger, shows model name)
- **system**: System messages (not shown in UI currently)
- **event**: Event notifications (centered, smaller, no bubble, e.g., "Document uploaded")

### MessageItem Rendering by Role

**File**: `components/chat-screen/MessageItem.tsx`

```typescript
const MessageItem = memo(
  ({
    content,
    modelName,
    role,
    tokensPerSecond,
    timeToFirstToken,
    isLastMessage,
  }: MessageItemProps) => {
    const { theme } = useTheme();
    const { isGenerating } = useLLMStore();

    // Parse thinking blocks
    const contentParts = parseThinkingContent(content);

    return (
      <>
        {role === 'event' ? (
          // EVENT: Centered, smaller text, no bubble
          <View style={styles.eventMessage}>
            <Text style={styles.eventMessageFileName}>
              {content.split(' ')[0]}
              <Text style={styles.eventMessageText}>
                {content.slice(content.indexOf(' ') + 1)}
              </Text>
            </Text>
          </View>
        ) : (
          // USER or ASSISTANT
          <View
            style={
              role === 'assistant' ? styles.aiMessage : styles.userMessage
            }
          >
            <View style={styles.bubbleContent}>
              {/* ASSISTANT: Show model name */}
              {role === 'assistant' && (
                <Text style={styles.modelName}>{modelName}</Text>
              )}

              {/* NORMAL CONTENT */}
              {contentParts.normalContent.trim() && (
                <TouchableOpacity
                  onLongPress={() => {
                    messageManagementSheetRef.current?.present(content);
                  }}
                >
                  <MarkdownComponent text={contentParts.normalContent} />
                </TouchableOpacity>
              )}

              {/* THINKING BLOCK (if present) */}
              {contentParts.hasThinking && contentParts.thinkingContent?.trim() && (
                <ThinkingBlock
                  content={contentParts.thinkingContent || ''}
                  isComplete={contentParts.isThinkingComplete}
                  inProgress={
                    isLastMessage &&
                    isGenerating &&
                    !contentParts.isThinkingComplete
                  }
                />
              )}

              {/* CONTENT AFTER THINKING */}
              {contentParts.normalAfterThink?.trim() && (
                <TouchableOpacity
                  onLongPress={() => {
                    messageManagementSheetRef.current?.present(content);
                  }}
                >
                  <MarkdownComponent text={contentParts.normalAfterThink} />
                </TouchableOpacity>
              )}

              {/* PERFORMANCE METRICS (ASSISTANT ONLY) */}
              {role === 'assistant' &&
                tokensPerSecond !== undefined &&
                tokensPerSecond !== 0 && (
                  <Text style={styles.metadata}>
                    ttft: {timeToFirstToken?.toFixed()} ms, tps:{' '}
                    {tokensPerSecond?.toFixed(2)} tok/s
                  </Text>
                )}
            </View>
          </View>
        )}
      </>
    );
  }
);
```

**Styling differences**:
- **User**: `flexDirection: 'row-reverse'`, `maxWidth: '65%'`, right-aligned, light bg
- **Assistant**: `flexDirection: 'row'`, `maxWidth: '90%'`, left-aligned, no bg
- **Event**: Centered, smaller font, bordered text

### Thinking Block Support

Private Mind parses `<think>...</think>` tags in responses:

```typescript
const parseThinkingContent = (text: string) => {
  const thinkStartIndex = text.indexOf('<think>');

  if (thinkStartIndex === -1) {
    return {
      normalContent: text,
      thinkingContent: null,
      hasThinking: false,
    };
  }

  const thinkEndIndex = text.indexOf('</think>');
  const normalBeforeThink = text.slice(0, thinkStartIndex);

  if (thinkEndIndex === -1) {
    // Incomplete (still streaming)
    const thinkingContent = text.slice(thinkStartIndex + 7);
    return {
      normalContent: normalBeforeThink,
      thinkingContent,
      hasThinking: true,
      isThinkingComplete: false,
      normalAfterThink: '',
    };
  } else {
    // Complete
    const thinkingContent = text.slice(thinkStartIndex + 7, thinkEndIndex);
    const normalAfterThink = text.slice(thinkEndIndex + 8);
    return {
      normalContent: normalBeforeThink,
      thinkingContent,
      hasThinking: true,
      isThinkingComplete: true,
      normalAfterThink,
    };
  }
};
```

**ThinkingBlock component** renders in collapsible/expandable UI.

### Extension Points for Custom Message Types

To add a new message type (e.g., `tool_call`):

**1. Update Message type**:
```typescript
export type Message = {
  // ... existing fields
  role: 'user' | 'assistant' | 'system' | 'event' | 'tool_call';
};
```

**2. Add persistence** (chatRepository.ts):
```typescript
export const persistMessage = async (...) => {
  // roles: 'user', 'assistant', 'system', 'event', 'tool_call'
  // 'tool_call' messages don't update lastUsed timestamp
  if (message.role !== 'event' && message.role !== 'tool_call') {
    await db.runAsync(`UPDATE chats SET lastUsed = ? WHERE id = ?`, ...);
  }
};
```

**3. Add rendering** (MessageItem.tsx):
```typescript
{role === 'tool_call' ? (
  <View style={styles.toolCallMessage}>
    <Text style={styles.toolCallTitle}>{content}</Text>
    {/* Render tool result */}
  </View>
) : role === 'event' ? (
  // existing event rendering
) : (
  // existing user/assistant rendering
)}
```

**4. Add styles**:
```typescript
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    toolCallMessage: {
      backgroundColor: theme.bg.softSecondary,
      borderLeftWidth: 3,
      borderLeftColor: theme.bg.main,
      padding: 12,
      marginVertical: 8,
      borderRadius: 8,
    },
    toolCallTitle: {
      fontFamily: fontFamily.medium,
      color: theme.text.primary,
    },
  });
```

---

## 8. What to Steal vs What to Skip

### STEAL: High-Value Patterns for Loom

1. **Zustand factory pattern with DB context**
   - Store initialization in `db.ts` (call `.setDB()` on all stores)
   - Each store has `db: SQLiteDatabase | null` state
   - Actions wrap DB calls with null-checks
   - **Loom benefit**: Matches current store architecture, no learning curve

2. **Phantom chat pattern**
   - Reserve next ID before creating chat
   - Store in `phantomChat` state (not in DB)
   - Atomically convert to real chat on first send
   - **Loom benefit**: Eliminates blank screen during chat creation

3. **Drawer with date-grouped sessions**
   - Helper function groups chats by relative date ("Today", "Last week", etc.)
   - Active state via pathname comparison
   - Full-width swipe edge
   - **Loom benefit**: Same grouping Loom v1 had, proven UX

4. **CustomKeyboardAvoidingView wrapper**
   - Centralizes kb offset calculation
   - Platform-specific header heights
   - Uses `react-native-keyboard-controller` (better than standard)
   - **Loom benefit**: Copy directly, adjust for Loom header heights

5. **Send button state machine**
   - Three states: Generating (pause), Idle+text (send), Idle+empty (mic)
   - Left action buttons (Sources, Think) always visible
   - **Loom benefit**: Same pattern swd approved in Phase 69

6. **Scroll-to-bottom with threshold**
   - `distanceFromBottom < 50` (not exact 0)
   - Re-evaluates on `onContentSizeChange`
   - Auto-scroll if last message is placeholder
   - **Loom benefit**: Prevents jitter when user is near bottom

7. **Theme context with safe-area insets**
   - Single `Theme` type includes `insets` from `useSafeAreaInsets()`
   - Components access via `theme.insets.bottom` in styles
   - Automatic dark mode support
   - **Loom benefit**: Works with NativeWind patterns, swd's preference

8. **Message persistence flow**
   - Add user message to state + DB
   - Add assistant placeholder
   - Update placeholder as tokens arrive
   - Persist final message
   - **Loom benefit**: Same pattern as Phase 69, proven stream handling

9. **Markdown rendering with code copy**
   - Custom rules for `code_block` and `fence`
   - Copy button with `@react-native-clipboard`
   - Toast notification on copy
   - **Loom benefit**: Needed for Loom chat (already planned)

10. **Model selection sheet pattern**
    - Bottom sheet from `@gorhom/bottom-sheet`
    - Ref-based presentation/dismissal
    - Modal backdrop auto-managed
    - **Loom benefit**: Industry standard, no friction

11. **Performance metrics display**
    - Optionally show `ttft` (time to first token) and `tps` (tokens per second)
    - Hidden if values are 0
    - Small metadata text below assistant message
    - **Loom benefit**: Matches Phase 69 spec (D-01 testing output)

12. **Icon strategy**
    - SVG imports with theme color application
    - `style={{ color: theme.text.primary }}`
    - Width/height as props
    - **Loom benefit**: Flexible, matches NativeWind patterns

### SKIP: Private Mind–Specific, Don't Transplant

1. **react-native-executorch integration**
   - Private Mind runs local LLMs (Phi, Llama, etc.)
   - Loom uses remote APIs (Claude, Gemini, GPT)
   - Skip entire `llmInstance`, `loadModel()`, download states
   - **Reason**: Different model architecture entirely

2. **Speech input (STT)**
   - Private Mind has microphone recording
   - Loom doesn't need STT (text-only initially)
   - Skip `ChatSpeechInput`, audio permissions
   - **Reason**: Out of scope for current Loom phase

3. **Model management UI**
   - Model hub, benchmarking, model downloads
   - Loom has provider selection (not local models)
   - Skip `model-hub`, `benchmark` screens
   - **Reason**: Different model paradigm

4. **RAG/vector stores**
   - Private Mind has document uploads + embeddings
   - Loom doesn't (chat only, no RAG)
   - Skip `VectorStoreProvider`, `SourceSelectSheet`
   - **Reason**: Future phase, not Phase 69

5. **Export/import functionality**
   - Private Mind can export chats as JSON
   - Loom doesn't need this initially
   - Skip `exportImportRepository`
   - **Reason**: Nice-to-have, not MVP

6. **Thinking block rendering**
   - Private Mind shows `<think>` blocks in collapsible UI
   - Loom's streaming markdown is different
   - Can steal parsing logic, skip UI
   - **Reason**: Implement Loom-style thinking (not a collapsible card)

7. **Detour SDK integration**
   - Private Mind uses `@swmansion/react-native-detour` for deep links
   - Loom doesn't have this yet
   - Skip `DetourProvider`, `detourConfig`
   - **Reason**: Future feature, not Phase 69

8. **AsyncStorage for default settings**
   - Private Mind stores default chat settings in AsyncStorage
   - Loom uses MMKV (better, encryption built-in)
   - Replace with MMKV if needed
   - **Reason**: MMKV is Loom's standard

---

## Summary: Concrete Recommendations for Loom

### Immediate Adoption (Copy as-is)
1. **CustomKeyboardAvoidingView** → `src/mobile/utils/CustomKeyboardAvoidingView.tsx` (adjust header heights)
2. **Drawer grouping logic** → `src/mobile/components/DrawerMenu.tsx` (rename to match Loom naming)
3. **Theme context** → `src/mobile/context/ThemeContext.tsx` (integrate with NativeWind theme)
4. **Send button state machine** → `src/mobile/components/ChatBar.tsx` actions
5. **Message persistence pattern** → Adapt to Loom's WebSocket + store flow

### Patterns to Adapt
1. **Phantom chat**: Loom already has stub sessions — refine with Private Mind's approach
2. **Markdown rendering**: Use `react-native-enriched-markdown` (mentioned in Phase 69), add code copy
3. **Scroll-to-bottom**: Implement threshold-based detection
4. **Thinking blocks**: Parse `<think>` tags, but render as Loom design (not collapsible card)

### Dependencies to Add (if not present)
- `react-native-keyboard-controller` (already in Phase 68? check)
- `@gorhom/bottom-sheet` (likely present)
- `@react-native-clipboard/clipboard` (for code copy)
- `react-native-toast-message` (for notifications)

### Architecture Note
Private Mind proves that **Zustand + expo-sqlite + context** scales well for a production chat app. Loom's Phase 68-69 mirrors this approach — staying the course is correct.

