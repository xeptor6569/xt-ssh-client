/**
 * Polyfill for Node.js net module
 * This is a JavaScript wrapper that Metro can resolve
 * The actual implementation is in polyfills.ts
 */

// We need to import the EventEmitter and TcpSocketWrapper
// Since this is a .js file, we'll need to recreate the net interface
// But actually, Metro should handle the TypeScript import
// Let's try a different approach - create a minimal net module here

const { EventEmitter } = require('events');
const { Socket: TcpSocket } = require('react-native-tcp-socket');
const { Buffer } = require('buffer');

// Create TcpSocketWrapper class
class TcpSocketWrapper extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this._connecting = false;
    this._destroyed = false;
    this._readable = true;
    this._writable = true;
  }

  connect(port, host, callback) {
    if (this._connecting || this.socket) {
      return this;
    }

    this._connecting = true;
    this.socket = new TcpSocket({ port, host });

    this.socket.on('connect', () => {
      this._connecting = false;
      this.emit('connect');
      if (callback) callback();
    });

    this.socket.on('data', (data) => {
      if (data instanceof ArrayBuffer) {
        this.emit('data', Buffer.from(data));
      } else if (typeof data === 'string') {
        this.emit('data', Buffer.from(data, 'utf8'));
      } else {
        this.emit('data', Buffer.from(data));
      }
    });

    this.socket.on('error', (error) => {
      this._connecting = false;
      this.emit('error', error);
    });

    this.socket.on('close', (hadError) => {
      this._connecting = false;
      this.emit('close', hadError);
    });

    this.socket.on('timeout', () => {
      this.emit('timeout');
    });

    return this;
  }

  write(data, encoding, callback) {
    if (!this.socket || this._destroyed) {
      if (callback) callback(new Error('Socket is closed'));
      return false;
    }

    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, encoding);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      this.socket.write(arrayBuffer);
      if (callback) callback();
      return true;
    } catch (error) {
      if (callback) callback(error);
      return false;
    }
  }

  end(data, encoding, callback) {
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

  destroy(error) {
    if (this._destroyed) return this;
    this._destroyed = true;
    this._readable = false;
    this._writable = false;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    if (error) this.emit('error', error);
    this.emit('close', false);
    return this;
  }

  setNoDelay() { return this; }
  setKeepAlive() { return this; }
  setTimeout(timeout, callback) {
    if (this.socket) {
      this.socket.setTimeout(timeout);
      if (callback) this.once('timeout', callback);
    }
    return this;
  }

  get connecting() { return this._connecting; }
  get destroyed() { return this._destroyed; }
  get readable() { return this._readable; }
  get writable() { return this._writable; }
  get remoteAddress() { return this.socket?.remoteAddress || ''; }
  get remotePort() { return this.socket?.remotePort || 0; }
}

// Create net module
const net = {
  createConnection: (options, callback) => {
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

module.exports = net;
module.exports.Socket = TcpSocketWrapper;

