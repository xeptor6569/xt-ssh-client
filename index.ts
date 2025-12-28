// Load polyfills FIRST before anything else
// This ensures Node.js modules are available when ssh2 is imported
import './lib/ssh/polyfills';

// Initialize react-native-quick-crypto (must be before any crypto usage)
// This provides native crypto implementations for SSH
try {
  const { install } = require('react-native-quick-crypto');
  install();
} catch (error) {
  console.warn('react-native-quick-crypto not available:', error);
  // Crypto operations will fail, but app can still load
}

// Expo Router entry point
import 'expo-router/entry';
