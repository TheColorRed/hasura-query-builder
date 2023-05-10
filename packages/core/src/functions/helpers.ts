/**
 * Checks to see if the current environment is a browser or not.
 */
export function isBrowser() {
  return (typeof global !== 'undefined' && typeof global.window !== 'undefined') || typeof window !== 'undefined';
}
