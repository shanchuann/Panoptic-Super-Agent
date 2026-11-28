/** Validate the HTTP endpoint shared by model provider forms. */

/**
 * Check that an endpoint can be parsed as an HTTP or HTTPS URL.
 * @param value - endpoint text with surrounding whitespace removed.
 * @returns whether the endpoint uses an accepted transport.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
