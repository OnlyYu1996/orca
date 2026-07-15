import { z } from 'zod'
import { LEGACY_PRODUCT_IDENTITY, PRODUCT_URL_SCHEME } from './product-identity'

export const PAIRING_OFFER_VERSION = 2
export const PAIRING_URL_SCHEMES = [PRODUCT_URL_SCHEME, LEGACY_PRODUCT_IDENTITY.urlScheme] as const
const PAIRING_URL_PROTOCOLS = new Set(PAIRING_URL_SCHEMES.map((scheme) => `${scheme}:`))
const PairingScopeSchema = z.enum(['mobile', 'runtime'])

export const PairingOfferSchema = z.object({
  v: z.literal(PAIRING_OFFER_VERSION),
  endpoint: z.string().min(1),
  deviceToken: z.string().min(1),
  // Why: the desktop's Curve25519 public key, base64-encoded. The mobile client
  // uses this to derive a shared secret via ECDH for end-to-end encryption.
  publicKeyB64: z.string().min(1),
  // Why: advisory UI metadata lets the web client reject phone-QR offers before
  // opening a socket; the runtime still authorizes solely from deviceToken.
  scope: PairingScopeSchema.optional()
})

export type PairingOffer = z.infer<typeof PairingOfferSchema>

export function encodePairingOffer(offer: PairingOffer): string {
  const json = JSON.stringify(offer)
  const base64url = Buffer.from(json, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  // Why: Android camera intents and Expo Router preserve query params more
  // reliably than URL fragments when launching a custom-scheme app.
  return `${PRODUCT_URL_SCHEME}://pair?code=${base64url}`
}

export function decodePairingOffer(url: string): PairingOffer {
  const code = extractPairingCodeFromUrl(url)
  if (!code) {
    throw new Error(
      `Invalid pairing URL: must start with ${PRODUCT_URL_SCHEME}://pair or ${LEGACY_PRODUCT_IDENTITY.urlScheme}://pair and include a pairing code`
    )
  }
  return decodePairingBase64(code)
}

function extractPairingCodeFromUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  // Why: prefix checks accepted routes like `orca://pairing?...`; only the
  // pairing deep-link host may carry runtime auth material.
  if (!PAIRING_URL_PROTOCOLS.has(parsed.protocol.toLowerCase()) || parsed.hostname !== 'pair') {
    return null
  }
  if (parsed.pathname !== '' && parsed.pathname !== '/') {
    return null
  }
  const code = parsed.searchParams.get('code')
  if (code) {
    return code
  }
  return parsed.hash ? parsed.hash.slice(1) || null : null
}

// 新旧 Scheme 在兼容窗口内双读，裸 Base64 继续支持复制粘贴流程。
export function parsePairingCode(input: string): PairingOffer | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }
  try {
    if (PAIRING_URL_SCHEMES.some((scheme) => trimmed.toLowerCase().startsWith(`${scheme}://`))) {
      return decodePairingOffer(trimmed)
    }
    return decodePairingBase64(trimmed)
  } catch {
    return null
  }
}

function decodePairingBase64(base64url: string): PairingOffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const json = Buffer.from(base64, 'base64').toString('utf-8')
  return PairingOfferSchema.parse(JSON.parse(json))
}
