/**
 * Polyfill for Node.js assert module
 * Provides basic assertion functionality
 */
function assert(value, message) {
  if (!value) {
    const error = new Error(message || 'Assertion failed');
    error.name = 'AssertionError';
    throw error;
  }
}

assert.ok = assert;
assert.equal = (actual, expected, message) => {
  if (actual != expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
};
assert.notEqual = (actual, expected, message) => {
  if (actual == expected) {
    throw new Error(message || `Expected not ${expected}, got ${actual}`);
  }
};
assert.strictEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
};
assert.notStrictEqual = (actual, expected, message) => {
  if (actual === expected) {
    throw new Error(message || `Expected not ${expected}, got ${actual}`);
  }
};
assert.deepEqual = (actual, expected, message) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};
assert.notDeepEqual = (actual, expected, message) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    throw new Error(message || `Expected not ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};
assert.throws = (fn, error, message) => {
  try {
    fn();
    throw new Error(message || 'Expected function to throw');
  } catch (e) {
    if (error && !(e instanceof error)) {
      throw new Error(message || `Expected error of type ${error.name}, got ${e.name}`);
    }
  }
};
assert.doesNotThrow = (fn, message) => {
  try {
    fn();
  } catch (e) {
    throw new Error(message || `Expected function not to throw, but it threw: ${e.message}`);
  }
};
assert.fail = (message) => {
  throw new Error(message || 'Assertion failed');
};
assert.ifError = (err) => {
  if (err) {
    throw err;
  }
};

module.exports = assert;
module.exports.default = assert;

