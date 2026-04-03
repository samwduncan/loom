# Galaxies ChatGPT Clone: Zeego & Expo Router Study

**Source:** https://github.com/Galaxies-dev/chatgpt-clone-react-native
**Study Date:** 2026-04-03
**Purpose:** Extract context menu patterns and drawer navigation structure for Loom v3.0

---

## 1. Zeego Context Menu Implementation

### 1.1 Session List (Drawer) Context Menu

**File:** `app/(auth)/(drawer)/_layout.tsx` (lines 91-128)

The Galaxies app wraps each drawer chat item with `ContextMenu.Root/Trigger/Content`:

```tsx
{history.map((chat) => (
  <ContextMenu.Root key={chat.id}>
    <ContextMenu.Trigger>
      <DrawerItem
        label={chat.title}
        onPress={() => router.push(`/(auth)/(drawer)/(chat)/${chat.id}`)}
        inactiveTintColor="#000"
      />
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Preview>
        {() => (
          <View style={{ padding: 16, height: 200, backgroundColor: '#fff' }}>
            <Text>{chat.title}</Text>
          </View>
        )}
      </ContextMenu.Preview>

      <ContextMenu.Item key={'rename'} onSelect={() => onRenameChat(chat.id)}>
        <ContextMenu.ItemTitle>Rename</ContextMenu.ItemTitle>
        <ContextMenu.ItemIcon
          ios={{
            name: 'pencil',
            pointSize: 18,
          }}
        />
      </ContextMenu.Item>
      <ContextMenu.Item key={'delete'} onSelect={() => onDeleteChat(chat.id)} destructive>
        <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
        <ContextMenu.ItemIcon
          ios={{
            name: 'trash',
            pointSize: 18,
          }}
        />
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
))}
```

**Key Observations:**
- `ContextMenu.Root` wraps the entire item
- `ContextMenu.Trigger` wraps the interactive element (`DrawerItem`)
- `ContextMenu.Content` contains the preview + menu items
- Menu items use `onSelect` callback for actions
- `destructive` prop marks delete as red/destructive
- Icons use iOS system names (SF Symbols): `pencil`, `trash`
- Preview is optional (shown via long-press in iOS)

### 1.2 Image Context Menu

**File:** `components/ChatMessage.tsx` (lines 42-67)

The image message uses a similar pattern for copy/save/share:

```tsx
{content === '' && imageUrl ? (
  <ContextMenu.Root>
    <ContextMenu.Trigger>
      <Link
        href={`/(auth)/(modal)/image/${encodeURIComponent(
          imageUrl
        )}?prompt=${encodeURIComponent(prompt!)}`}
        asChild>
        <Pressable>
          <Image source={{ uri: imageUrl }} style={styles.previewImage} />
        </Pressable>
      </Link>
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      {contextItems.map((item, index) => (
        <ContextMenu.Item key={item.title} onSelect={item.action}>
          <ContextMenu.ItemTitle>{item.title}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: item.systemIcon,
              pointSize: 18,
            }}
          />
        </ContextMenu.Item>
      ))}
    </ContextMenu.Content>
  </ContextMenu.Root>
) : (
  <Text style={styles.text}>{content}</Text>
)}
```

**Pattern:** Wrap a Pressable that's inside a Link, with ContextMenu.Root — enables both tap (navigate) and long-press (context menu).

### 1.3 Menu Item Definition

**File:** `components/ChatMessage.tsx` (lines 15-23)

```tsx
const contextItems = [
  { title: 'Copy', systemIcon: 'doc.on.doc', action: () => copyImageToClipboard(imageUrl!) },
  {
    title: 'Save to Photos',
    systemIcon: 'arrow.down.to.line',
    action: () => downloadAndSaveImage(imageUrl!),
  },
  { title: 'Share', systemIcon: 'square.and.arrow.up', action: () => shareImage(imageUrl!) },
];
```

Items are data-driven. System icons are SF Symbols names.

---

## 2. Zeego Dropdown Menu (Header & General)

### 2.1 HeaderDropDown Component

