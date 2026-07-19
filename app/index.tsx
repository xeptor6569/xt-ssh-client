import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Host, AuthType, HostCredentials } from '../lib/types/host';
import { getAllHosts, saveHost, deleteHost, createHostId } from '../lib/storage/hostStorage';
import { getHostCredentials } from '../lib/storage/secureStorage';

export default function HostListScreen() {
  const router = useRouter();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    port: '22',
    username: '',
    authType: 'password' as AuthType,
    password: '',
    privateKey: '',
    passphrase: '',
  });

  useEffect(() => {
    loadHosts();
  }, []);

  const loadHosts = async () => {
    const allHosts = await getAllHosts();
    setHosts(allHosts);
  };

  const handleAddHost = () => {
    setEditingHost(null);
    setFormData({
      name: '',
      hostname: '',
      port: '22',
      username: '',
      authType: 'password',
      password: '',
      privateKey: '',
      passphrase: '',
    });
    setModalVisible(true);
  };

  const handleEditHost = (host: Host) => {
    setEditingHost(host);
    setFormData({
      name: host.name,
      hostname: host.hostname,
      port: host.port.toString(),
      username: host.username,
      authType: host.authType,
      password: '',
      privateKey: '',
      passphrase: '',
    });
    setModalVisible(true);
  };

  const handleDeleteHost = (host: Host) => {
    Alert.alert(
      'Delete Host',
      `Are you sure you want to delete ${host.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHost(host.id);
            loadHosts();
          },
        },
      ]
    );
  };

  const handleSaveHost = async () => {
    if (!formData.name || !formData.hostname || !formData.username) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const existingCredentials = editingHost
      ? await getHostCredentials(editingHost.id)
      : null;

    if (formData.authType === 'password') {
      if (!formData.password && !existingCredentials?.password) {
        Alert.alert('Error', 'Please enter a password');
        return;
      }
    } else if (!formData.privateKey && !existingCredentials?.privateKey) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    const port = parseInt(formData.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      Alert.alert('Error', 'Please enter a valid port number (1-65535)');
      return;
    }

    const host: Host = {
      id: editingHost?.id || createHostId(),
      name: formData.name,
      hostname: formData.hostname,
      port,
      username: formData.username,
      authType: formData.authType,
    };

    const credentials: HostCredentials =
      formData.authType === 'password'
        ? {
            password: formData.password || existingCredentials?.password,
          }
        : {
            privateKey: formData.privateKey || existingCredentials?.privateKey,
            passphrase:
              formData.passphrase ||
              (!formData.privateKey ? existingCredentials?.passphrase : undefined),
          };

    await saveHost(host, credentials);
    setModalVisible(false);
    loadHosts();
  };

  const handleConnect = (host: Host) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Web Platform Not Supported',
        'SSH connections require native modules that are not available on web. Please use the iOS or Android version.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push(`/terminal/${host.id}`);
  };

  const renderHostItem = ({ item }: { item: Host }) => (
    <TouchableOpacity
      style={styles.hostItem}
      onPress={() => handleConnect(item)}
      onLongPress={() => {
        Alert.alert(
          item.name,
          'Choose an action',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Edit', onPress: () => handleEditHost(item) },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => handleDeleteHost(item),
            },
          ]
        );
      }}
    >
      <View style={styles.hostItemContent}>
        <Text style={styles.hostName}>{item.name}</Text>
        <Text style={styles.hostDetails}>
          {item.username}@{item.hostname}:{item.port}
        </Text>
        <Text style={styles.authType}>
          Auth: {item.authType === 'password' ? 'Password' : 'SSH Key'}
        </Text>
      </View>
      <Text style={styles.connectButton}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={hosts}
        renderItem={renderHostItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {Platform.OS === 'web' ? (
              <>
                <Text style={styles.emptyText}>Web Platform Not Supported</Text>
                <Text style={styles.emptySubtext}>
                  This app requires native modules (TCP sockets) that are not available on web.
                  {'\n\n'}
                  Please use the iOS or Android version to connect to SSH hosts.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>No hosts configured</Text>
                <Text style={styles.emptySubtext}>
                  Tap the + button to add your first SSH host
                </Text>
              </>
            )}
          </View>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddHost}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingHost ? 'Edit Host' : 'Add Host'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Host Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Hostname or IP"
              value={formData.hostname}
              onChangeText={(text) => setFormData({ ...formData, hostname: text })}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Port (default: 22)"
              value={formData.port}
              onChangeText={(text) => setFormData({ ...formData, port: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Username"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              autoCapitalize="none"
            />

            <View style={styles.authTypeContainer}>
              <Text style={styles.authTypeLabel}>Authentication Type:</Text>
              <View style={styles.switchContainer}>
                <Text>Password</Text>
                <Switch
                  value={formData.authType === 'key'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      authType: value ? 'key' : 'password',
                    })
                  }
                />
                <Text>SSH Key</Text>
              </View>
            </View>

            {formData.authType === 'password' ? (
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />
            ) : (
              <>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Private Key (PEM format)"
                  value={formData.privateKey}
                  onChangeText={(text) => setFormData({ ...formData, privateKey: text })}
                  multiline
                  textAlignVertical="top"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Passphrase (optional)"
                  value={formData.passphrase}
                  onChangeText={(text) => setFormData({ ...formData, passphrase: text })}
                  secureTextEntry
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveHost}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  hostItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  hostItemContent: {
    flex: 1,
  },
  hostName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  hostDetails: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  authType: {
    fontSize: 12,
    color: '#888',
  },
  connectButton: {
    fontSize: 24,
    color: '#4a9eff',
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
  },
  authTypeContainer: {
    marginBottom: 12,
  },
  authTypeLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#3a3a3a',
  },
  saveButton: {
    backgroundColor: '#4a9eff',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
  },
});

