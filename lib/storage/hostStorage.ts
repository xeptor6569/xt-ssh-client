import AsyncStorage from '@react-native-async-storage/async-storage';
import { Host, HostCredentials } from '../types/host';
import {
  saveHostCredentials,
  deleteHostCredentials,
} from './secureStorage';

const HOSTS_KEY = 'ssh_hosts';

export async function getAllHosts(): Promise<Host[]> {
  try {
    const data = await AsyncStorage.getItem(HOSTS_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as Host[];
  } catch (error) {
    console.error('Error getting hosts:', error);
    return [];
  }
}

export async function getHostById(id: string): Promise<Host | null> {
  const hosts = await getAllHosts();
  return hosts.find((host) => host.id === id) || null;
}

export async function saveHost(
  host: Host,
  credentials: HostCredentials
): Promise<void> {
  const hosts = await getAllHosts();
  const existingIndex = hosts.findIndex((h) => h.id === host.id);

  if (existingIndex >= 0) {
    hosts[existingIndex] = host;
  } else {
    hosts.push(host);
  }

  await AsyncStorage.setItem(HOSTS_KEY, JSON.stringify(hosts));
  await saveHostCredentials(host.id, credentials);
}

export async function deleteHost(id: string): Promise<void> {
  const hosts = await getAllHosts();
  const filtered = hosts.filter((h) => h.id !== id);

  await AsyncStorage.setItem(HOSTS_KEY, JSON.stringify(filtered));
  await deleteHostCredentials(id);
}

export function createHostId(): string {
  return `host_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
