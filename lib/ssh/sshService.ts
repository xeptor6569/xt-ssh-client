import './polyfills';
import { Client } from 'ssh2';
import { TcpSocketWrapper } from './tcpSocket';
import { SSHConnectionOptions, ConnectionStatus } from './types';

type DataCallback = (data: string) => void;
type ErrorCallback = (error: Error) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export class SSHService {
  private client: Client | null = null;
  private stream: any = null;
  private socket: TcpSocketWrapper | null = null;
  private status: ConnectionStatus = 'disconnected';
  private dataCallbacks: DataCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];

  async connect(options: SSHConnectionOptions): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') {
      throw new Error('Already connected or connecting');
    }

    this.status = 'connecting';
    this.notifyStatusChange();

    return new Promise((resolve, reject) => {
      const socket = new TcpSocketWrapper();
      this.socket = socket;

      socket.once('connect', () => {
        this.client = new Client();

        const connectConfig: Record<string, unknown> = {
          username: options.username,
          readyTimeout: options.readyTimeout || 20000,
          sock: socket,
        };

        if (options.privateKey) {
          connectConfig.privateKey = options.privateKey;
          if (options.passphrase) {
            connectConfig.passphrase = options.passphrase;
          }
        } else if (options.password) {
          connectConfig.password = options.password;
        } else {
          socket.destroy();
          reject(new Error('No authentication method provided'));
          return;
        }

        this.client.on('ready', () => {
          this.status = 'connected';
          this.notifyStatusChange();

          this.client!.shell((err: Error | undefined, stream: any) => {
            if (err) {
              this.status = 'error';
              this.notifyStatusChange();
              this.notifyError(err);
              reject(err);
              return;
            }

            this.stream = stream;

            stream.on('data', (data: Buffer) => {
              this.notifyData(data.toString());
            });

            stream.on('close', () => {
              this.status = 'disconnected';
              this.notifyStatusChange();
            });

            stream.stderr.on('data', (data: Buffer) => {
              this.notifyData(data.toString());
            });

            resolve();
          });
        });

        this.client.on('error', (err: Error) => {
          this.status = 'error';
          this.notifyStatusChange();
          this.notifyError(err);
          reject(err);
        });

        this.client.connect(connectConfig);
      });

      socket.once('error', (err: Error) => {
        this.status = 'error';
        this.notifyStatusChange();
        this.notifyError(err);
        reject(err);
      });

      socket.connect(options.port, options.hostname);
    });
  }

  disconnect(): void {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }

    if (this.client) {
      this.client.end();
      this.client = null;
    }

    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }

    this.status = 'disconnected';
    this.notifyStatusChange();
  }

  write(data: string): void {
    if (this.stream && this.status === 'connected') {
      this.stream.write(data);
    } else {
      console.warn('Cannot write: not connected');
    }
  }

  onData(callback: DataCallback): void {
    this.dataCallbacks.push(callback);
  }

  offData(callback: DataCallback): void {
    this.dataCallbacks = this.dataCallbacks.filter((cb) => cb !== callback);
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  offError(callback: ErrorCallback): void {
    this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
  }

  onStatusChange(callback: StatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  offStatusChange(callback: StatusCallback): void {
    this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private notifyData(data: string): void {
    for (const callback of this.dataCallbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data callback:', error);
      }
    }
  }

  private notifyError(error: Error): void {
    for (const callback of this.errorCallbacks) {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    }
  }

  private notifyStatusChange(): void {
    for (const callback of this.statusCallbacks) {
      try {
        callback(this.status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    }
  }
}
