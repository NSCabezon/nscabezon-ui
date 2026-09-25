// localStorage that never throws. In Safari lockdown/private modes and some
// in-app webviews the global is missing or access throws (Sentry
// GESTION-TALLER-C: "Can't find variable: localStorage" crashed /portal).
// Reads fall back to null, writes are silently dropped — persistence is a
// nice-to-have, never worth crashing the app.
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}
