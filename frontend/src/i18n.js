import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ua from './locales/ua';
import de from './locales/de';
import en from './locales/en';

const SUPPORTED = ['ua', 'de', 'en'];
const stored = (typeof window !== 'undefined' && localStorage.getItem('lang')) || 'ua';
const saved = SUPPORTED.includes(stored) ? stored : 'ua';

// Deep-clone the static bundles so runtime CMS overrides (addResourceBundle)
// never mutate the imported default objects (admin editor needs pristine defaults).
const clone = (o) => JSON.parse(JSON.stringify(o));

i18n.use(initReactI18next).init({
  resources: { ua: { translation: clone(ua) }, de: { translation: clone(de) }, en: { translation: clone(en) } },
  lng: saved,
  fallbackLng: 'ua',
  interpolation: { escapeValue: false },
});

export default i18n;
