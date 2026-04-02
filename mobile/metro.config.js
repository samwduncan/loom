const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the shared/ workspace package for live updates
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// Resolve from mobile's own node_modules first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  ...(config.resolver.nodeModulesPaths || []),
];

// Force single copies of React — prevents duplicate React instances
// when shared/ imports resolve react from the monorepo root
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
};

// Block root node_modules react/react-native from being resolved
// This is the hard guarantee — extraNodeModules alone isn't sufficient
// because transitive deps can still find the root copy
const rootReactPaths = [
  path.resolve(monorepoRoot, "node_modules", "react"),
  path.resolve(monorepoRoot, "node_modules", "react-native"),
  path.resolve(monorepoRoot, "node_modules", "react-dom"),
];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const blockPatterns = rootReactPaths.map(
  (p) => new RegExp(`^${escapeRegex(p)}(/|$)`)
);
const existingBlockList = config.resolver.blockList || [];
const blockArray = Array.isArray(existingBlockList)
  ? existingBlockList
  : [existingBlockList];
config.resolver.blockList = [...blockArray, ...blockPatterns];

module.exports = withNativeWind(config, { input: "./global.css" });
