import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from './settings';
import { useContent } from '../content';

/*
 * SEO meta is admin-editable: per-route titles/descriptions live in
 * content/{uk,de,en}.js -> seo.{home,services,work,about,order,contact}
 * and can be overridden from the admin CMS («Контент» → SEO).
 * The brand name follows content.brand.name.
 */

// URL path -> content.seo key
const ROUTE_KEYS = {
  '/': 'home',
  '/services': 'services',
  '/work': 'work',
  '/about': 'about',
  '/order': 'order',
  '/contact': 'contact',
};

const OG_LOCALES = { ua: 'uk_UA', de: 'de_DE', en: 'en_US' };
const HTML_LANGS = { ua: 'uk', de: 'de', en: 'en' };

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaAll(attr, key, contents) {
  // Multiple values for the same property (e.g. og:locale:alternate)
  document.head.querySelectorAll(`meta[${attr}="${key}"]`).forEach((el) => el.remove());
  contents.forEach((content) => {
    const el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('content', content);
    document.head.appendChild(el);
  });
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"][data-seo]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('data-seo', '1');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo() {
  const loc = useLocation();
  const { i18n } = useTranslation();
  const settings = useSiteSettings();
  const c = useContent(); // active-language content incl. admin CMS overrides

  useEffect(() => {
    const path = loc.pathname;
    const lang = ['ua', 'de', 'en'].includes(i18n.language) ? i18n.language : 'ua';
    const origin = window.location.origin;
    const isAdmin = path.startsWith('/admin');
    const brand = c?.brand?.name || 'Oksana Oliferenko';
    const seo = c?.seo || {};

    // html lang mirrors the active language
    document.documentElement.lang = HTML_LANGS[lang];

    // robots: keep admin out of the index
    setMeta('name', 'robots', isAdmin ? 'noindex, nofollow' : 'index, follow');
    if (isAdmin) { document.title = `Admin — ${brand}`; return; }

    const meta = seo[ROUTE_KEYS[path]] || seo.home || {};
    // admin-configured tab title wins on the home page only
    const adminTitle = settings?.site?.title?.trim();
    const title = (path === '/' && adminTitle ? adminTitle : meta.title) || brand;
    const description = meta.description || '';

    document.title = title;
    setMeta('name', 'description', description);

    // canonical + open graph + twitter
    const url = origin + path;
    setLink('canonical', url);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', brand);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', `${origin}/og-image.png`);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:locale', OG_LOCALES[lang]);
    setMetaAll('property', 'og:locale:alternate', Object.keys(OG_LOCALES).filter((l) => l !== lang).map((l) => OG_LOCALES[l]));
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', `${origin}/og-image.png`);

    // structured data: ProfessionalService (+ live contacts from settings)
    const contacts = settings?.contacts || {};
    const offerNames = Array.isArray(seo.offers) && seo.offers.length
      ? seo.offers
      : ['Legal translations', 'Notarial translations', 'Translation of handwritten documents'];
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: brand,
      description: (seo.home || {}).description || description,
      url: origin,
      image: `${origin}/og-image.png`,
      priceRange: '€€',
      availableLanguage: [
        { '@type': 'Language', name: 'Ukrainian', alternateName: 'uk' },
        { '@type': 'Language', name: 'German', alternateName: 'de' },
        { '@type': 'Language', name: 'English', alternateName: 'en' },
      ],
      makesOffer: offerNames.filter(Boolean).map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
      ...(contacts.email ? { email: contacts.email } : {}),
      ...(contacts.phone ? { telephone: contacts.phone } : {}),
    };
    setJsonLd('seo-jsonld', schema);
  }, [loc.pathname, i18n.language, settings, c]);

  return null;
}
