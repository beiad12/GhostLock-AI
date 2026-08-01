/**
 * Lightweight synthesized SFX engine using the Web Audio API.
 * No binary audio assets are shipped — every cue is generated procedurally,
 * which keeps the app tiny and lets volume/theme react instantly.
 */

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    masterGain = audioCtx.createGain()
    masterGain.connect(audioCtx.destination)
  }
  return audioCtx
}

export function setMasterVolume(volume0to100: number): void {
  ctx()
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, volume0to100 / 100))
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.15
): void {
  const c = ctx()
  if (!masterGain) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, c.currentTime)
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
  osc.connect(gain)
  gain.connect(masterGain)
  osc.start()
  osc.stop(c.currentTime + duration + 0.02)
}

export const sfx = {
  boot: (): void => tone(220, 0.12, 'square', 0.08),
  click: (): void => tone(880, 0.04, 'square', 0.06),
  radarPing: (): void => tone(1400, 0.25, 'sine', 0.06),
  scanSweep: (): void => tone(340, 0.4, 'sawtooth', 0.03),
  accessGranted: (): void => {
    tone(523.25, 0.15, 'sine', 0.12)
    window.setTimeout(() => tone(659.25, 0.15, 'sine', 0.12), 120)
    window.setTimeout(() => tone(783.99, 0.3, 'sine', 0.14), 240)
  },
  accessDenied: (): void => {
    tone(180, 0.3, 'sawtooth', 0.14)
    window.setTimeout(() => tone(140, 0.4, 'sawtooth', 0.16), 180)
  },
  alarm: (): void => {
    tone(600, 0.2, 'square', 0.1)
    window.setTimeout(() => tone(450, 0.2, 'square', 0.1), 220)
  },
  typing: (): void => tone(1800 + Math.random() * 400, 0.02, 'square', 0.03)
}

export function speak(text: string, enabled: boolean): void {
  if (!enabled || typeof window.speechSynthesis === 'undefined') return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.pitch = 0.7
  utterance.rate = 0.95
  utterance.volume = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
