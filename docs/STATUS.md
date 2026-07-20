# xt-ssh-client — rolling status

Living notes for project direction, decisions, and agent work.  
**Update this file** when direction changes or a meaningful agent pass lands.  
Last updated: **2026-07-20**

---

## North star

Build a **React Native (Expo) SSH client for iOS and Android** where:

- The phone opens TCP + SSH directly to the host
- Credentials stay on device (SecureStore)
- The terminal UX is solid (xterm in a native WebView is fine for now)

Primary target is **Expo native apps**, not a browser PWA.  
Not a hosted web SSH gateway.

---

## Platform targeting

| Surface | Role | SSH? |
| --- | --- | --- |
| **iOS / Android (Expo)** | Primary product | Yes — on-device `ssh2` + TCP |
| **Expo web / PWA** | Out of scope for v1 | No — browsers cannot open raw SSH TCP |

**Stack should be optimized for Expo native** (dev client, EAS, native modules). Do not bend the SSH path to “also work as a PWA.”

### Can we do both?

Not as one SSH implementation.

- A PWA cannot speak SSH the way this app does; it would need a **separate backend gateway** (WebSocket → SSH), which we already rejected as the product base.
- Sharing UI/theme/host-list types with a future web app is possible later, but the **connection layer must stay native-only**.
- If a web/PWA client is wanted someday, treat it as a **separate product/surface** (own deploy, own trust model), not a mode of this app.

For now: ignore PWA; ship iOS/Android.

---

## Current state

| Area | Status |
| --- | --- |
| Host CRUD | Working (code complete) |
| Secure credentials | Working (SecureStore) |
| SSH shell session | Implemented; **needs device verification** |
| Terminal (xterm WebView) | Basic; CDN-loaded xterm + FitAddon |
| Web / PWA | Unsupported for SSH (by design) |
| Native projects (`ios/` / `android/`) | Not checked in; generate via prebuild/EAS |
| Tests | None yet |
| Bundle IDs | Still `com.anonymous.*` |

**Repo:** [xeptor6569/xt-ssh-client](https://github.com/xeptor6569/xt-ssh-client)  
**Latest merged work:** [PR #1](https://github.com/xeptor6569/xt-ssh-client/pull/1) (refactor) on `main`  
**Docs PR branch:** `cursor/docs-status-readme-7105`

### Architecture (kept)

```
Host list (Expo Router)
    → Terminal screen
        → SSHService (ssh2 + TcpSocketWrapper)
        ↔ WebView (assets/terminal.html / xterm)
```

Metro maps Node built-ins (`net`, `stream`, `crypto`, …) to polyfills / `react-native-quick-crypto`.

---

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Primary stack | **Expo / React Native (iOS + Android)** | Native TCP + SecureStore; matches mobile SSH apps |
| PWA / Expo web SSH | **Not in scope** | No raw TCP SSH in the browser without a gateway |
| Dual product (native + PWA) | **Separate later, if ever** | Would need a different connection architecture; don’t dilute v1 |
| Product shape | On-device client | Creds stay local; no required backend |
| webssh2 as base | **No** | webssh2 is a Socket.IO → SSH **server gateway**, not an RN client lib |
| Borrow from webssh2 | Ideas only | Terminal UX, resize/PTY, auth flows, TOFU — not the proxy model |
| Terminal renderer | DOM for now | `@xterm/addon-webgl` deferred; try canvas later if needed; fallback required on mobile WebView |
| State | Local screen state | Removed unused zustand store in refactor |
| xterm packaging | CDN in HTML for now | npm `@xterm/*` was unused; bundling locally is a later improvement |

---

## Next (priority order)

1. **Prove a live session** — prebuild/EAS **dev client** on simulator/device; password + key auth  
2. **Terminal correctness** — PTY/`window-change` on FitAddon resize; safer RN ↔ WebView data path  
3. **Connection hardening** — host key / TOFU, reconnect, keep-alive, clearer errors  
4. **App hygiene** — real bundle IDs, icons, optional local xterm assets, light tests  

Renderer upgrades (canvas → maybe webgl) only after a real session shows DOM as the bottleneck.  
Do not invest in PWA packaging until native SSH is proven.

---

## Agent log

Append newest entries at the top.

### 2026-07-20 — Platform targeting clarified

- Confirmed stack is **Expo native (RN)** first-class
- PWA/web SSH deferred; would be a separate surface with a gateway, not a dual mode of this app
- Updated STATUS + README wording accordingly

### 2026-07-19 — Cloud agent “Current project status”

- **Run:** https://cursor.com/agents/bc-019f77ed-db4d-709a-801e-03427b8b7105  
- **Refactor PR:** https://github.com/xeptor6569/xt-ssh-client/pull/1 (**merged**)  
- **Docs branch:** `cursor/docs-status-readme-7105`  

**Done**

- Progress reassessment of `main` (prototype from Dec 2025 commits)
- Refactor merged: remove dead `App.tsx`, duplicate polyfills, unused deps; single `TcpSocketWrapper`; host edit keeps credentials
- Direction confirmed: stay on-device; borrow ideas from webssh2 only; defer webgl
- Added this status file + README

**Open**

- No confirmed end-to-end SSH session in this environment yet  
- Dev client / prebuild still the gating next step  

### 2025-12-28 — Human commits (pre-agent)

- `c1f6389` — Initial Expo SSH client, polyfills, host UI, terminal WebView  
- `f1dbeb5` — Wire `react-native-quick-crypto`  

---

## How to update this file

When continuing work (human or agent):

1. Refresh **Current state** if something shipped or regressed  
2. Add rows to **Decisions** when a choice is locked  
3. Reorder **Next** if priorities change  
4. Prepend a short **Agent log** entry with date, link, and bullets  

Keep the README short; put narrative and history here.