**File:** `components/HeaderDropDown.tsx` (full file)

```tsx
import Colors from '@/constants/Colors';
import { Text, View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

export type Props = {
  title: string;
  items: Array<{
    key: string;
    title: string;
    icon: string;
  }>;
  selected?: string;
  onSelect: (key: string) => void;
};

const HeaderDropDown = ({ title, selected, items, onSelect }: Props) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontWeight: '500', fontSize: 16 }}>{title}</Text>
          {selected && (
            <Text
              style={{ marginLeft: 10, fontSize: 16, fontWeight: '500', color: Colors.greyLight }}>
              {selected} &gt;
            </Text>
          )}
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {items.map((item) => (
          <DropdownMenu.Item key={item.key} onSelect={() => onSelect(item.key)}>
            <DropdownMenu.ItemTitle>{item.title}</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon
              ios={{
                name: item.icon,
                pointSize: 18,
              }}
            />
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
export default HeaderDropDown;
```

**Usage in ChatPage:**

```tsx
<Stack.Screen
  options={{
    headerTitle: () => (
      <HeaderDropDown
        title="ChatGPT"
        items={[
          { key: '3.5', title: 'GPT-3.5', icon: 'bolt' },
          { key: '4', title: 'GPT-4', icon: 'sparkles' },
        ]}
        onSelect={onGptVersionChange}
        selected={gptVersion}
      />
    ),
  }}
/>
```

**Key Pattern:**
- Trigger component is just a `View` (text + chevron) — doesn't need to be a button
- Dropdown appears below trigger
- Icons in header dropdown use SF Symbols: `bolt`, `sparkles`
- Selected item can be displayed in trigger via `selected` prop

### 2.2 Generic DropDownMenu Component

**File:** `components/DropDownMenu.tsx` (full file)

```tsx
import { Ionicons } from '@expo/vector-icons';
import * as DropdownMenu from 'zeego/dropdown-menu';

export type Props = {
  items: Array<{
    key: string;
    title: string;
    icon: string;
  }>;
  onSelect: (key: string) => void;
};

const DropDownMenu = ({ items, onSelect }: Props) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Ionicons name="ellipsis-horizontal" size={24} color={'#fff'} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {items.map((item) => (
          <DropdownMenu.Item key={item.key} onSelect={() => onSelect(item.key)}>
            <DropdownMenu.ItemTitle>{item.title}</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon
              ios={{
                name: item.icon,
                pointSize: 18,
              }}
            />
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
export default DropDownMenu;
```

**Usage:** Trigger can be an icon (Ionicons ellipsis) or any React Native component.

---

## 3. Expo Router Drawer Nesting

### 3.1 Route Structure

```
app/
├── _layout.tsx              # Root stack with auth protection
├── index.tsx                # Login screen
├── login.tsx                # Login modal
└── (auth)/                  # Auth group
    ├── _layout.tsx          # SQLite + RevenueCat providers, Stack with modals
    └── (drawer)/            # Drawer navigator
        ├── _layout.tsx      # Drawer.Screen definitions, CustomDrawerContent
        ├── (chat)/          # Chat group (NO separate _layout.tsx)
        │   ├── new.tsx      # New chat (redirect to ChatPage)
        │   └── [id].tsx     # Chat by ID (redirect to ChatPage)
        ├── dalle.tsx        # DALL·E page
        ├── explore.tsx      # Explore GPTs page
        └── (modal)/         # Modal group
            ├── settings.tsx
            ├── purchase.tsx
            └── image/
                └── [url].tsx
```

**Key:** The `(chat)` folder does NOT have its own `_layout.tsx` — it's just a route group for organization. All screens are under the drawer.

### 3.2 Root Auth Protection (_layout.tsx)

**File:** `app/_layout.tsx` (lines 32-61, 95-106)

```tsx
const InitialLayout = () => {
  const [loaded, error] = useFonts({...});
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/(drawer)/(chat)/new');
    } else if (!isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn]);

  // ... font loading splash screen logic

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
};

const RootLayoutNav = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <InitialLayout />
      </GestureHandlerRootView>
    </ClerkProvider>
  );
};
```

