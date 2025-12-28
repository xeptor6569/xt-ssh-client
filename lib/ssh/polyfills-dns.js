/**
 * Stub implementation of Node.js dns module
 * ssh2 uses this for hostname resolution
 * In React Native, we can use the hostname directly or implement basic lookup
 */
const dns = {
  lookup: (hostname, options, callback) => {
    // For React Native, we can resolve hostnames directly
    // If it's already an IP, return it; otherwise, we'd need a DNS resolver
    // For now, we'll use a simple approach - if it's an IP, use it; otherwise assume it's valid
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(hostname);
    
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    if (isIP) {
      // It's already an IP address
      const result = {
        address: hostname,
        family: hostname.includes(':') ? 6 : 4,
      };
      if (callback) {
        // Use setTimeout as async callback (process.nextTick might not be available)
        setTimeout(() => callback(null, result.address, result.family), 0);
      }
      return;
    }
    
    // For hostnames, we'll need to resolve them
    // In a real implementation, you might use a DNS library or native resolver
    // For now, we'll return the hostname and let the TCP socket handle resolution
    // react-native-tcp-socket can resolve hostnames natively
    if (callback) {
      setTimeout(() => callback(null, hostname, 4), 0);
    }
  },
  lookupSync: (hostname, options) => {
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(hostname);
    if (isIP) {
      return {
        address: hostname,
        family: hostname.includes(':') ? 6 : 4,
      };
    }
    // Return hostname - let TCP socket resolve it
    return {
      address: hostname,
      family: 4,
    };
  },
  resolve: (hostname, rrtype, callback) => {
    throw new Error('dns.resolve not fully implemented in React Native');
  },
  resolve4: (hostname, callback) => {
    throw new Error('dns.resolve4 not fully implemented in React Native');
  },
  resolve6: (hostname, callback) => {
    throw new Error('dns.resolve6 not fully implemented in React Native');
  },
};

module.exports = dns;
module.exports.default = dns;

