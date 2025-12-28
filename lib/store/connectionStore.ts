import { create } from 'zustand';
import { ConnectionStatus } from '../ssh/types';

interface ConnectionState {
  hostId: string | null;
  status: ConnectionStatus;
  error: string | null;
}

interface ConnectionActions {
  setConnection: (hostId: string, status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

export const useConnectionStore = create<ConnectionStore>((set) => ({
  hostId: null,
  status: 'disconnected',
  error: null,

  setConnection: (hostId: string, status: ConnectionStatus) =>
    set({ hostId, status, error: null }),

  setError: (error: string | null) =>
    set({ error }),

  disconnect: () =>
    set({ hostId: null, status: 'disconnected', error: null }),
}));