**Pattern:**
- Auth check in `useEffect` based on `segments[0]`
- Unauthenticated users see `index.tsx` (login screen)
- Authenticated users redirect to the auth group's drawer
- Uses `router.replace()` (not `push()`) to avoid history stack

### 3.3 Auth Layout (Providers)

**File:** `app/(auth)/_layout.tsx` (full file)

```tsx
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { SQLiteProvider } from 'expo-sqlite/next';
import { migrateDbIfNeeded } from '@/utils/Database';
import { RevenueCatProvider } from '@/providers/RevenueCat';

const Layout = () => {
  const router = useRouter();

  return (
    <RevenueCatProvider>
      <SQLiteProvider databaseName="chat.db" onInit={migrateDbIfNeeded}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: Colors.selected },
          }}>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(modal)/settings"
            options={{
              headerTitle: 'Settings',
              presentation: 'modal',
              headerShadowVisible: false,
              headerStyle: { backgroundColor: Colors.selected },
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ backgroundColor: Colors.greyLight, borderRadius: 20, padding: 4 }}>
                  <Ionicons name="close-outline" size={16} color={Colors.grey} />
                </TouchableOpacity>
              ),
            }}
          />
          {/* More modals... */}
        </Stack>
      </SQLiteProvider>
    </RevenueCatProvider>
  );
};

export default Layout;
```

**Key Points:**
- Providers wrap the `Stack`
- `(drawer)` is a screen in the stack (hidden header)
- Modals are defined as separate `Stack.Screen` entries with `presentation: 'modal'`
- Modal styling is centralized here

### 3.4 Drawer Layout (CustomDrawerContent)

**File:** `app/(auth)/(drawer)/_layout.tsx` (lines 28-150, 152-270)

The `CustomDrawerContent` component is passed to the Drawer navigator:

```tsx
const Layout = () => {
  const navigation = useNavigation();
  const dimensions = useWindowDimensions();
  const { user } = useRevenueCat();
  const router = useRouter();

  return (
    <Drawer
      drawerContent={CustomDrawerContent}  // Custom component
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer)}
            style={{ marginLeft: 16 }}>
            <FontAwesome6 name="grip-lines" size={20} color={Colors.grey} />
          </TouchableOpacity>
        ),
        headerStyle: { backgroundColor: Colors.light },
        headerShadowVisible: false,
        drawerActiveBackgroundColor: Colors.selected,
        drawerActiveTintColor: '#000',
        drawerInactiveTintColor: '#000',
        overlayColor: 'rgba(0, 0, 0, 0.2)',
        drawerItemStyle: { borderRadius: 12 },
        drawerLabelStyle: { marginLeft: -20 },
        drawerStyle: { width: dimensions.width * 0.86 },
      }}>
      <Drawer.Screen
        name="(chat)/new"
        getId={() => Math.random().toString()}  // New instance each open
        options={{
          title: 'ChatGPT',
          drawerIcon: () => <View>...</View>,
          headerRight: () => <CreateNewButton />,
        }}
      />
      <Drawer.Screen
        name="(chat)/[id]"
        options={{
          drawerItemStyle: { display: 'none' },  // Hide from sidebar
          headerRight: () => <CreateNewButton />,
        }}
      />
      <Drawer.Screen name="dalle" options={...} />
      <Drawer.Screen name="explore" options={...} />
    </Drawer>
  );
};
```

**Custom Drawer Content:**

