// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add extra node modules that should be resolved
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Map Node.js core modules to polyfills
  // Use our wrapper for stream to ensure proper exports
  'stream': path.resolve(__dirname, 'lib/ssh/polyfills-stream.js'),
  'util': 'util',
  'buffer': 'buffer',
  'process': 'process',
  'events': 'events',
  // Map http/https/tls/net/path/fs/child_process/crypto/zlib/dns/assert to our stub implementations (use .js files for Metro)
  'http': path.resolve(__dirname, 'lib/ssh/polyfills-http.js'),
  'https': path.resolve(__dirname, 'lib/ssh/polyfills-https.js'),
  'tls': path.resolve(__dirname, 'lib/ssh/polyfills-tls.js'),
  'net': path.resolve(__dirname, 'lib/ssh/polyfills-net.js'),
  'path': path.resolve(__dirname, 'lib/ssh/polyfills-path.js'),
  'fs': path.resolve(__dirname, 'lib/ssh/polyfills-fs.js'),
  'child_process': path.resolve(__dirname, 'lib/ssh/polyfills-child_process.js'),
  // Use react-native-quick-crypto for native crypto implementation
  'crypto': 'react-native-quick-crypto',
  'zlib': path.resolve(__dirname, 'lib/ssh/polyfills-zlib.js'),
  'dns': path.resolve(__dirname, 'lib/ssh/polyfills-dns.js'),
  'assert': path.resolve(__dirname, 'lib/ssh/polyfills-assert.js'),
  // Map native Node.js addons to stubs (must be before node_modules lookup)
  'cpu-features': path.resolve(__dirname, 'lib/ssh/polyfills-cpu-features.js'),
};

// Use resolveRequest to intercept module resolution before Metro looks in node_modules
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Intercept cpu-features before it tries to load the native module
  // Check both the package name and any relative paths to cpu-features
  if (moduleName === 'cpu-features' || 
      (typeof moduleName === 'string' && (
        moduleName.includes('cpu-features') ||
        moduleName.includes('cpufeatures.node') ||
        moduleName.endsWith('.node')
      ))) {
    return {
      filePath: path.resolve(__dirname, 'lib/ssh/polyfills-cpu-features.js'),
      type: 'sourceFile',
    };
  }
  
  // Resolve crypto to react-native-quick-crypto (handled in extraNodeModules, but ensure it works)
  if (moduleName === 'crypto') {
    try {
      const cryptoPath = require.resolve('react-native-quick-crypto', { paths: [__dirname] });
      return {
        filePath: cryptoPath,
        type: 'sourceFile',
      };
    } catch (e) {
      // Fallback to default resolver if quick-crypto not found
    }
  }
  
  // Use default resolver for other modules
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  
  // Fallback to default Metro resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Also block .node files in source extensions
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes('node')) {
  // Don't add .node to source extensions - we don't want Metro to try to process them
}

module.exports = config;

