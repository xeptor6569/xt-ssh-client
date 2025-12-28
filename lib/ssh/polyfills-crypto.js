/**
 * Polyfill for Node.js crypto module
 * Uses react-native-get-random-values and other available crypto APIs
 */

// Import get-random-values first (already imported in polyfills.ts, but ensure it's here)
require('react-native-get-random-values');

// For React Native, we need to use available crypto APIs
// Note: Full crypto support may be limited - ssh2 will use what's available
const crypto = {
  createCipheriv: (algorithm, key, iv) => {
    // This is a stub - actual implementation would need native crypto
    throw new Error('crypto.createCipheriv requires native crypto implementation');
  },
  createDecipheriv: (algorithm, key, iv) => {
    throw new Error('crypto.createDecipheriv requires native crypto implementation');
  },
  createHmac: (algorithm, key) => {
    throw new Error('crypto.createHmac requires native crypto implementation');
  },
  randomFillSync: (buffer, offset, size) => {
    // Use get-random-values for random bytes
    const crypto = require('react-native-get-random-values');
    if (typeof crypto.getRandomValues === 'function') {
      const arr = new Uint8Array(buffer.length);
      crypto.getRandomValues(arr);
      buffer.set(arr);
      return buffer;
    }
    throw new Error('randomFillSync not available');
  },
  timingSafeEqual: (a, b) => {
    // Simple constant-time comparison (not perfect but works)
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  },
  createHash: (algorithm) => {
    throw new Error('crypto.createHash requires native crypto implementation');
  },
  createSign: (algorithm) => {
    throw new Error('crypto.createSign requires native crypto implementation');
  },
  createVerify: (algorithm) => {
    throw new Error('crypto.createVerify requires native crypto implementation');
  },
  randomBytes: (size, callback) => {
    const buffer = Buffer.allocUnsafe(size);
    try {
      const crypto = require('react-native-get-random-values');
      if (typeof crypto.getRandomValues === 'function') {
        const arr = new Uint8Array(size);
        crypto.getRandomValues(arr);
        buffer.set(arr);
        if (callback) {
          callback(null, buffer);
        }
        return buffer;
      }
    } catch (e) {
      // Fallback
    }
    if (callback) {
      callback(new Error('randomBytes not available'));
    }
    return buffer;
  },
  getRandomValues: (arr) => {
    const crypto = require('react-native-get-random-values');
    return crypto.getRandomValues(arr);
  },
  // getCiphers - returns list of supported cipher algorithms
  getCiphers: () => {
    // Return common cipher algorithms that ssh2 might use
    // This is a minimal list - actual implementation would need native crypto
    return [
      'aes-128-cbc', 'aes-192-cbc', 'aes-256-cbc',
      'aes-128-ctr', 'aes-192-ctr', 'aes-256-ctr',
      'aes-128-gcm', 'aes-192-gcm', 'aes-256-gcm',
      'aes128-gcm', 'aes192-gcm', 'aes256-gcm',
      'chacha20-poly1305',
      '3des-cbc', 'blowfish-cbc', 'cast128-cbc',
      'arcfour', 'arcfour128', 'arcfour256',
    ];
  },
  // getHashes - returns list of supported hash algorithms
  getHashes: () => {
    // Return common hash algorithms that ssh2 might use
    return [
      'sha1', 'sha256', 'sha512',
      'md5', 'ripemd160',
      'sha224', 'sha384',
    ];
  },
  // Additional functions that ssh2 might need
  createECDH: (curveName) => {
    throw new Error('crypto.createECDH requires native crypto implementation');
  },
  sign: (algorithm, data, key) => {
    throw new Error('crypto.sign requires native crypto implementation');
  },
  verify: (algorithm, data, key, signature) => {
    throw new Error('crypto.verify requires native crypto implementation');
  },
};

module.exports = crypto;
module.exports.default = crypto;

