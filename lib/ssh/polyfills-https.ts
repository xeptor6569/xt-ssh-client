/**
 * Stub implementation of Node.js https module
 * ssh2 may try to require this, but we use custom sockets
 */
export const https = {
  request: () => {
    throw new Error('https module not available in React Native - use custom socket');
  },
  createServer: () => {
    throw new Error('https module not available in React Native - use custom socket');
  },
  get: () => {
    throw new Error('https module not available in React Native - use custom socket');
  },
};

export default https;

