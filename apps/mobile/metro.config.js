const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch workspace packages so Metro can resolve @tradecircle/* imports.
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages/api-client'),
  path.resolve(workspaceRoot, 'packages/shared-hooks'),
  path.resolve(workspaceRoot, 'packages/utils'),
];

// Resolve node_modules from the app first, then fall back to the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Pin singleton packages so only one copy is used.
config.resolver.extraNodeModules = {
  react:          path.resolve(projectRoot, 'node_modules/react'),
  'react-dom':    path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

module.exports = config;
