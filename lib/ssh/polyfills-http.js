/**
 * Stub implementation of Node.js http module
 * ssh2 may try to require this, but we use custom sockets
 */
const http = {
  request: () => {
    throw new Error('http module not available in React Native - use custom socket');
  },
  createServer: () => {
    throw new Error('http module not available in React Native - use custom socket');
  },
  get: () => {
    throw new Error('http module not available in React Native - use custom socket');
  },
};

module.exports = http;
module.exports.default = http;

