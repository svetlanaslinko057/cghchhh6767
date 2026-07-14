# CREATIVE DIRECTION \u2014 Oksana Oliferenko / Document Translation UA \u21c4 DE

## 0. Positioning
Personal editorial brand of ONE translator. Not an agency, not a SaaS, not an AI product.
Feeling: calm competence, responsibility, intellect, attention to detail.
`Oksana Oliferenko` is the visual logotype (wordmark) \u2014 kept in **Latin in every locale**.

## 1. Brand wordmark
```
OKSANA OLIFERENKO
DOCUMENT TRANSLATION
UKRAINIAN \u21c4 GERMAN
```
- Header: compact lockup (name + 2 utility lines in mono).
- Hero: name is the largest element on the page (`--t-wordmark`, up to ~8.5rem), set on 1\u20132 lines with masked line reveal.

## 2. Design tokens (see styles/tokens.css)
paper #F5F1E8 \u00b7 paper-light #FCFAF5 \u00b7 ink #1B1B18 \u00b7 olive #39463D \u00b7 warm #B9885A \u00b7 line rgba(27,27,24,.18).
Grain opacity 0.032 (subtle, never dirty). Olive/warm are ACCENTS only. No random dark full-bleed blocks.

## 3. Typography hierarchy (real contrast, not uniform)
- Display (General Sans): wordmark + scene titles. Tight tracking, large.
- Body (Inter): paragraphs, `--t-body` / `--t-lead`.
- Utility (IBM Plex Mono): section numbers, labels, case markers, language tags. Small, uppercase.
Never set the whole UI in mono.

## 4. Brand micro-details (human, meaningful \u2014 not decorative noise)
- `OO` monogram as a secondary mark (footer, favicon, curtain transition).
- Editorial notes / margin annotations (mono, small): `AKTE \u2116 \u2014`, `UA \u2192 DE`, `handschriftlich`.
- One restrained handwritten stroke near the signature proof.
- Language & line markers on the manuscript fragment.
Every detail must carry meaning; no ornaments \u201cfor beauty\u201d.

## 5. Homepage = 6 scenes (compact editorial story, NOT a catalog)
Total page target: compact. Hero ~85\u201395vh; other scenes sized by content, not forced 100vh.

### SCENE 1 \u2014 HERO / PERSONAL SIGNATURE (~85\u201395vh)
- DESKTOP: asymmetric editorial grid. Left/center: huge `Oksana Oliferenko` wordmark + role (mono) + one-line positioning. Below: primary CTA \u201c\u0417\u0430\u043c\u043e\u0432\u0438\u0442\u0438 \u043f\u0435\u0440\u0435\u043a\u043b\u0430\u0434\u201d + secondary text-link \u201c\u041d\u0430\u0434\u0456\u0441\u043b\u0430\u0442\u0438 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u201d (compact upload trigger, opens hidden input / routes to /order). Right: a single tall document/handwriting fragment with slow drift + editorial annotations. NO big empty upload card.
- MOBILE: wordmark first (2\u20133 lines), positioning, primary CTA full-width, upload trigger as text link; document fragment becomes a slim band below.

### SCENE 2 \u2014 EXPERTISE TICKER (content height, ~auto)
- Typographic flow of document types (display size), each row = term + mono note.
- Active row (hover on desktop / in-view on mobile) reveals its note and shifts slightly horizontally.
- No carousel/Swiper. No cards.

### SCENE 3 \u2014 MANUSCRIPT PROOF (signature; pinned, longer by design)
- DESKTOP: pinned sticky composition, scrub 0\u21921.
  - 0\u20130.33: handwritten UA original (paper card + subtle handwriting styling), annotations `01`, case label.
  - 0.33\u20130.66: SVG guide-lines highlight rows; clean UA transcription types/reveals beside it (`02`).
  - 0.66\u20131: German translation reveals, original dims (`03`).
- MOBILE: NO pin. Three stacked states revealed sequentially on scroll (clipReveal), same content.
- Content = fictional sample from content/uk.js (no personal data). Shown to owner before build.

### SCENE 4 \u2014 PERSON (content height)
- DESKTOP: portrait occupies a significant column (temporary neutral image-shell = empty composed area, NO fictional face/silhouette/avatar/\u201cPlaceholder\u201d text). clipReveal + 6\u20138% parallax. Right: 2 short paragraphs + one principle line (large, display).
- MOBILE: image-shell band on top, text below.

### SCENE 5 \u2014 METHOD / \u201cWhat happens to your document\u201d (replaces testimonials)
- Single connected progress line (vertical on mobile / horizontal or stepped on desktop) with 5 stages: confidential handling \u2192 manual transcription \u2192 terminology check \u2192 final proofread \u2192 delivery.
- Active stage emphasised as the line fills on scroll. NOT 5 identical cards.
- Provides trust through process, without invented social proof. No claim that specific institutions guarantee acceptance.

### SCENE 6 \u2014 CONTACT / FOOTER (strong finale)
- Large `Oksana Oliferenko` again + one-line CTA. Compact inline form OR CTA button to /order.
- Contacts pulled from a single content source; if empty \u2192 nothing fake rendered.
- OO monogram, copyright, privacy link.

## 6. Removed vs old site
- Deleted: testimonials scene (no demo data), emoji manuscript cards, artificial preloader, \u201cPortrait Placeholder\u201d text, universal Reveal fade-up, fake footer contacts, ~7 repeated card grids.
- Detailed services list, FAQ, all document types, full form \u2192 stay on INNER pages (/services, /faq, /order). Home is a story, not a catalog.

## 7. Inner pages
/about, /services (+ FAQ), /work (document-type examples), /order (full form + upload, kept), /contact. Restyled to the same tokens/typography, lighter motion.
