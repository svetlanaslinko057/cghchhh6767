# CONTENT MODEL

Source of truth: `src/content/uk.js` and `src/content/de.js`. Components read from these only.
Contacts live in ONE place (content.contact) \u2014 never duplicated into components.

Legend: [REAL] publish \u00b7 [TEMP] safe placeholder, replace later \u00b7 [BLOCK] must NOT publish until owner confirms.

## Per scene
| Scene | Field | Status | Note |
|---|---|---|---|
| Brand | name `Oksana Oliferenko` | [BLOCK] spelling | Confirm exact Latin spelling before launch |
| Brand | line1/line2 | [REAL] | Descriptive, safe |
| Hero | role \u201c\u041f\u0440\u043e\u0444\u0435\u0441\u0456\u0439\u043d\u0438\u0439 \u043f\u0435\u0440\u0435\u043a\u043b\u0430\u0434\u0430\u0447\u201d | [REAL] | Neutral, true |
| Hero | \u201c\u043f\u0440\u0438\u0441\u044f\u0436\u043d\u0438\u0439 / beeidigt(er) \u00dcbersetzer\u201d | [BLOCK] | Legal certification claim \u2014 do NOT add unless owner is officially sworn |
| Hero | sub | [REAL] | No numbers/guarantees |
| Expertise | items+notes | [REAL] | Generic document categories |
| Manuscript | sample (orig/transcription/DE) | [TEMP] fictional + [REVIEW REQUIRED] | No personal data. German text MUST be verified by a qualified native translator before production. |
| Brand | name `Oksana Oliferenko` (Latin, all locales) | [OWNER CONFIRMATION REQUIRED] | Working value in dev; confirm exact spelling before launch |
| Person | paragraphs | [TEMP] | Owner to refine bio |
| Person | principle quote | [TEMP] | Owner may reword |
| Person | portrait | [BLOCK] image | Real photo required; until then neutral image-shell, no fictional face |
| Method | 5 steps | [REAL] | Process description, no social proof |
| Trust/testimonials | \u2014 | [REMOVED] | Scene deleted entirely; no demo reviews in UI |
| Contact | email/phone/messengers | [BLOCK] | Empty until owner provides; if empty render nothing, CTA \u2192 /order |
| Numbers | \u201c10+ \u0440\u043e\u043a\u0456\u0432\u201d, \u201c5000+ \u0441\u0442\u043e\u0440\u0456\u043d\u043e\u043a\u201d, \u201c100% \u043f\u0440\u0438\u0439\u043c\u0430\u044e\u0442\u044c\u201d | [BLOCK] | No invented stats or acceptance guarantees anywhere |

## Hard rules
1. No fake email/phone/links. Empty contact fields => component renders nothing.
2. No invented experience numbers or institutional-acceptance guarantees.
3. No fictional portrait/face/silhouette/avatar; no visible \u201cPlaceholder\u201d text.
4. Personal name always Latin.
5. Testimonials only if/when real, verifiable ones are provided.
