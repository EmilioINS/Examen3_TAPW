/**
 * Decodes the JWT payload (no signature verification — client-side only)
 * and checks whether the `exp` claim is in the past.
 *
 * Returns true  → token is expired or malformed.
 * Returns false → token has a valid `exp` in the future.
 *
 * Note: this does NOT replace server-side validation; it only avoids
 * sending obviously dead tokens and gives instant feedback on load.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payloadB64 = token.split('.')[1]
    if (!payloadB64) return true
    const payload = JSON.parse(atob(payloadB64))
    if (typeof payload.exp !== 'number') return false   // no exp claim → assume valid
    return payload.exp * 1000 < Date.now()
  } catch {
    return true // malformed token → treat as expired
  }
}
