/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/.reference/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-mmkv|expo-secure-store|expo-haptics|expo-blur|expo-symbols|@loom/shared)',
  ],
  moduleNameMapper: {
    '^@loom/shared/(.*)$': '<rootDir>/../shared/$1',
  },
};
