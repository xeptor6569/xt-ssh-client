// Import polyfills first to set up global environment
import './polyfills';
import { Client } from 'ssh2';
import { net, TcpSocketWrapper } from './polyfills';
import { SSHConnectionOptions, ConnectionStatus } from './types';

export class SSHService {
  private client: Client | null = null;
  private stream: any = null;
  private socket: TcpSocketWrapper | null = null;
  private status: ConnectionStatus = 'disconnected';
  private dataCallbacks: Array<(data: string) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];
  private statusCallbacks: Array<(status: ConnectionStatus) => void> = [];

  /**
   * Connect to SSH server
   */
  async connect(options: SSHConnectionOptions): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') {
      throw new Error('Already connected or connecting');
    }

    this.status = 'connecting';
    this.notifyStatusChange();

    return new Promise((resolve, reject) => {
      // Create TCP socket connection first
      const socket = new TcpSocketWrapper();
      this.socket = socket;

      // Wait for socket to connect
      socket.once('connect', () => {
        // Create SSH client
        this.client = new Client();

        // Configure connection options
        const connectConfig: any = {
          username: options.username,
          readyTimeout: options.readyTimeout || 20000,
          sock: socket, // Pass the connected socket
        };

        // Add authentication
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

        // Handle SSH connection events
        this.client.on('ready', () => {
          this.status = 'connected';
          this.notifyStatusChange();

          // Request a shell
          this.client!.shell((err, stream) => {
            if (err) {
              this.status = 'error';
              this.notifyStatusChange();
              this.notifyError(err);
              reject(err);
              return;
            }

            this.stream = stream;

            // Pipe stream data to callbacks
            stream.on('data', (data: Buffer) => {
              const dataStr = data.toString();
              this.notifyData(dataStr);
            });

            stream.on('close', () => {
              this.status = 'disconnected';
              this.notifyStatusChange();
            });

            stream.stderr.on('data', (data: Buffer) => {
              const dataStr = data.toString();
              this.notifyData(dataStr);
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

        // Connect SSH client over the socket
        this.client.connect(connectConfig);
      });

      socket.once('error', (err: Error) => {
        this.status = 'error';
        this.notifyStatusChange();
        this.notifyError(err);
        reject(err);
      });

      // Start TCP connection
      socket.connect(options.port, options.hostname);
    });
  }

  /**
   * Disconnect from SSH server
   */
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

  /**
   * Write data to SSH stream
   */
  write(data: string): void {
    if (this.stream && this.status === 'connected') {
      this.stream.write(data);
    } else {
      console.warn('Cannot write: not connected');
    }
  }

  /**
   * Execute a command and return output
   */
  async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.client || this.status !== 'connected') {
        reject(new Error('Not connected'));
        return;
      }

      let output = '';
      let errorOutput = '';

      this.client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
          } else {
            resolve(output);
          }
        });
      });
    });
  }

  /**
   * Register callback for data events
   */
  onData(callback: (data: string) => void): void {
    this.dataCallbacks.push(callback);
  }

  /**
   * Remove data callback
   */
  offData(callback: (data: string) => void): void {
    this.dataCallbacks = this.dataCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Register callback for error events
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove error callback
   */
  offError(callback: (error: Error) => void): void {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Register callback for status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Remove status change callback
   */
  offStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  private notifyData(data: string): void {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data callback:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }
}

