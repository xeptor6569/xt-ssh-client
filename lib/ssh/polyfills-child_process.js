/**
 * Stub implementation of Node.js child_process module
 * ssh2 may try to require this for agent forwarding
 */
const child_process = {
  execFile: (file, args, options, callback) => {
    // Stub - agent forwarding not supported in React Native
    const err = new Error('child_process.execFile not available in React Native - agent forwarding not supported');
    if (typeof options === 'function') {
      options(err, null, null);
    } else if (callback) {
      callback(err, null, null);
    }
    return null;
  },
  spawn: (command, args, options) => {
    // Stub - agent forwarding not supported in React Native
    throw new Error('child_process.spawn not available in React Native - agent forwarding not supported');
  },
  exec: (command, options, callback) => {
    const err = new Error('child_process.exec not available in React Native');
    if (typeof options === 'function') {
      options(err, null, null);
    } else if (callback) {
      callback(err, null, null);
    }
    return null;
  },
  fork: () => {
    throw new Error('child_process.fork not available in React Native');
  },
};

module.exports = child_process;
module.exports.default = child_process;

