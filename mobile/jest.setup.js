// Reanimated mock -- must be first
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
