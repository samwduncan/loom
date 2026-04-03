// Mock react-native-worklets before reanimated imports it (reanimated 4.x dependency).
// Must export all symbols that reanimated imports from the worklets module.
jest.mock('react-native-worklets', () => ({
  WorkletsModule: {},
  RuntimeKind: { UI: 'UI', JS: 'JS' },
  isWorkletFunction: jest.fn(() => false),
  isWorkletRuntime: jest.fn(() => false),
  createSerializable: jest.fn((value) => value),
  createSynchronizable: jest.fn((value) => value),
  serializableMappingCache: new Map(),
  makeShareable: jest.fn((value) => value),
  runOnUI: jest.fn((fn) => fn),
  runOnJS: jest.fn((fn) => fn),
  runOnRuntime: jest.fn((fn) => fn),
  executeOnUIRuntimeSync: jest.fn((fn) => fn()),
  callMicrotasks: jest.fn(),
  createWorkletRuntime: jest.fn(),
}));

// Reanimated mock -- must be after worklets mock
require('react-native-reanimated').setUpTests();

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItem: jest.fn(() => null),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn((key, value) => store.set(key, value)),
      getString: jest.fn((key) => store.get(key) || undefined),
      getNumber: jest.fn((key) => store.get(key) || undefined),
      getBoolean: jest.fn((key) => store.get(key) || undefined),
      delete: jest.fn((key) => store.delete(key)),
      contains: jest.fn((key) => store.has(key)),
      clearAll: jest.fn(() => store.clear()),
    })),
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardProvider: ({ children }) => children,
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  useKeyboardHandler: jest.fn(),
}));

// Mock react-native AppState for websocket lifecycle tests.
// jest-expo provides a partial RN mock but AppState.addEventListener
// may not be available. We add it via spyOn in the setup file so
// individual tests can control the callback.
const { AppState } = require('react-native');
if (!AppState.addEventListener || !AppState.addEventListener.mock) {
  // Override addEventListener to be a jest.fn if it's not already
  const originalAddEventListener = AppState.addEventListener;
  AppState.addEventListener = jest.fn((...args) => {
    if (originalAddEventListener) {
      return originalAddEventListener.apply(AppState, args);
    }
    return { remove: jest.fn() };
  });
}
