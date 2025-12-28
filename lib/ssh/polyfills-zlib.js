/**
 * Stub implementation of Node.js zlib module
 * ssh2 may try to require this for compression
 * Note: Compression support may be limited in React Native
 */
const zlib = {
  createInflate: (options) => {
    throw new Error('zlib.createInflate not available in React Native - compression disabled');
  },
  createDeflate: (options) => {
    throw new Error('zlib.createDeflate not available in React Native - compression disabled');
  },
  inflate: (buffer, options, callback) => {
    throw new Error('zlib.inflate not available in React Native - compression disabled');
  },
  deflate: (buffer, options, callback) => {
    throw new Error('zlib.deflate not available in React Native - compression disabled');
  },
  inflateSync: (buffer, options) => {
    throw new Error('zlib.inflateSync not available in React Native - compression disabled');
  },
  deflateSync: (buffer, options) => {
    throw new Error('zlib.deflateSync not available in React Native - compression disabled');
  },
  constants: {
    DEFLATE: 1,
    INFLATE: 2,
    Z_DEFAULT_CHUNK: 16384,
    Z_DEFAULT_COMPRESSION: -1,
  },
};

module.exports = zlib;
module.exports.default = zlib;
module.exports.constants = zlib.constants;

