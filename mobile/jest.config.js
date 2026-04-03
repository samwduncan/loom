// Skip @testing-library/react-native peer dep check -- monorepo has react@19.2.4
// at root (web app) but mobile uses react@19.1.0 (Expo SDK pinned). The versions
// are compatible but the strict equality check fails in monorepo hoisting.
process.env.RNTL_SKIP_DEPS_CHECK = '1';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/.reference/'],
  // Resolve from mobile/node_modules first (before root) so RN-specific packages
  // find react-native properly in the monorepo.
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>/node_modules'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-mmkv|expo-secure-store|expo-haptics|expo-blur|expo-symbols|@loom/shared|@testing-library|immer|zustand)',
  ],
  moduleNameMapper: {
    '^@loom/shared/(.*)$': '<rootDir>/../shared/$1',
    // Force all React packages to resolve from mobile/node_modules to avoid
    // dual-React-copy issues in the monorepo (root has 19.2.4, mobile has 19.1.0).
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-test-renderer$': '<rootDir>/node_modules/react-test-renderer',
    '^react-test-renderer/(.*)$': '<rootDir>/node_modules/react-test-renderer/$1',
  },
};
