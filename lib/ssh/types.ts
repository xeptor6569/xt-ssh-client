export interface SSHConnectionOptions {
  hostname: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  readyTimeout?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

