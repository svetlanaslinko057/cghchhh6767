/*
 * Runtime content store: fetches admin-managed content overrides (per language)
 * from GET /api/content and merges them over the built-in defaults.
 * - content.* -> deep-merged into content/{uk,de,en}.js objects (useContent)
 * - locale.*  -> injected into i18next resource bundles (t())
 */
import i18n from '../i18n';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

let overrides = {};
let loaded = false;
const listeners = new Set();

export function subscribeContent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getContentOverrides() {
  return overrides;
}
export function isContentLoaded() {
  return loaded;
}

function notify() {
  listeners.forEach((fn) => { try { fn(); } catch {} });
}

// Deep merge: objects merged recursively, arrays and scalars replaced by override.
export function deepMerge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(over)) return over;
  if (typeof over !== 'object' || typeof base !== 'object' || base === null || Array.isArray(base)) return over;
  const out = { ...base };
  Object.keys(over).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
  return out;
}

function applyLocaleOverrides(data) {
  let touched = false;
  ['ua', 'de', 'en'].forEach((lang) => {
    const loc = data?.[lang]?.locale;
    if (loc && Object.keys(loc).length) {
      i18n.addResourceBundle(lang, 'translation', loc, true, true);
      touched = true;
    }
  });
  // re-render all useTranslation consumers with the merged bundle
  if (touched) i18n.changeLanguage(i18n.language);
}

export async function refreshContent() {
  try {
    const res = await fetch(`${API}/content`);
    if (!res.ok) throw new Error('content fetch failed');
    const data = await res.json();
    overrides = data || {};
    loaded = true;
    applyLocaleOverrides(overrides);
    notify();
  } catch {
    loaded = true;
    notify();
  }
}

// initial load (module side-effect, non-blocking)
if (typeof window !== 'undefined') refreshContent();
