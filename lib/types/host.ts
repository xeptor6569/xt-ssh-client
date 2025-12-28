export type AuthType = 'password' | 'key';

export interface Host {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authType: AuthType;
  // Credentials stored separately in SecureStore
}

export interface HostCredentials {
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

