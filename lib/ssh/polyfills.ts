/**
 * Global Node.js shims required before ssh2 loads.
 * Module-level stubs (net, http, crypto, …) are resolved via metro.config.js.
 */

import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';

if (typeof global !== 'undefined') {
  (global as any).Buffer = Buffer;
  (global as any).process = process;
}