```tsx
export const CustomDrawerContent = (props: any) => {
  const { bottom, top } = useSafeAreaInsets();
  const db = useSQLiteContext();
  const isDrawerOpen = useDrawerStatus() === 'open';
  const [history, setHistory] = useState<Chat[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadChats();
    Keyboard.dismiss();
  }, [isDrawerOpen]);

  const loadChats = async () => {
    const result = (await getChats(db)) as Chat[];
    setHistory(result);
  };

  const onDeleteChat = (chatId: number) => {
    Alert.alert('Delete Chat', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await db.runAsync('DELETE FROM chats WHERE id = ?', chatId);
          loadChats();
        },
      },
    ]);
  };

  const onRenameChat = (chatId: number) => {
    Alert.prompt('Rename Chat', 'Enter a new name', async (newName) => {
      if (newName) {
        await renameChat(db, chatId, newName);
        loadChats();
      }
    });
  };

  return (
    <View style={{ flex: 1, marginTop: top }}>
      {/* Search header */}
      <View style={{ backgroundColor: '#fff', paddingBottom: 10 }}>
        <View style={styles.searchSection}>
          <Ionicons style={styles.searchIcon} name="search" size={20} />
          <TextInput style={styles.input} placeholder="Search" />
        </View>
      </View>

      {/* Default drawer items + custom history */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: '#fff' }}>
        <DrawerItemList {...props} />
        {history.map((chat) => (
          <ContextMenu.Root key={chat.id}>
            <ContextMenu.Trigger>
              <DrawerItem
                label={chat.title}
                onPress={() => router.push(`/(auth)/(drawer)/(chat)/${chat.id}`)}
                inactiveTintColor="#000"
              />
            </ContextMenu.Trigger>
            {/* Context menu with rename/delete */}
          </ContextMenu.Root>
        ))}
      </DrawerContentScrollView>

      {/* User profile footer */}
      <View style={{ padding: 16, paddingBottom: 10 + bottom }}>
        <Link href="/(auth)/(modal)/settings" asChild>
          <TouchableOpacity style={styles.footer}>
            <Image source={...} style={styles.avatar} />
            <Text style={styles.userName}>Mika Meerkat</Text>
            <Ionicons name="ellipsis-horizontal" size={24} />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};
```

**Key Custom Drawer Patterns:**
- `DrawerContentScrollView` wraps content with built-in scroll
- `DrawerItemList {...props}` renders default drawer items
- Custom items (history chats) added after defaults
- `useDrawerStatus() === 'open'` to reload chats when drawer opens
- Search input at top
- User profile link at bottom with footer styling
- Both components wrapped in `<Link asChild>` for navigation

### 3.5 Navigation Patterns

**Navigating to chat by ID:**
```tsx
router.push(`/(auth)/(drawer)/(chat)/${chat.id}`)
```

**Navigating to modal from drawer:**
```tsx
router.navigate('/(auth)/(modal)/purchase')  // Full path
```

**Back navigation:**
```tsx
router.back()  // From modal
```

**Replace (no history):**
```tsx
router.replace('/(auth)/(drawer)/(chat)/new')  // On login
```

---

## 4. Route Parameters & Deep Linking

### 4.1 Chat by ID

**File:** `app/(auth)/(drawer)/(chat)/[id].tsx`
```tsx
export { default } from '@/components/ChatPage';
```

**ChatPage retrieves ID:**
```tsx
const { id } = useLocalSearchParams<{ id: string }>();

useEffect(() => {
  if (id) {
    getMessages(db, parseInt(id)).then((res) => {
      setMessages(res);
    });
  }
}, [id]);
```

### 4.2 Image Modal with URL & Prompt

**File:** `app/(auth)/(modal)/image/[url].tsx`

Navigated from ChatMessage:
```tsx
<Link
  href={`/(auth)/(modal)/image/${encodeURIComponent(
    imageUrl
  )}?prompt=${encodeURIComponent(prompt!)}`}
  asChild>
  <Pressable>
    <Image source={{ uri: imageUrl }} style={styles.previewImage} />
  </Pressable>
</Link>
```

This passes both `[url]` (path param) and `prompt` (query string).

---

## 5. What's Worth Stealing for Loom

### 5.1 Pattern: Zeego Context Menu on List Items

**✅ STEAL THIS:** The composition of `ContextMenu.Root > Trigger > Content + Preview` is clean and flexible.

