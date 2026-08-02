/**
 * Optional cloud secondary-check against Mistral's vision-capable "small"
 * model. This is the ONLY network call anywhere in GhostLock AI, and it only
 * runs when the user has explicitly enabled it and pasted in their own API
 * key via Settings — off by default. It runs from the main process (not the
 * renderer) so it never needs an exception carved into the renderer's
 * `connect-src 'self'` CSP.
 *
 * Scope: GhostLock AI never persists a reference photo (only face
 * descriptors), so Mistral can't do "is this the same person" identity
 * matching — there's nothing to compare the live frame against. What it CAN
 * usefully do is act as an anti-spoofing sanity check: look at the captured
 * frame and judge whether it shows a live person in front of a camera versus
 * a printed photo, a phone/monitor screen, or a mask. That result is treated
 * as advisory, not authoritative — a network error, timeout, or bad API key
 * must never block a real user from getting in. Only an explicit,
 * reasonably confident "this is a spoof" verdict adds an extra deny signal
 * on top of the local face-api match.
 */

const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions'
const REQUEST_TIMEOUT_MS = 8000

export interface MistralLivenessResult {
  live: boolean
  confidence: number
  reasoning: string
}

export async function verifyLivenessWithMistral(
  apiKey: string,
  imageDataUrl: string
): Promise<MistralLivenessResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(MISTRAL_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  'You are a security camera anti-spoofing check. Look at this webcam frame ' +
                  'from a device lock screen. Judge whether it shows a live human being in ' +
                  'front of the camera, versus a spoof attempt (a printed photo, a phone or ' +
                  'monitor screen held up, a mask, or similar). Respond ONLY with compact JSON ' +
                  'of the shape {"live": boolean, "confidence": number 0-100, "reasoning": ' +
                  '"one short sentence"}.'
              },
              {
                type: 'image_url',
                image_url: imageDataUrl
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Mistral API returned no content')

    const parsed = JSON.parse(content) as Partial<MistralLivenessResult>
    if (typeof parsed.live !== 'boolean') throw new Error('Malformed Mistral response')

    return {
      live: parsed.live,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : ''
    }
  } finally {
    clearTimeout(timeout)
  }
}
