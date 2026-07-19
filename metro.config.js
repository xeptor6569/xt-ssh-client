// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const stub = (name) => path.resolve(__dirname, `lib/ssh/polyfills-${name}.js`);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: stub('stream'),
  util: 'util',
  buffer: 'buffer',
  process: 'process',
  events: 'events',
  http: stub('http'),
  https: stub('https'),
  tls: stub('tls'),
  net: stub('net'),
  path: stub('path'),
  fs: stub('fs'),
  child_process: stub('child_process'),
  crypto: 'react-native-quick-crypto',
  zlib: stub('zlib'),
  dns: stub('dns'),
  assert: stub('assert'),
  'cpu-features': stub('cpu-features'),
};

const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'cpu-features' ||
    (typeof moduleName === 'string' &&
      (moduleName.includes('cpu-features') ||
        moduleName.includes('cpufeatures.node') ||
        moduleName.endsWith('.node')))
  ) {
    return {
      filePath: stub('cpu-features'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'crypto') {
    try {
      return {
        filePath: require.resolve('react-native-quick-crypto', {
          paths: [__dirname],
        }),
        type: 'sourceFile',
      };
    } catch {
      // Fall through to default resolver
    }
  }

  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
