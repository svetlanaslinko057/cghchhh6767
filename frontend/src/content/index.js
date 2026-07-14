import { useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import uk from './uk';
import de from './de';
import en from './en';
import { subscribeContent, getContentOverrides, deepMerge } from '../lib/contentStore';

const BASE = { ua: uk, de, en };

// Single accessor: returns the content object for the active language,
// with admin-managed overrides (from the CMS) deep-merged on top.
export function useContent() {
  const { i18n } = useTranslation();
  const overrides = useSyncExternalStore(subscribeContent, getContentOverrides, getContentOverrides);
  const lang = ['de', 'en'].includes(i18n.language) ? i18n.language : 'ua';
  return useMemo(() => {
    const o = overrides?.[lang]?.content;
    return o && Object.keys(o).length ? deepMerge(BASE[lang], o) : BASE[lang];
  }, [overrides, lang]);
}
export { uk, de, en };
