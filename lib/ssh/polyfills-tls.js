/**
 * Stub implementation of Node.js tls module
 * ssh2 may try to require this, but we use custom sockets
 */
const tls = {
  connect: () => {
    throw new Error('tls module not available in React Native - use custom socket');
  },
  createServer: () => {
    throw new Error('tls module not available in React Native - use custom socket');
  },
  createSecureContext: () => {
    throw new Error('tls module not available in React Native - use custom socket');
  },
};

module.exports = tls;
module.exports.default = tls;

