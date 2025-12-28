import * as SecureStore from 'expo-secure-store';
import { HostCredentials } from '../types/host';

const CREDENTIALS_PREFIX = 'host_credentials_';

/**
 * Store encrypted credentials for a host in SecureStore
 */
export async function saveHostCredentials(
  hostId: string,
  credentials: HostCredentials
): Promise<void> {
  const key = `${CREDENTIALS_PREFIX}${hostId}`;
  const value = JSON.stringify(credentials);
  
  await SecureStore.setItemAsync(key, value);
}

/**
 * Retrieve and decrypt credentials for a host
 */
export async function getHostCredentials(
  hostId: string
): Promise<HostCredentials | null> {
  const key = `${CREDENTIALS_PREFIX}${hostId}`;
  
  try {
    const value = await SecureStore.getItemAsync(key);
    if (!value) {
      return null;
    }
    
    return JSON.parse(value) as HostCredentials;
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return null;
  }
}

/**
 * Delete credentials for a host
 */
export async function deleteHostCredentials(hostId: string): Promise<void> {
  const key = `${CREDENTIALS_PREFIX}${hostId}`;
  
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting credentials:', error);
  }
}

