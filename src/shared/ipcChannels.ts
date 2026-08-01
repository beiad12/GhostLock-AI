/** Shared IPC channel name constants used by main, preload, and renderer. */
export const IPC = {
  VAULT_READ: 'vault:read',
  VAULT_WRITE: 'vault:write',
  AUTO_LAUNCH_GET: 'auto-launch:get',
  AUTO_LAUNCH_SET: 'auto-launch:set',
  SYSTEM_STATS: 'system:stats',
  UNLOCK_DESKTOP: 'window:unlock-desktop',
  LOCK_DESKTOP: 'window:lock-desktop',
  HIDE_TO_TRAY: 'window:hide-to-tray',
  QUIT_APP: 'app:quit',
  APP_VERSION: 'app:version',
  SET_AUTH_STATE: 'app:set-auth-state'
} as const
