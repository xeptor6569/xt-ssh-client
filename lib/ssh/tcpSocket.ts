/**
 * Node.js-like TCP socket wrapper over react-native-tcp-socket.
 * Used by SSHService and by the Metro-resolved `net` polyfill.
 */

import { EventEmitter } from 'events';
import { Buffer } from 'buffer';
import TcpSocket from 'react-native-tcp-socket';

type NativeSocket = InstanceType<typeof TcpSocket.Socket>;

export class TcpSocketWrapper extends EventEmitter {
  private socket: NativeSocket | null = null;
  private _connecting = false;
  private _destroyed = false;
  private _readable = true;
  private _writable = true;

  connect(port: number, host: string, callback?: () => void): this {
    if (this._connecting || this.socket) {
      return this;
    }

    this._connecting = true;
    this.socket = new TcpSocket.Socket();

    this.socket.on('connect', () => {
      this._connecting = false;
      this.emit('connect');
      callback?.();
    });

    this.socket.on('data', (data: Buffer | string) => {
      if (typeof data === 'string') {
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

    this.socket.connect({ port, host });

    return this;
  }

  write(
    data: Buffer | string,
    encoding?: BufferEncoding,
    callback?: (error?: Error) => void
  ): boolean {
    if (!this.socket || this._destroyed) {
      callback?.(new Error('Socket is closed'));
      return false;
    }

    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, encoding);
      this.socket.write(buffer, undefined, callback);
      return true;
    } catch (error) {
      callback?.(error as Error);
      return false;
    }
  }

  end(
    data?: Buffer | string,
    encoding?: BufferEncoding,
    callback?: () => void
  ): this {
    if (data) {
      this.write(data, encoding, () => {
        this.destroy();
        callback?.();
      });
    } else {
      this.destroy();
      callback?.();
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

  setNoDelay(_noDelay?: boolean): this {
    return this;
  }

  setKeepAlive(_enable?: boolean, _initialDelay?: number): this {
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
