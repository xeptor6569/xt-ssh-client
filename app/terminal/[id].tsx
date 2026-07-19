import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Host } from '../../lib/types/host';
import { getHostById } from '../../lib/storage/hostStorage';
import { getHostCredentials } from '../../lib/storage/secureStorage';
type SSHServiceConstructor = typeof import('../../lib/ssh/sshService').SSHService;
type SSHServiceInstance = InstanceType<SSHServiceConstructor>;

// Native-only: avoid pulling react-native-tcp-socket into the web bundle.
let SSHService: SSHServiceConstructor | null = null;
if (Platform.OS !== 'web') {
  SSHService = require('../../lib/ssh/sshService').SSHService;
}

const terminalHTML = require('../../assets/terminal.html');

function escapeForInjectedJs(data: string): string {
  return data
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

export default function TerminalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const sshServiceRef = useRef<SSHServiceInstance | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !SSHService) {
      setError('SSH connections are not supported on web. Please use iOS or Android.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const Service = SSHService;

    const connect = async () => {
      try {
        setLoading(true);
        setError(null);

        const hostId = Array.isArray(id) ? id[0] : id;
        const loadedHost = await getHostById(hostId);
        if (!loadedHost) {
          throw new Error('Host not found');
        }
        if (cancelled) return;

        setHost(loadedHost);

        const credentials = await getHostCredentials(hostId);
        if (!credentials) {
          throw new Error('Credentials not found');
        }
        if (cancelled) return;

        const sshService = new Service();
        sshServiceRef.current = sshService;

        sshService.onData((data: string) => {
          webViewRef.current?.injectJavaScript(`
            (function() {
              if (window.writeTerminalData) {
                window.writeTerminalData('${escapeForInjectedJs(data)}');
              }
            })();
            true;
          `);
        });

        sshService.onError((err: Error) => {
          if (cancelled) return;
          setError(err.message);
          setLoading(false);
          Alert.alert('Connection Error', err.message, [
            { text: 'OK', onPress: () => router.back() },
          ]);
        });

        sshService.onStatusChange((status) => {
          if (cancelled) return;
          if (status === 'connected' || status === 'error') {
            setLoading(false);
          }
        });

        await sshService.connect({
          hostname: loadedHost.hostname,
          port: loadedHost.port,
          username: loadedHost.username,
          password: credentials.password,
          privateKey: credentials.privateKey,
          passphrase: credentials.passphrase,
          readyTimeout: 20000,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to connect';
        setError(errorMessage);
        setLoading(false);
        Alert.alert('Connection Error', errorMessage, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (sshServiceRef.current) {
        sshServiceRef.current.disconnect();
        sshServiceRef.current = null;
      }
    };
  }, [id, router]);

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'input' && sshServiceRef.current) {
        sshServiceRef.current.write(payload.data);
      }
    } catch (err) {
      console.error('Error handling WebView message:', err);
    }
  };

  if (Platform.OS === 'web' || error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Connection Error</Text>
          <Text style={styles.errorMessage}>
            {error || 'SSH is not available on this platform.'}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a9eff" />
          <Text style={styles.loadingText}>
            Connecting to {host?.name || 'host'}...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={terminalHTML}
      onMessage={handleWebViewMessage}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
});
