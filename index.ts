// Load polyfills before anything else so ssh2 can resolve Node globals.
import './lib/ssh/polyfills';

// Native crypto for SSH (no-op if the module is unavailable, e.g. web).
try {
  const { install } = require('react-native-quick-crypto');
  install();
} catch (error) {
  console.warn('react-native-quick-crypto not available:', error);
}

import 'expo-router/entry';
