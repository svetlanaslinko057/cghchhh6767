import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from './settings';

const BRAND = 'Oksana Oliferenko';

// Per-route meta, per language. Titles kept under ~60 chars, descriptions ~155.
const META = {
  '/': {
    ua: {
      title: 'Oksana Oliferenko — переклади документів UA · DE · EN',
      description: 'Професійні переклади документів: українська, німецька, англійська. Юридичні, нотаріальні, офіційні та рукописні документи. Точно, конфіденційно, у строк.',
    },
    de: {
      title: 'Oksana Oliferenko — Übersetzungen UA · DE · EN',
      description: 'Professionelle Dokumentübersetzungen: Ukrainisch, Deutsch, Englisch. Juristische, notarielle, amtliche und handschriftliche Dokumente. Präzise und vertraulich.',
    },
    en: {
      title: 'Oksana Oliferenko — document translation UA · DE · EN',
      description: 'Professional document translation: Ukrainian, German, English. Legal, notarial, official and handwritten documents. Precise, confidential, on time.',
    },
  },
  '/services': {
    ua: {
      title: 'Послуги перекладу — юридичні, нотаріальні, рукописні | ' + BRAND,
      description: 'Переклад договорів, довіреностей, свідоцтв, дипломів, судових рішень та рукописних документів. Три мови: українська, німецька, англійська.',
    },
    de: {
      title: 'Leistungen — juristische & notarielle Übersetzungen | ' + BRAND,
      description: 'Übersetzung von Verträgen, Vollmachten, Urkunden, Diplomen, Gerichtsentscheidungen und Handschriften. Drei Sprachen: Ukrainisch, Deutsch, Englisch.',
    },
    en: {
      title: 'Translation services — legal, notarial, handwritten | ' + BRAND,
      description: 'Translation of contracts, powers of attorney, certificates, diplomas, court decisions and handwritten documents. Three languages: Ukrainian, German, English.',
    },
  },
  '/work': {
    ua: {
      title: 'Приклади робіт і вартість перекладу | ' + BRAND,
      description: 'Приклади типів документів з орієнтовними цінами від 35 €. Калькулятор вартості перекладу онлайн: українська, німецька, англійська.',
    },
    de: {
      title: 'Arbeitsproben & Preise | ' + BRAND,
      description: 'Beispiele von Dokumenttypen mit Richtpreisen ab 35 €. Online-Preisrechner für Übersetzungen: Ukrainisch, Deutsch, Englisch.',
    },
    en: {
      title: 'Work examples & translation prices | ' + BRAND,
      description: 'Examples of document types with estimated prices from €35. Online translation price calculator: Ukrainian, German, English.',
    },
  },
  '/about': {
    ua: {
      title: 'Про мене — перекладач UA · DE · EN | ' + BRAND,
      description: 'Перекладач документів, де кожне слово має юридичну вагу. Досвід роботи з нотаріальними, офіційними та рукописними матеріалами.',
    },
    de: {
      title: 'Über mich — Übersetzer UA · DE · EN | ' + BRAND,
      description: 'Übersetzer für Dokumente, bei denen jedes Wort juristisches Gewicht hat. Erfahrung mit notariellen, amtlichen und handschriftlichen Texten.',
    },
    en: {
      title: 'About me — translator UA · DE · EN | ' + BRAND,
      description: 'A translator for documents where every word carries legal weight. Experience with notarial, official and handwritten materials.',
    },
  },
  '/order': {
    ua: {
      title: 'Замовити переклад документа онлайн | ' + BRAND,
      description: 'Надішліть документ — отримайте оцінку обсягу, строку та вартості. Завантаження файлів PDF, JPG, DOCX до 25 МБ. Конфіденційно.',
    },
    de: {
      title: 'Übersetzung online anfragen | ' + BRAND,
      description: 'Senden Sie Ihr Dokument — erhalten Sie eine Einschätzung von Umfang, Frist und Kosten. Datei-Upload PDF, JPG, DOCX bis 25 MB. Vertraulich.',
    },
    en: {
      title: 'Order a document translation online | ' + BRAND,
      description: 'Send your document — get an assessment of scope, deadline and price. File upload PDF, JPG, DOCX up to 25 MB. Confidential.',
    },
  },
  '/contact': {
    ua: {
      title: 'Контакти — швидкий зв\u2019язок | ' + BRAND,
      description: 'Напишіть мені — відповім якнайшвидше. Telegram, WhatsApp, Viber, email або телефон. Переклади документів: українська, німецька, англійська.',
    },
    de: {
      title: 'Kontakt — schnelle Verbindung | ' + BRAND,
      description: 'Schreiben Sie mir — ich antworte schnellstmöglich. Telegram, WhatsApp, Viber, E-Mail oder Telefon. Übersetzungen: Ukrainisch, Deutsch, Englisch.',
    },
    en: {
      title: 'Contact — quick connection | ' + BRAND,
      description: 'Write to me — I will reply as soon as possible. Telegram, WhatsApp, Viber, email or phone. Document translation: Ukrainian, German, English.',
    },
  },
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

  useEffect(() => {
    const path = loc.pathname;
    const lang = ['ua', 'de', 'en'].includes(i18n.language) ? i18n.language : 'ua';
    const origin = window.location.origin;
    const isAdmin = path.startsWith('/admin');

    // html lang mirrors the active language
    document.documentElement.lang = HTML_LANGS[lang];

    // robots: keep admin out of the index
    setMeta('name', 'robots', isAdmin ? 'noindex, nofollow' : 'index, follow');
    if (isAdmin) { document.title = `Admin — ${BRAND}`; return; }

    const meta = (META[path] || META['/'])[lang];
    // admin-configured tab title wins on the home page only
    const adminTitle = settings?.site?.title?.trim();
    const title = path === '/' && adminTitle ? adminTitle : meta.title;

    document.title = title;
    setMeta('name', 'description', meta.description);

    // canonical + open graph + twitter
    const url = origin + path;
    setLink('canonical', url);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', BRAND);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', `${origin}/og-image.png`);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:locale', OG_LOCALES[lang]);
    setMetaAll('property', 'og:locale:alternate', Object.keys(OG_LOCALES).filter((l) => l !== lang).map((l) => OG_LOCALES[l]));
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', `${origin}/og-image.png`);

    // structured data: ProfessionalService (+ live contacts from settings)
    const contacts = settings?.contacts || {};
    const offerNames = {
      ua: ['Юридичні переклади', 'Нотаріальні переклади', 'Переклад рукописних документів'],
      de: ['Juristische Übersetzungen', 'Notarielle Übersetzungen', 'Übersetzung von Handschriften'],
      en: ['Legal translations', 'Notarial translations', 'Translation of handwritten documents'],
    }[lang];
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: BRAND,
      description: META['/'][lang].description,
      url: origin,
      image: `${origin}/og-image.png`,
      priceRange: '€€',
      availableLanguage: [
        { '@type': 'Language', name: 'Ukrainian', alternateName: 'uk' },
        { '@type': 'Language', name: 'German', alternateName: 'de' },
        { '@type': 'Language', name: 'English', alternateName: 'en' },
      ],
      makesOffer: offerNames.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
      ...(contacts.email ? { email: contacts.email } : {}),
      ...(contacts.phone ? { telephone: contacts.phone } : {}),
    };
    setJsonLd('seo-jsonld', schema);
  }, [loc.pathname, i18n.language, settings]);

  return null;
}
