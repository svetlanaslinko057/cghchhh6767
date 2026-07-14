import { createContext, useContext, useEffect, useState } from 'react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setSettings(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // document.title is managed by lib/seo.js (respects site.title override on home)

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SettingsContext);
}

const digits = (v) => String(v || '').replace(/[^\d]/g, '');
const handle = (v) => String(v || '').trim().replace(/^@/, '');
const isUrl = (v) => /^https?:\/\//i.test(String(v || '').trim());

// Resolves media URLs: '/api/media/...' (object storage) -> absolute backend URL
export function resolveMediaUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('/api/')) return process.env.REACT_APP_BACKEND_URL + u;
  return u;
}

// Normalises raw admin-entered values into working links
export function channelLinks(contacts) {
  if (!contacts) return [];
  const out = [];
  if (contacts.telegram) out.push({ key: 'telegram', label: 'Telegram', href: isUrl(contacts.telegram) ? contacts.telegram.trim() : `https://t.me/${handle(contacts.telegram)}` });
  if (contacts.whatsapp) out.push({ key: 'whatsapp', label: 'WhatsApp', href: isUrl(contacts.whatsapp) ? contacts.whatsapp.trim() : `https://wa.me/${digits(contacts.whatsapp)}` });
  if (contacts.viber) out.push({ key: 'viber', label: 'Viber', href: isUrl(contacts.viber) ? contacts.viber.trim() : `viber://chat?number=%2B${digits(contacts.viber)}` });
  if (contacts.instagram) out.push({ key: 'instagram', label: 'Instagram', href: isUrl(contacts.instagram) ? contacts.instagram.trim() : `https://instagram.com/${handle(contacts.instagram)}` });
  if (contacts.facebook) out.push({ key: 'facebook', label: 'Facebook', href: isUrl(contacts.facebook) ? contacts.facebook.trim() : `https://facebook.com/${handle(contacts.facebook)}` });
  if (contacts.email) out.push({ key: 'email', label: 'Email', href: `mailto:${contacts.email.trim()}` });
  if (contacts.phone) out.push({ key: 'phone', label: contacts.phone.trim(), href: `tel:${contacts.phone.trim().replace(/\s/g, '')}` });
  return out;
}
