/**
 * Stub for cpu-features native module
 * This is used by ssh2 to detect CPU features (like AES-NI, etc.)
 * In React Native, we'll return a minimal stub that indicates no special features
 */
function getCPUInfo() {
  // Return a minimal CPU info object
  // ssh2 uses this to detect hardware acceleration features
  // Without native bindings, we return defaults
  return {
    arch: 'unknown',
    platform: 'react-native',
    // No special CPU features detected
    // ssh2 will fall back to software implementations
  };
}

// Export as a function (cpu-features is called as a function)
module.exports = getCPUInfo;
module.exports.default = getCPUInfo;

