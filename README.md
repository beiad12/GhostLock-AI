# GhostLock AI

A cinematic, offline-first face-authentication security shell for Windows —
built to look and feel like a military AI security terminal (Iron Man /
Watch Dogs / Mr. Robot), not a normal desktop app.

> **Status: Real, on-device face recognition — untested against an actual
> camera.** `RealFaceAuthProvider` (`authentication/RealFaceAuthProvider.ts`)
> runs genuine face detection, 68-point landmarks, and 128-d recognition
> descriptors via [@vladmandic/face-api](https://github.com/vladmandic/face-api)
> (TensorFlow.js), fully offline, and rejects faces that don't match the
> enrolled embedding by euclidean distance. It was built and verified by
> typecheck/lint/build in a sandbox with **no webcam and no GPU** — it has
> never been run against a real face. Test it on real hardware before
> trusting it, and expect to tune `Confidence Threshold` in Settings (see
> [Caveats](#caveats-of-the-real-engine) below).

## What's real vs. simulated

| Area | Status |
| --- | --- |
| UI/UX, animations, HUD, themes, audio, voice | **Real** |
| Webcam capture, kiosk-mode lock window, auto-start at login | **Real** (Electron/OS APIs) |
| AES-256-GCM encrypted local storage of profiles & attempt logs | **Real** (Web Crypto, keys stored in `userData`) |
| System dashboard (CPU/RAM/disk/battery/temp) | **Real** (`systeminformation`) |
| Face detection, 68-point landmarks, 128-d recognition descriptors | **Real** — `@vladmandic/face-api`, offline, models bundled in `src/renderer/public/models` |
| Face matching (accept/reject by identity) | **Real** — euclidean distance vs. the enrolled descriptor |
| Liveness challenges (blink/turn/look/smile) | **Real geometric heuristics** — eye-aspect-ratio and landmark-position deltas; thresholds are simple and untested against real motion |

Everything face-related sits behind `FaceAuthProvider`, a single interface
(`startDetection`, `captureEmbedding`, `matchEmbedding`,
`evaluateLivenessChallenge`, ...). `RealFaceAuthProvider` is the default;
`MockFaceAuthProvider` still exists as a camera-less fallback for demoing the
UI/animations. Nothing else in the app — UI, IPC, storage, flow — needs to
change to swap between them, or to a more accurate engine later.

## Caveats of the real engine

Built without ever seeing a real face, so treat these as starting points to
tune, not finished calibration:

- **Confidence threshold.** `matchConfidence` (`RealFaceAuthProvider.ts`)
  maps euclidean distance onto a 0–100 scale
  (`confidence = (1 - distance / 1.2) * 100`); the default `Confidence
  Threshold` setting (40) assumes that mapping is roughly right. If genuine
  you keeps getting rejected, lower it; if strangers get in, raise it. This
  is real math, not a placeholder — but the specific numbers need
  real-world data.
- **Enrollment gallery, not an average.** Each of the 6 capture angles
  (left/right/up/down/smile/blink) is stored as its own descriptor
  (`EnrolledUser.embeddingsBase64: string[]`), and matching compares the
  live face against every stored descriptor and keeps the best result.
  An earlier version averaged all 6 into one embedding, which turned out
  to hurt matching — averaging poses as different as a hard head-turn and
  a frontal smile pulls the "canonical" embedding away from what a normal
  frontal live scan actually looks like. Gallery matching avoids that.
- **Burst capture per angle, not one snapshot.** Each of the 6 angles is
  now a ~1.8s burst (`EnrollScreen.tsx`, `captureEmbeddingBurst` in
  `RealFaceAuthProvider.ts`) sampling a new frame roughly every 150ms while
  you hold the pose, and every frame that successfully finds a face
  contributes its own descriptor to the gallery — typically 8-12 per angle,
  so a full enrollment ends up with 50-70 stored descriptors instead of 6.
  This is a real, meaningful accuracy lever: a single photo-worth of your
  face per angle is a narrow sample of what your face actually looks like
  moment to moment (blinks, micro head movement, lighting flicker); dozens
  of samples per angle give live matching many more chances to find a close
  match. A step needs at least 3 successful frames or it must be retried.
- **Liveness thresholds** (`RealFaceAuthProvider.evaluateLivenessChallenge`)
  use fixed deltas (e.g. blink = EAR drops below 72% of baseline) that have
  never been checked against an actual blink/head-turn/smile. They may be
  too strict (legitimate liveness fails) or too loose (a photo passes) —
  expect to adjust the constants in that file.
- **Performance.** Detection runs at ~4fps (250ms) during scanning and every
  6–8s in the background guard; embedding extraction (enrollment/matching)
  runs on demand. This should be fine on any machine with WebGL, but hasn't
  been profiled on real hardware.
- **Model accuracy.** The bundled `face_recognition_model` is a general
  128-d face descriptor model, not fine-tuned for this app. It's
  meaningfully better than a random guess (the milestone-1 mock) but not at
  the level of InsightFace/ArcFace-class production models — good enough to
  demo real accept/reject behavior, not yet audited for production security
  use.

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
    authentication/            FaceAuthProvider interface, Real + Mock providers, unlocked guard, vault repo
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
- The app makes **zero network requests by default** — no cloud dependency,
  no telemetry. The one opt-in exception is described below.
- Profile export/import bundles the vault key with the ciphertext for
  portability, so treat an exported `.glvault` file as a secret (same as a
  password-manager export).

### Optional cloud verification (Mistral)

Settings → **Cloud AI Verification** lets you paste in your own [Mistral
API key](https://console.mistral.ai) to add a secondary anti-spoofing check
on top of local face matching. This is **off by default** and is the only
feature in GhostLock AI that talks to the network:

- It only runs when local matching already passed, and only if you've
  enabled the toggle and saved a key.
- The key is AES-256-GCM encrypted in the vault (same as face data), never
  written to the repo or to plain settings storage.
- The call happens from Electron's **main process**, not the renderer — the
  renderer's CSP still has no `connect-src` exception, so it can't reach the
  network on its own.
- GhostLock AI doesn't persist a reference photo, so this can't do
  "same-person" identity matching — it sends the live frame to Mistral's
  vision model (`mistral-small-latest`) and asks it to judge whether the
  frame shows a live person versus an obvious spoof (printed photo, a
  phone/monitor held up, a mask).
- **It fails open.** A bad key, no internet, a timeout, or an API error is
  swallowed and the local match result stands — after the earlier lockout
  incident (see commit history), nothing about optional network calls is
  allowed to be able to block a real user from getting in. Only an explicit,
  confident "this looks like a spoof" verdict adds an extra denial on top of
  the local result.

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

### Getting a prebuilt Windows installer

The built installer (~112MB, since bundling the face-recognition models)
exceeds GitHub's 100MB plain-git file size limit, so it can no longer be
committed directly into this repo — Git LFS isn't usable through this
project's current CI credentials either (object uploads are rejected).
Grab the current build from the
[Releases page](https://github.com/beiad12/GhostLock-AI/releases) instead;
it's rebuilt via `.github/workflows/release.yml` on a native Windows
GitHub Actions runner (no Wine emulation involved). The `installer/`
directory in the repo itself may lag behind — build from source per above,
or use the Release, for the current version.

On first launch you'll walk through enrollment (name + six capture angles),
then land on the face-scan HUD. Matching now genuinely compares the live
camera face against your enrolled descriptor — a different face should be
rejected. If it isn't (or if your own face keeps getting rejected), it's
real calibration to do, not a known bug: start with `Confidence Threshold`
in Settings → Recognition (see [Caveats](#caveats-of-the-real-engine)).

## Roadmap

**Near-term — calibrate the real engine.** `RealFaceAuthProvider` has never
been run against an actual camera (see [Caveats](#caveats-of-the-real-engine)).
First real-hardware pass should: verify WebGL/TF.js initializes correctly in
a packaged Electron build, tune `confidenceThreshold`'s distance mapping
against real accept/reject data, and tune the liveness-challenge constants
against real blinks/turns/smiles.

**Milestone 2 — Production-grade accuracy.** Swap the general-purpose
face-api.js recognition model for something closer to production-security
accuracy, e.g. InsightFace/ArcFace via ONNX Runtime, still running fully
on-device. `FaceAuthProvider` already isolates this — only
`authentication/RealFaceAuthProvider.ts` needs to change.

**Milestone 3 — Windows Credential Provider.** `authentication/` is already
decoupled from the UI so the matching/liveness engine can be reused by a
native Credential Provider DLL that replaces (or supplements) Windows Hello
at the lock screen, rather than only running as an Electron overlay.

**Later:** intruder-mode image/video capture with encrypted storage, email
notifications, plugin architecture, multi-user profile switching, and a full
localization pass beyond the current language selector.

## License

MIT — see [LICENSE](./LICENSE).
