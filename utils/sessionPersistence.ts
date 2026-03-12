import { FundDataset, Language } from '../types';

const STORAGE_KEY = 'fcb_session';
const SESSION_VERSION = 1;

export interface PersistedSession {
  version: number;
  timestamp: number;
  dataset: FundDataset | null;
  viewMode: 'raw' | 'normalized';
  inputMode: 'upload' | 'restructure';
  dashboardTab: 'analytics' | 'agi';
  lang: Language;
  analysis: string | null;
}

const defaultSession: PersistedSession = {
  version: SESSION_VERSION,
  timestamp: Date.now(),
  dataset: null,
  viewMode: 'normalized',
  inputMode: 'upload',
  dashboardTab: 'analytics',
  lang: 'en',
  analysis: null,
};

/**
 * Save the current session state to localStorage.
 * Uses a debounce-friendly design — call freely, writes are cheap.
 */
export function saveSession(partial: Partial<Omit<PersistedSession, 'version' | 'timestamp'>>): void {
  try {
    const existing = loadSession();
    const merged: PersistedSession = {
      ...existing,
      ...partial,
      version: SESSION_VERSION,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    // Storage full or unavailable — fail silently
    console.warn('[SessionPersistence] Save failed:', err);
  }
}

/**
 * Load the persisted session from localStorage.
 * Returns defaults if nothing is stored or the data is corrupt/outdated.
 */
export function loadSession(): PersistedSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSession };

    const parsed = JSON.parse(raw) as PersistedSession;

    // Version guard — discard stale formats
    if (parsed.version !== SESSION_VERSION) {
      clearSession();
      return { ...defaultSession };
    }

    return parsed;
  } catch {
    return { ...defaultSession };
  }
}

/**
 * Check whether a persisted session with actual data exists.
 */
export function hasPersistedSession(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as PersistedSession;
    return parsed.version === SESSION_VERSION && parsed.dataset !== null;
  } catch {
    return false;
  }
}

/**
 * Get a human-readable label for when the session was last saved.
 */
export function getSessionAge(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed.timestamp || !parsed.dataset) return null;

    const diffMs = Date.now() - parsed.timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  } catch {
    return null;
  }
}

/**
 * Remove all persisted session data.
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
