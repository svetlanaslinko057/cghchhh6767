import { manuscriptSample } from './manuscript';

export const de = {
  brand: { name: 'Oksana Oliferenko', line1: 'DOCUMENT TRANSLATION', line2: 'UA · DE · EN' },
  nav: { about: 'Über mich', services: 'Leistungen', work: 'Beispiele', faq: 'FAQ', contact: 'Kontakt', order: 'Übersetzung anfragen' },

  hero: {
    role: 'Übersetzer für Ukrainisch, Deutsch und Englisch',
    lead: 'Juristische, notarielle, amtliche und handschriftliche Dokumente auf Ukrainisch, Deutsch und Englisch. Präzise, vertraulich und mit besonderer Aufmerksamkeit für jede Formulierung.',
    note: 'Für Dokumente, bei denen eine automatische Übersetzung nicht ausreicht.',
    ctaPrimary: 'Übersetzung anfragen',
    ctaSecondary: 'Dokument senden',
  },

  expertise: {
    kicker: 'Spezialisierung',
    items: [
      { term: 'Juristische Dokumente', note: 'Verträge, Vereinbarungen, Satzungen, Vollmachten' },
      { term: 'Notarielle Dokumente', note: 'Unter Berücksichtigung notarieller Anforderungen' },
      { term: 'Urkunden & Bescheinigungen', note: 'Geburt, Ehe, Personenstand, Auszüge' },
      { term: 'Diplome & Bildungsdokumente', note: 'Mit Beiblättern und Noten' },
      { term: 'Gerichtsunterlagen', note: 'Beschlüsse, Urteile, Klagen' },
      { term: 'Handschriftliche & Archivtexte', note: 'Schwierige Handschrift, alte Formulierungen' },
    ],
  },

  manuscript: {
    kicker: 'Der zentrale Beweis',
    title: 'Von der Handschrift zur präzisen Übersetzung',
    sampleLabel: 'Demonstrationsfragment ohne personenbezogene Daten',
    labels: { original: '01 — Original (Handschrift)', transcription: '02 — Transkription & Anmerkungen', translation: '03 — Deutsche Übersetzung' },
    legend: { abbr: 'Abkürzung', illegible: 'unleserlich', strike: 'gestrichen', fix: 'Korrektur' },
    notesTitle: 'Anmerkungen der Übersetzerin',
    notes: [
      '„гр-нъ“ — alte Abkürzung von „громадянинъ“; aufgelöst als „Bürger“.',
      'Das Wort „слюсаря“ (Schlosser) wurde gestrichen und zu „токаря“ (Dreher) korrigiert — es gilt die Korrektur.',
      'Der Name des Betriebs war nicht lesbar — als [unleserlich] markiert, ohne Spekulation.',
      '„токар“ wurde als „Dreher“ (konkreter Beruf) übersetzt, nicht als allgemeines „Metallarbeiter“.',
      'Bei Bedarf wird dasselbe Dokument auch ins Englische übersetzt (UA ⇄ EN, DE ⇄ EN) — mit derselben terminologischen Präzision.',
    ],
    reviewNote: 'Demonstrationsübersetzung; vor amtlicher Verwendung ist eine finale Prüfung erforderlich.',
    enNote: 'Ebenfalls verfügbar: Übersetzung ins Englische (EN)',
    sample: manuscriptSample,
  },

  person: {
    kicker: 'Über mich',
    name: 'Oksana Oliferenko',
    paragraphs: [
      'Ich arbeite mit Dokumenten, bei denen jedes Wort juristisches Gewicht hat: Verträge, notarielle und handschriftliche Unterlagen in den Sprachen Ukrainisch, Deutsch und Englisch.',
      'Mein Ansatz: Inhalt, Genauigkeit der Formulierungen und den offiziellen Stil des Dokuments bewahren.',
    ],
    principle: 'Übersetzen heißt Verantwortung für jedes Wort — nicht Maschinen-Tempo.',
    annotation: 'redaktionelle Notiz · UA · DE · EN',
  },

  method: {
    kicker: 'So arbeite ich',
    title: 'Was mit Ihrem Dokument geschieht',
    steps: [
      { n: '01', t: 'Vertrauliche Annahme', d: 'Das Dokument wird vertraulich empfangen und aufbewahrt.' },
      { n: '02', t: 'Analyse des Dokuments', d: 'Bewertung von Art, Umfang und Kontext. Bei Handschriften: Lesen und Entziffern von Hand.' },
      { n: '03', t: 'Übersetzung & Terminologieprüfung', d: 'Übersetzung von Hand mit Abgleich der juristischen Terminologie.' },
      { n: '04', t: 'Finales Korrekturlesen', d: 'Prüfung auf Genauigkeit, Vollständigkeit und Form.' },
      { n: '05', t: 'Übergabe des fertigen Dokuments', d: 'Sie erhalten die fertige Übersetzung im vereinbarten Format.' },
    ],
  },

  contact: { kicker: 'Anfrage', title: 'Senden Sie das Dokument — ich schätze Umfang, Frist und Preis ein', cta: 'Übersetzung anfragen', rights: 'Alle Rechte vorbehalten', privacy: 'Datenschutz', email: '', phone: '', messengers: [] },

  // PRICING SCENE (home) + LEAD-GEN BANDS
  pricing: {
    kicker: 'Preise',
    title: 'Was kostet eine Übersetzung?',
    lead: 'Wählen Sie den Dokumenttyp und erhalten Sie sofort einen Richtpreis — ohne Wartezeit.',
    heroHint: 'ab 35 € · Berechnung in 30 Sekunden',
    expLink: 'Preis für Ihr Dokument berechnen',
  },
  leadCta: {
    proof: {
      kicker: 'Ihr Dokument',
      title: 'Haben Sie ein komplexes oder handschriftliches Dokument?',
      text: 'Senden Sie es mir — ich schätze Umfang, Frist und Preis kostenlos ein. Unverbindlich.',
      primary: 'Dokument senden',
      ghost: 'Preis berechnen',
    },
    method: {
      kicker: 'Nächster Schritt',
      title: 'Bereit anzufangen?',
      text: 'Die Anfrage dauert 2 Minuten. Die Einschätzung ist kostenlos und unverbindlich.',
      primary: 'Übersetzung anfragen',
      ghost: 'Preis berechnen',
    },
    services: {
      kicker: 'Preise',
      title: 'Erfahren Sie den Preis Ihrer Übersetzung',
      text: 'Richtpreis in 30 Sekunden — Dokumenttyp, Seitenzahl, Frist.',
      primary: 'Übersetzung anfragen',
      ghost: 'Preis berechnen',
    },
    about: {
      kicker: 'Zusammenarbeit',
      title: 'Vertrauen Sie Ihr Dokument einem Fachmann an',
      text: 'Senden Sie Ihr Dokument zur kostenlosen Einschätzung — ich antworte mit Umfang, Frist und Preis.',
      primary: 'Dokument senden',
      ghost: 'Preis berechnen',
    },
  },
};
export default de;

