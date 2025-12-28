// Load polyfills FIRST before anything else
// This ensures Node.js modules are available when ssh2 is imported
import './lib/ssh/polyfills';

// Expo Router entry point
import 'expo-router/entry';
