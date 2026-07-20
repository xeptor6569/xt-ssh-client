# xt-ssh-client

**Expo / React Native** SSH client for **iOS and Android**. SSH runs on device via `ssh2` over `react-native-tcp-socket`, with an xterm.js terminal in a native WebView.

Web / PWA is **not** a target for SSH (browsers can’t do raw SSH TCP without a separate gateway). See [docs/STATUS.md](docs/STATUS.md).

> Rolling status, decisions, and next steps: **[docs/STATUS.md](docs/STATUS.md)**

## Features (current)

- Host list with add / edit / delete
- Password and private-key auth (credentials in SecureStore)
- Interactive SSH shell in a WebView terminal
- Expo Router navigation + EAS build profiles

## Stack

Targeted at **Expo native** (dev client / EAS), not Expo web:

| Layer | Choice |
| --- | --- |
| App | Expo 54, React Native 0.81, expo-router |
| SSH | `ssh2` + Node polyfills (Metro) |
| Transport | `react-native-tcp-socket` |
| Crypto | `react-native-quick-crypto` |
| Terminal | xterm.js (CDN) inside `react-native-webview` |
| Hosts | AsyncStorage |
| Secrets | expo-secure-store |

## Project layout

```
app/                 # Screens (hosts list, terminal)
assets/terminal.html # xterm WebView page
lib/ssh/             # SSHService, TcpSocketWrapper, Node polyfills
lib/storage/         # Hosts + credentials
lib/types/           # Shared types
```

## Setup

```bash
npm install
npm run typecheck
```

Native modules require a **dev client** (not Expo Go):

```bash
npx expo prebuild
npm run ios          # or: npm run android
# or EAS:
# eas build --profile development --platform ios
```

Then:

```bash
npm start            # expo start --dev-client
```

SSH is **not supported on web** (no native TCP). The UI will say so.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Start Metro with dev client |
| `npm run ios` / `android` | Build & run native app |
| `npm run prebuild` | Generate `ios/` / `android/` |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run doctor` | expo-doctor |

## Direction (short)

- **Primary:** Expo native iOS/Android, on-device SSH  
- **Not v1:** PWA / Expo web SSH (would need a separate gateway product)  
- Borrow UX ideas from projects like webssh2; do **not** adopt that gateway as the app base  

Priority next: prove a real device/simulator session, then PTY resize, safer WebView data bridging, and connection hardening.

Details and agent history live in [docs/STATUS.md](docs/STATUS.md).

## License

Private / unpublished for now.
