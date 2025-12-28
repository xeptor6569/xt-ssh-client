/**
 * Stub implementation of Node.js fs module
 * ssh2 may try to require this for reading files
 */
const fs = {
  readFile: (path, encoding, callback) => {
    // This is a stub - actual file reading would need to be implemented
    // For SSH key reading, we handle it differently in React Native
    if (typeof encoding === 'function') {
      encoding(new Error('fs.readFile not available in React Native - use SecureStore or file system APIs'));
    } else if (callback) {
      callback(new Error('fs.readFile not available in React Native - use SecureStore or file system APIs'));
    }
  },
  readFileSync: (path, encoding) => {
    throw new Error('fs.readFileSync not available in React Native - use SecureStore or file system APIs');
  },
  existsSync: (path) => {
    // Stub - return false
    return false;
  },
  statSync: (path) => {
    throw new Error('fs.statSync not available in React Native');
  },
};

module.exports = fs;
module.exports.default = fs;