**Implementation steps for Loom session list:**
1. Wrap each DrawerItem with `ContextMenu.Root`
2. Define menu items (rename, delete, archive) as `ContextMenu.Item`
3. Use `destructive` prop for delete
4. Use SF Symbols for icons (`pencil`, `trash`, `archive`, etc.)

**Code snippet to adapt:**
```tsx
<ContextMenu.Root key={sessionId}>
  <ContextMenu.Trigger>
    <DrawerItem
      label={sessionTitle}
      onPress={() => router.push(`/(auth)/(drawer)/(chat)/${sessionId}`)}
    />
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Preview>
      {() => <SessionPreview session={session} />}
    </ContextMenu.Preview>
    {/* Rename, Delete, Archive items */}
  </ContextMenu.Content>
</ContextMenu.Root>
```

### 5.2 Pattern: CustomDrawerContent with Search + Footer

**✅ STEAL THIS:** The drawer layout pattern is solid.

**Implementation for Loom:**
- Use `DrawerContentScrollView` for scrollable area
- Place `DrawerItemList {...props}` first (renders static drawer items)
- Add custom content below (session history with context menus)
- Footer with user profile link or settings

### 5.3 Pattern: Dropdown Menu in Header

**✅ STEAL THIS:** The reusable `HeaderDropDown` component is generic and well-composed.

**For Loom:** Use as template for model/provider selector in header:
- Data-driven item list
- onSelect callback
- Optional `selected` display

### 5.4 Pattern: Modal Dialog for Rename/Delete

**⚠️ USE WITH CAUTION:** Galaxies uses `Alert.alert()` and `Alert.prompt()` for dialogs. This is simple but:
- Limited styling options
- Native Android/iOS feel (not always desired)
- Not dismissible by tapping outside

**Alternative for Loom:** Consider a custom modal or bottom sheet for rename/delete.

### 5.5 Pattern: Auth Protection with Segments

**✅ STEAL THIS:** The auth check logic is clean:
```tsx
useEffect(() => {
  if (!isLoaded) return;
  const inAuthGroup = segments[0] === '(auth)';
  
  if (isSignedIn && !inAuthGroup) {
    router.replace('/(auth)/(drawer)/(chat)/new');
  } else if (!isSignedIn) {
    router.replace('/');
  }
}, [isSignedIn]);
```

---

## 6. What's Tutorial-Grade (Avoid)

### 6.1 OpenAI Library Integration

**File:** `components/ChatPage.tsx` (lines 46-81)

```tsx
const openAI = useMemo(
  () =>
    new OpenAI({
      apiKey: key,
      organization,
    }),
  []
);

useEffect(() => {
  const handleNewMessage = (payload: any) => {
    setMessages((messages) => {
      const newMessage = payload.choices[0]?.delta.content;
      if (newMessage) {
        messages[messages.length - 1].content += newMessage;
        return [...messages];
      }
      if (payload.choices[0]?.finishReason) {
        addMessage(db, parseInt(chatIdRef.current), {...});
      }
      return messages;
    });
  };

  openAI.chat.addListener('onChatMessageReceived', handleNewMessage);
  return () => {
    openAI.chat.removeListener('onChatMessageReceived');
  };
}, [openAI]);
```

**Issue:** This is a naive streaming implementation:
- Direct mutation of array (`messages[messages.length - 1].content +=`)
- Listener-based approach (not elegant)
- No error handling or reconnection logic
- Simple but not production-ready

**For Loom:** Use Loom's mature streaming multiplexer and tokenBudget management instead.

### 6.2 SQLite Chat History

**Files:** `utils/Database.ts`, chat schema

While SQLite is reasonable, Galaxies' implementation is minimal:
- No migrations beyond initial schema
- Simple insert/delete queries
- No complex filtering or search

**For Loom:** Loom's existing JSONL + SQLite cache strategy is more sophisticated and proven.

### 6.3 RevenueCat Paywall Integration

**File:** `providers/RevenueCat.tsx`, usage in `dalle` screen

```tsx
listeners={{
  drawerItemPress: (e) => {
    e.preventDefault();
    if (!user.dalle) {
      router.navigate('/(auth)/(modal)/purchase');
    } else {
      router.navigate('/(auth)/dalle');
    }
  },
}}
```

