/**
 * Polyfills for Node.js modules required by ssh2
 * These provide Node.js-compatible APIs in React Native environment
 */

import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import process from 'process';
import { Readable, Writable, Transform } from 'stream-browserify';
import { Socket } from 'react-native-tcp-socket';

// Make Buffer and process available globally
if (typeof global !== 'undefined') {
  (global as any).Buffer = Buffer;
  (global as any).process = process;
}

// Polyfill util module
const util = {
  inherits: (ctor: any, superCtor: any) => {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
  },
  inspect: (obj: any) => JSON.stringify(obj, null, 2),
  deprecate: (fn: any, msg: string) => fn,
};

// Create a Node.js net.Socket-like wrapper around react-native-tcp-socket
export class TcpSocketWrapper extends EventEmitter {
  private socket: Socket | null = null;
  private _connecting = false;
  private _destroyed = false;
  private _readable = true;
  private _writable = true;

  constructor() {
    super();
  }

  connect(port: number, host: string, callback?: () => void): this {
    if (this._connecting || this.socket) {
      return this;
    }

    this._connecting = true;

    this.socket = new Socket({
      port,
      host,
    });

    this.socket.on('connect', () => {
      this._connecting = false;
      this.emit('connect');
      if (callback) callback();
    });

    this.socket.on('data', (data: any) => {
      // react-native-tcp-socket provides data as ArrayBuffer or string
      if (data instanceof ArrayBuffer) {
        this.emit('data', Buffer.from(data));
      } else if (typeof data === 'string') {
        this.emit('data', Buffer.from(data, 'utf8'));
      } else {
        this.emit('data', Buffer.from(data));
      }
    });

    this.socket.on('error', (error: Error) => {
      this._connecting = false;
      this.emit('error', error);
    });

    this.socket.on('close', (hadError: boolean) => {
      this._connecting = false;
      this.emit('close', hadError);
    });

    this.socket.on('timeout', () => {
      this.emit('timeout');
    });

    return this;
  }

  write(data: Buffer | string, encoding?: string, callback?: (error?: Error) => void): boolean {
    if (!this.socket || this._destroyed) {
      if (callback) callback(new Error('Socket is closed'));
      return false;
    }

    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, encoding as any);
      // react-native-tcp-socket write accepts ArrayBuffer or string
      // Convert Buffer to ArrayBuffer for compatibility
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      this.socket.write(arrayBuffer);
      if (callback) callback();
      return true;
    } catch (error) {
      if (callback) callback(error as Error);
      return false;
    }
  }

  end(data?: Buffer | string, encoding?: string, callback?: () => void): this {
    if (data) {
      this.write(data, encoding, () => {
        this.destroy();
        if (callback) callback();
      });
    } else {
      this.destroy();
      if (callback) callback();
    }
    return this;
  }

  destroy(error?: Error): this {
    if (this._destroyed) {
      return this;
    }

    this._destroyed = true;
    this._readable = false;
    this._writable = false;

    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }

    if (error) {
      this.emit('error', error);
    }

    this.emit('close', false);
    return this;
  }

  setNoDelay(noDelay?: boolean): this {
    // Not supported by react-native-tcp-socket, but ssh2 may call it
    return this;
  }

  setKeepAlive(enable?: boolean, initialDelay?: number): this {
    // Not supported by react-native-tcp-socket, but ssh2 may call it
    return this;
  }

  setTimeout(timeout: number, callback?: () => void): this {
    if (this.socket) {
      this.socket.setTimeout(timeout);
      if (callback) {
        this.once('timeout', callback);
      }
    }
    return this;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  get readable(): boolean {
    return this._readable;
  }

  get writable(): boolean {
    return this._writable;
  }

  get remoteAddress(): string {
    return this.socket?.remoteAddress || '';
  }

  get remotePort(): number {
    return this.socket?.remotePort || 0;
  }
}

// Export polyfilled modules
export { Buffer, EventEmitter, process, Readable, Writable, Transform, util };

// Create a net module polyfill
export const net = {
  createConnection: (options: { port: number; host: string }, callback?: () => void) => {
    const socket = new TcpSocketWrapper();
    if (callback) {
      socket.once('connect', callback);
    }
    socket.connect(options.port, options.host);
    return socket;
  },
  Socket: TcpSocketWrapper,
  createServer: () => {
    throw new Error('net.createServer not available in React Native');
  },
};

// Import http/https/tls stubs (Metro will resolve these via metro.config.js)
// We import them here to ensure they're available when needed
let http: any;
let https: any;
let tls: any;

try {
  http = require('./polyfills-http');
  https = require('./polyfills-https');
  tls = require('./polyfills-tls');
} catch (e) {
  // Fallback stubs if require fails
  http = {
    request: () => {
      throw new Error('http module not available - use custom socket');
    },
    createServer: () => {
      throw new Error('http module not available - use custom socket');
    },
  };
  https = {
    request: () => {
      throw new Error('https module not available - use custom socket');
    },
    createServer: () => {
      throw new Error('https module not available - use custom socket');
    },
  };
  tls = {
    connect: () => {
      throw new Error('tls module not available - use custom socket');
    },
    createServer: () => {
      throw new Error('tls module not available - use custom socket');
    },
  };
}

export { http, https, tls };

// Make modules available globally after they're defined
if (typeof global !== 'undefined') {
  (global as any).net = net;
  (global as any).http = http;
  (global as any).https = https;
  (global as any).tls = tls;
}

