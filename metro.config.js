const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Fast Refresh
config.transformer.enableFastRefresh = true;

// Enable source maps for better debugging
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Optimize resolver for faster builds
config.resolver.sourceExts = [...config.resolver.sourceExts, 'tsx', 'ts'];

// Enable experimental features for better development experience
config.transformer.experimentalImportSupport = true;
config.transformer.unstable_allowRequireContext = true;

module.exports = config; 