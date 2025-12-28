/**
 * Stub implementation of Node.js path module
 * ssh2 may try to require this
 */
const path = {
  resolve: (...args) => {
    // Simple path resolution for basic use cases
    return args.filter(Boolean).join('/').replace(/\/+/g, '/');
  },
  join: (...args) => {
    return args.filter(Boolean).join('/').replace(/\/+/g, '/');
  },
  dirname: (p) => {
    const parts = p.split('/');
    parts.pop();
    return parts.join('/') || '.';
  },
  basename: (p, ext) => {
    const parts = p.split('/');
    const name = parts[parts.length - 1];
    if (ext && name.endsWith(ext)) {
      return name.slice(0, -ext.length);
    }
    return name;
  },
  extname: (p) => {
    const parts = p.split('/');
    const name = parts[parts.length - 1];
    const lastDot = name.lastIndexOf('.');
    return lastDot > 0 ? name.slice(lastDot) : '';
  },
};

module.exports = path;
module.exports.default = path;

