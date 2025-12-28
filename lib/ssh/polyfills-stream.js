/**
 * Polyfill for Node.js stream module
 * Re-exports stream-browserify with proper CommonJS format
 */
try {
  const stream = require('stream-browserify');
  
  // Ensure all required exports are available
  const streamExports = {
    ...stream,
    Duplex: stream.Duplex || stream.Stream,
    Readable: stream.Readable || stream.Stream,
    Writable: stream.Writable || stream.Stream,
    Transform: stream.Transform || stream.Duplex || stream.Stream,
    PassThrough: stream.PassThrough || stream.Transform || stream.Duplex || stream.Stream,
  };
  
  module.exports = streamExports;
  module.exports.default = streamExports;
} catch (e) {
  // Fallback if stream-browserify fails
  console.error('Failed to load stream-browserify:', e);
  throw e;
}

