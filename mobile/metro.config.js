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

module.exports = withNativeWind(config, { input: "./global.css" });
