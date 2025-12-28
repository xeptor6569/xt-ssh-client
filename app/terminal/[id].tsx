import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Host } from '../../lib/types/host';
import { useConnectionStore } from '../../lib/store/connectionStore';

// Only import native modules on native platforms
let SSHService: any;
let getHostById: any;
let getHostCredentials: any;

if (Platform.OS !== 'web') {
  SSHService = require('../../lib/ssh/sshService').SSHService;
  getHostById = require('../../lib/storage/hostStorage').getHostById;
  getHostCredentials = require('../../lib/storage/secureStorage').getHostCredentials;
}

const terminalHTML = require('../../assets/terminal.html');

export default function TerminalScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const sshServiceRef = useRef<SSHService | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setConnection, setError: setConnectionError, disconnect } = useConnectionStore();

  useEffect(() => {
    if (Platform.OS === 'web') {
      setError('SSH connections are not supported on web. Please use iOS or Android.');
      setLoading(false);
      return;
    }
    
    initializeConnection();

    return () => {
      // Cleanup on unmount
      if (sshServiceRef.current) {
        sshServiceRef.current.disconnect();
        sshServiceRef.current = null;
      }
      disconnect();
    };
  }, [id]);

  const initializeConnection = async () => {
    if (Platform.OS === 'web') {
      setError('SSH connections are not supported on web platform.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load host from storage
      const hostId = Array.isArray(id) ? id[0] : id;
      const loadedHost = await getHostById(hostId);
      
      if (!loadedHost) {
        throw new Error('Host not found');
      }

      setHost(loadedHost);

      // Load credentials
      const credentials = await getHostCredentials(hostId);
      if (!credentials) {
        throw new Error('Credentials not found');
      }

      // Create SSH service
      const sshService = new SSHService();
      sshServiceRef.current = sshService;

      // Set up data handler
      sshService.onData((data: string) => {
        // Send data to WebView by calling the global function
        if (webViewRef.current) {
          // Escape the data for JavaScript string
          const escapedData = data
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
          webViewRef.current.injectJavaScript(`
            (function() {
              if (window.writeTerminalData) {
                window.writeTerminalData('${escapedData}');
              }
            })();
            true; // Required for iOS
          `);
        }
      });

      // Set up error handler
      sshService.onError((err: Error) => {
        setError(err.message);
        setConnectionError(err.message);
        setLoading(false);
        Alert.alert('Connection Error', err.message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      });

      // Set up status change handler
      sshService.onStatusChange((status) => {
        setConnection(hostId, status);
        if (status === 'connected') {
          setLoading(false);
        } else if (status === 'error') {
          setLoading(false);
        }
      });

      // Connect to SSH server
      await sshService.connect({
        hostname: loadedHost.hostname,
        port: loadedHost.port,
        username: loadedHost.username,
        password: credentials.password,
        privateKey: credentials.privateKey,
        passphrase: credentials.passphrase,
        readyTimeout: 20000,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect';
      setError(errorMessage);
      setConnectionError(errorMessage);
      setLoading(false);
      Alert.alert('Connection Error', errorMessage, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      
      if (payload.type === 'input') {
        // User typed something. Send it to the SSH Socket.
        if (sshServiceRef.current) {
          sshServiceRef.current.write(payload.data);
        }
      }
    } catch (err) {
      console.error('Error handling WebView message:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a9eff" />
          <Text style={styles.loadingText}>Connecting to {host?.name || 'host'}...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
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
      javaScriptEnabled={true}
      domStorageEnabled={true}
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

