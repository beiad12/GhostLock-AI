# GhostLock AI

A cinematic, offline-first face-authentication security shell for Windows —
built to look and feel like a military AI security terminal (Iron Man /
Watch Dogs / Mr. Robot), not a normal desktop app.

> **Status: Milestone 1 — Cinematic UI shell with a mocked authentication
> engine.** The full experience (boot sequence, face-scan HUD, liveness
> challenges, enrollment, themes, settings, security dashboard, kiosk lock,
> auto-start, encrypted local storage) is real, working code. Biometric
> *matching itself* is currently simulated behind a documented interface so
> the rest of the product can be built and demoed today — see
> [Roadmap](#roadmap) for what milestone 2 replaces it with.

## What's real vs. simulated

| Area | Status |
| --- | --- |
| UI/UX, animations, HUD, themes, audio, voice | **Real** |
| Webcam capture, kiosk-mode lock window, auto-start at login | **Real** (Electron/OS APIs) |
| AES-256-GCM encrypted local storage of profiles & attempt logs | **Real** (Web Crypto, keys stored in `userData`) |
| System dashboard (CPU/RAM/disk/battery/temp) | **Real** (`systeminformation`) |
| Face detection, landmarks, embeddings, liveness scoring | **Simulated** — see `authentication/FaceAuthProvider.ts` |

The simulated pieces all sit behind `FaceAuthProvider`, a single interface
(`startDetection`, `captureEmbedding`, `matchEmbedding`,
`evaluateLivenessChallenge`, ...). `MockFaceAuthProvider` implements it today
with plausible, animated numbers. Nothing else in the app — UI, IPC, storage,
flow — needs to change when a real engine is swapped in.

## Architecture

```
src/
  main/                      Electron main process
    windowsIntegration/      Kiosk window, auto-launch, vault file I/O, system stats
    ipcHandlers.ts           IPC surface exposed to the renderer
  preload/                   contextBridge API (window.api)
  shared/                    IPC channel constants shared by main/preload/renderer
  renderer/src/
    ui/screens/               Boot, Enroll, FaceScan, Granted, Denied, Dashboard, Settings
    ui/components/             Reusable HUD primitives (GlassPanel, TypingText, Toggle, ...)
    animations/                ParticleField, BinaryRain, RadarSweep, ScanLaser, HexOverlay
    authentication/            FaceAuthProvider interface + MockFaceAuthProvider + vault repo
    liveness/                  Random liveness challenge generator
    encryption/                AES-256-GCM helpers (Web Crypto)
    camera/                    getUserMedia webcam hook
    dashboard/                 System stats hook + stat cards
    settings/                  Camera enumeration, profile export/import
    store/                     Zustand stores (settings, auth, app flow)
    themes/                    6 theme definitions + CSS-variable engine
    types/                     Shared TypeScript types
```

## Design

Dark (`#050505`), neon-accented, glassmorphic HUD interface with six live
switchable themes (Cyber Green, Blue Hologram, Red Alert, Purple Neon,
Matrix, White Sci-Fi). Every screen composes the same animated primitives —
particle fields that react to the cursor, floating binary rain, rotating
radar sweeps, hex-grid HUD chrome, scanning lasers, glass panels — driven by
Framer Motion and CSS keyframes for 60fps GPU-accelerated motion.

## Security

- Face embeddings and the attempt log are AES-256-GCM encrypted before ever
  touching disk, using a per-install key stored in Electron's `userData`
  directory — never in web-reachable storage.
- Raw images are never persisted.
- The app makes **zero network requests** by design — no cloud dependency,
  no telemetry.
- Profile export/import bundles the vault key with the ciphertext for
  portability, so treat an exported `.glvault` file as a secret (same as a
  password-manager export).

## Windows integration

- Launches fullscreen/kiosk and blocks interaction with the desktop until
  authentication succeeds (`src/main/index.ts`).
- Registers as a real Windows login item via `app.setLoginItemSettings`
  (`windowsIntegration/autoLaunch.ts`) — toggle it from Settings → System.
- `Ctrl+Shift+Q` is a **dev-only** escape hatch (`is.dev`) so kiosk mode
  never traps a development session; it does not exist in production builds.

## Close/quit is gated on authentication

There is no way to dismiss or exit GhostLock AI before an authenticated
session — the window's close button, the tray's "Quit" item, and the
in-app hide-to-tray button are all no-ops while locked. The renderer
mirrors its auth state into the main process on every stage change
(`App.tsx` → `IPC.SET_AUTH_STATE`), and the main process enforces it
independently in the window's `close` handler and the tray menu
(`main/index.ts`, `main/windowsIntegration/tray.ts`) — not just hidden UI,
actually unusable. Once authenticated, closing hides to the tray instead of
exiting the process, so GhostLock AI keeps guarding the machine in the
background.

## Leaving the PC unattended

Two independent mechanisms re-lock an unlocked session, both active only
while `stage === 'unlocked'`:

- **Inactivity timeout** (`utils/useInactivityAutoLock.ts`) — 100% real:
  tracks mouse/keyboard/touch activity and silently re-locks after the
  configured `Auto-Lock After Inactivity` minutes (Settings → Recognition).
- **Background re-verification guard** (`authentication/useUnlockedGuard.ts`)
  — periodically re-checks the camera against the enrolled face while
  unlocked. On a mismatch it fires the `IntruderLockScreen` ("UNIDENTIFIED
  USER DETECTED — SYSTEM LOCKED", with alarm/voice/glitch), re-engages the
  kiosk lock, and drops back to the scan screen. **This one inherits the
  milestone-1 mock's limits** — `MockFaceAuthProvider.matchEmbedding` doesn't
  actually compare faces yet, so the guard layers an independent random
  "is this still you" roll on top purely to demo the UX end to end. Real
  "someone else picked up my laptop" detection needs the milestone 2
  biometric engine wired into this same hook.

## Getting started

```bash
npm install
npm run dev          # development, windowed (not kiosk)
npm run typecheck
npm run build         # typecheck + production bundle
npm run build:win     # Windows installer (NSIS)
```

On first launch you'll walk through enrollment (name + six capture angles),
then land on the face-scan HUD. Because matching is currently mocked,
any face plus two random liveness prompts will succeed with a high
confidence score — this is expected at this milestone.

## Roadmap

**Milestone 2 — Real face authentication engine.** Implement
`FaceAuthProvider` against a local Python service:
- OpenCV + MediaPipe for face landmarks, head pose, and blink/liveness
  detection.
- InsightFace + ONNX Runtime for embedding generation and matching.
- Communicate with the Electron main process over a local socket/IPC — no
  cloud calls.

**Milestone 3 — Windows Credential Provider.** `authentication/` is already
decoupled from the UI so the matching/liveness engine can be reused by a
native Credential Provider DLL that replaces (or supplements) Windows Hello
at the lock screen, rather than only running as an Electron overlay.

**Later:** intruder-mode image/video capture with encrypted storage, email
notifications, plugin architecture, multi-user profile switching, and a full
localization pass beyond the current language selector.

## License

MIT — see [LICENSE](./LICENSE).