**Issue:** This is specific to RevenueCat and not relevant to Loom's architecture.

---

## 7. Zeego Version & Dependencies

**From package.json:**
```json
{
  "zeego": "^1.10.0",
  "expo-router": "~3.4.8",
  "react-native": "0.73.6"
}
```

**Key dependencies:**
- `zeego` v1.10.0 (context-menu + dropdown-menu)
- `expo-router` v3.4.8 (file-based routing)
- `react-native-gesture-handler` (required by drawer)
- `react-native-reanimated` (animations)
- `@react-navigation/drawer` (drawer navigator)

---

## 8. Loom Integration Recommendations

### 8.1 Immediate Wins

1. **Session context menu:** Copy Zeego pattern directly for Loom session items
   - Rename, delete, archive, duplicate
   - Zeego's `ContextMenu.Preview` can show session preview

2. **Drawer structure:** Use Galaxies' `CustomDrawerContent` pattern
   - Search sessions
   - Render history with context menus
   - User profile footer

3. **Header dropdown:** Adapt `HeaderDropDown` for Loom's model/provider selector

### 8.2 What NOT to Copy

- SQLite implementation (Loom has better cache strategy)
- OpenAI streaming listener pattern (use multiplexer)
- RevenueCat integration (not applicable)
- Alert.prompt dialogs (consider custom modal)

### 8.3 Outstanding Questions for Loom

1. **Session preview in context menu:** Should `ContextMenu.Preview` show a mini chat summary or just the session title?
2. **Archive vs. Delete:** Galaxies only has delete. Should Loom support archive?
3. **Rename vs. Edit:** Should rename be inline or a modal?
4. **Settings modal:** Is the ellipsis (…) menu in drawer footer a separate dropdown or navigate to settings?

---

## 9. Code Snippets Ready to Adapt

### Context Menu on Session Item
```tsx
<ContextMenu.Root key={sessionId}>
  <ContextMenu.Trigger>
    <DrawerItem label={sessionTitle} onPress={handlePress} />
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Preview>
      {() => <SessionPreview {...session} />}
    </ContextMenu.Preview>
    <ContextMenu.Item onSelect={() => renameSession(sessionId)}>
      <ContextMenu.ItemTitle>Rename</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon ios={{ name: 'pencil', pointSize: 18 }} />
    </ContextMenu.Item>
    <ContextMenu.Item onSelect={() => deleteSession(sessionId)} destructive>
      <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon ios={{ name: 'trash', pointSize: 18 }} />
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
```

### Header Dropdown for Model Selection
```tsx
<Stack.Screen
  options={{
    headerTitle: () => (
      <HeaderDropDown
        title="Loom"
        items={availableModels.map(m => ({
          key: m.id,
          title: m.name,
          icon: m.icon,
        }))}
        onSelect={selectModel}
        selected={activeModel.name}
      />
    ),
  }}
/>
```

### Custom Drawer Content Structure
```tsx
export const CustomDrawerContent = (props: any) => {
  const { bottom, top } = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, [useDrawerStatus()]);

  return (
    <View style={{ flex: 1, marginTop: top }}>
      {/* Search / Header */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
        {/* Session list with context menus */}
      </DrawerContentScrollView>
      {/* User footer */}
    </View>
  );
};
```

---

## Summary

**Galaxies-dev's ChatGPT clone is a well-executed tutorial implementation.** The drawer nesting and Zeego context menu patterns are production-ready and directly applicable to Loom. The OpenAI/SQLite/RevenueCat integrations are specific to Galaxies and less relevant.

**For Loom v3.0:**
- Use Zeego context menus on session items (90% reusable)
- Adapt drawer layout pattern (CustomDrawerContent)
- Use HeaderDropDown as template for model selector
- Keep Loom's existing streaming multiplexer and store architecture
- Consider custom modals instead of Alert dialogs

**Next Step:** Implement Phase 70 (UI Polish for mobile) using these patterns, starting with session context menu.
