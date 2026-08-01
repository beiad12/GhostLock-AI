import { create } from 'zustand'
import type { EnrolledUser, AttemptLogEntry } from '../types/auth'
import {
  loadEnrolledUsers,
  saveEnrolledUsers,
  loadAttemptLog,
  saveAttemptLog,
  encodeEmbedding
} from '../authentication/vaultRepository'

interface AuthStore {
  initialized: boolean
  enrolledUsers: EnrolledUser[]
  attemptLog: AttemptLogEntry[]
  failedAttemptStreak: number
  init: (force?: boolean) => Promise<void>
  enrollUser: (name: string, embedding: Float32Array) => Promise<EnrolledUser>
  removeUser: (id: string) => Promise<void>
  recordAttempt: (entry: Omit<AttemptLogEntry, 'id' | 'timestamp'>) => Promise<void>
  resetFailedStreak: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  initialized: false,
  enrolledUsers: [],
  attemptLog: [],
  failedAttemptStreak: 0,

  init: async (force = false) => {
    if (get().initialized && !force) return
    const [users, log] = await Promise.all([loadEnrolledUsers(), loadAttemptLog()])
    set({ enrolledUsers: users, attemptLog: log, initialized: true })
  },

  enrollUser: async (name, embedding) => {
    const user: EnrolledUser = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      embeddingBase64: await encodeEmbedding(embedding)
    }
    const next = [...get().enrolledUsers, user]
    set({ enrolledUsers: next })
    await saveEnrolledUsers(next)
    return user
  },

  removeUser: async (id) => {
    const next = get().enrolledUsers.filter((u) => u.id !== id)
    set({ enrolledUsers: next })
    await saveEnrolledUsers(next)
  },

  recordAttempt: async (entry) => {
    const full: AttemptLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    const next = [full, ...get().attemptLog].slice(0, 200)
    set({
      attemptLog: next,
      failedAttemptStreak: entry.success ? 0 : get().failedAttemptStreak + 1
    })
    await saveAttemptLog(next)
  },

  resetFailedStreak: () => set({ failedAttemptStreak: 0 })
}))
