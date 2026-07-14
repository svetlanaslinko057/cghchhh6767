import { manuscriptSample } from './manuscript';

export const en = {
  brand: { name: 'Oksana Oliferenko', line1: 'DOCUMENT TRANSLATION', line2: 'UA · DE · EN' },
  nav: { about: 'About me', services: 'Services', work: 'Examples', faq: 'FAQ', contact: 'Contact', order: 'Order a translation' },

  // SEO — per-route meta (admin-editable via CMS)
  seo: {
    home: {
      title: 'Oksana Oliferenko — document translation UA · DE · EN',
      description: 'Professional document translation: Ukrainian, German, English. Legal, notarial, official and handwritten documents. Precise, confidential, on time.',
    },
    services: {
      title: 'Translation services — legal, notarial, handwritten | Oksana Oliferenko',
      description: 'Translation of contracts, powers of attorney, certificates, diplomas, court decisions and handwritten documents. Three languages: Ukrainian, German, English.',
    },
    work: {
      title: 'Work examples & translation prices | Oksana Oliferenko',
      description: 'Examples of document types with estimated prices from €35. Online translation price calculator: Ukrainian, German, English.',
    },
    about: {
      title: 'About me — translator UA · DE · EN | Oksana Oliferenko',
      description: 'A translator for documents where every word carries legal weight. Experience with notarial, official and handwritten materials.',
    },
    order: {
      title: 'Order a document translation online | Oksana Oliferenko',
      description: 'Send your document — get an assessment of scope, deadline and price. File upload PDF, JPG, DOCX up to 25 MB. Confidential.',
    },
    contact: {
      title: 'Contact — quick connection | Oksana Oliferenko',
      description: 'Write to me — I will reply as soon as possible. Telegram, WhatsApp, Viber, email or phone. Document translation: Ukrainian, German, English.',
    },
    offers: ['Legal translations', 'Notarial translations', 'Translation of handwritten documents'],
  },

  // SCENE 1 — HERO
  hero: {
    role: 'Professional document translator',
    lead: 'Legal, notarial, official and handwritten documents in Ukrainian, German and English. Precise, confidential and attentive to every formulation.',
    note: 'For documents where automatic translation is not enough.',
    ctaPrimary: 'Order a translation',
    ctaSecondary: 'Send a document',
  },

  // SCENE 2 — EXPERTISE
  expertise: {
    kicker: 'Specialisation',
    items: [
      { term: 'Legal documents', note: 'Contracts, agreements, articles of association, powers of attorney' },
      { term: 'Notarial documents', note: 'Prepared with notarial requirements in mind' },
      { term: 'Certificates & statements', note: 'Birth, marriage, civil records, extracts' },
      { term: 'Diplomas & educational documents', note: 'Including supplements and grades' },
      { term: 'Court materials', note: 'Decisions, rulings, claims' },
      { term: 'Handwritten & archival texts', note: 'Difficult handwriting, historical wording' },
    ],
  },

  // SCENE 3 — MANUSCRIPT PROOF
  manuscript: {
    kicker: 'The core proof',
    title: 'From a manuscript to a precise translation',
    sampleLabel: 'Demonstration fragment without personal data',
    labels: { original: '01 — Original (manuscript)', transcription: '02 — Transcription & notes', translation: '03 — German translation' },
    legend: { abbr: 'abbreviation', illegible: 'illegible', strike: 'struck out', fix: 'correction' },
    notesTitle: 'Translator’s notes',
    notes: [
      '“гр-нъ” — an old-style abbreviation of “громадянинъ” (citizen); restored as “citizen”.',
      'The word “слюсаря” (locksmith) was struck out and corrected to “токаря” (lathe operator) — the corrected variant is used in the translation.',
      'The company name could not be read — marked as [illegible], without guessing.',
      'The occupation “токар” was translated as “Dreher” (a specific trade), not the generic “Metallarbeiter”.',
      'On request, the same document is also translated into English (UA ⇄ EN, DE ⇄ EN) — with the same terminological precision.',
    ],
    reviewNote: 'Demonstration translation; a final review is required before official use.',
    enNote: 'Also available: translation into English (EN)',
    sample: manuscriptSample,
  },

  // SCENE 4 — PERSON
  person: {
    kicker: 'About me',
    name: 'Oksana Oliferenko',
    paragraphs: [
      'I work with documents where every word carries legal weight: contracts, notarial and handwritten materials in Ukrainian, German and English.',
      'My approach is to preserve the meaning, the precision of wording and the official style of the document.',
    ],
    principle: 'Translation is responsibility for every word — not machine speed.',
    annotation: 'editorial note · UA · DE · EN',
  },

  // SCENE 5 — METHOD
  method: {
    kicker: 'How I work',
    title: 'What happens to your document',
    steps: [
      { n: '01', t: 'Confidential intake', d: 'Your document is received and stored confidentially.' },
      { n: '02', t: 'Document analysis', d: 'Assessment of type, volume and context. For manuscripts — manual reading and transcription of the text.' },
      { n: '03', t: 'Translation & terminology check', d: 'Manual translation with verification of legal terminology.' },
      { n: '04', t: 'Final proofreading', d: 'A check for accuracy, completeness and formatting.' },
      { n: '05', t: 'Delivery of the finished document', d: 'You receive the finished translation in the agreed format.' },
    ],
  },

  // SCENE 6 — CONTACT / FOOTER
  contact: {
    kicker: 'Order',
    title: 'Send the document — I will assess the scope, deadline and price',
    cta: 'Order a translation',
    rights: 'All rights reserved',
    privacy: 'Privacy',
    email: '', phone: '', messengers: [],
  },

  // PRICING SCENE (home) + LEAD-GEN BANDS
  pricing: {
    kicker: 'Pricing',
    title: 'How much does a translation cost?',
    lead: 'Choose the document type and get an estimated price instantly — no waiting for a reply.',
    heroHint: 'from €35 · estimate in 30 seconds',
    expLink: 'Calculate the price for your document',
  },
  leadCta: {
    proof: {
      kicker: 'Your document',
      title: 'Have a complex or handwritten document?',
      text: 'Send it to me — I will assess the scope, deadline and price for free. No obligation.',
      primary: 'Send a document',
      ghost: 'Calculate the price',
    },
    method: {
      kicker: 'Next step',
      title: 'Ready to start?',
      text: 'The request takes 2 minutes. The assessment is free and comes with no obligation.',
      primary: 'Order a translation',
      ghost: 'Calculate the price',
    },
    services: {
      kicker: 'Pricing',
      title: 'Find out the price of your translation',
      text: 'An estimate in 30 seconds — document type, number of pages, deadline.',
      primary: 'Order a translation',
      ghost: 'Calculate the price',
    },
    about: {
      kicker: 'Cooperation',
      title: 'Entrust your document to a specialist',
      text: 'Send your document for a free assessment — I will reply with the scope, deadline and price.',
      primary: 'Send a document',
      ghost: 'Calculate the price',
    },
  },
};
export default en;
