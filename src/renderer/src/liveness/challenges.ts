import type { LivenessChallenge, LivenessChallengeKind } from '../types/auth'

const CHALLENGE_LABELS: Record<LivenessChallengeKind, string> = {
  blink: 'Please blink',
  turnLeft: 'Turn head left',
  turnRight: 'Turn head right',
  lookUp: 'Look upward',
  smile: 'Smile'
}

/** Returns a shuffled sequence of `count` unique liveness challenges. */
export function generateChallengeSequence(count = 2): LivenessChallenge[] {
  const kinds = Object.keys(CHALLENGE_LABELS) as LivenessChallengeKind[]
  const shuffled = [...kinds].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, kinds.length)).map((kind) => ({
    kind,
    label: CHALLENGE_LABELS[kind]
  }))
}
