// Shared demonstration manuscript sample (UA handwritten -> UA transcription -> DE).
// Educational/demo only. NO personal data. Does NOT imitate a real institution,
// stamp, official or requisites. German text is [REVIEW REQUIRED] before production.
//
// original: token stream; k marks the translator-relevant difficulty:
//   abbr = abbreviation, illegible = unreadable, strike = crossed out, fix = correction
export const manuscriptSample = {
  original: [
    { t: 'Довідку видано в тім, що ' },
    { t: 'гр-нъ', k: 'abbr' },
    { t: ' працював на ' },
    { t: '[…]', k: 'illegible' },
    { t: ' з 1963 по 1971 р. на посаді ' },
    { t: 'слюсаря', k: 'strike' },
    { t: 'токаря', k: 'fix' },
    { t: '. Записи завірено.' },
  ],
  transcription:
    'Довідку видано в тому, що громадянин працював на [підприємство — назва нерозбірлива] з 1963 по 1971 рік на посаді токаря. Записи завірено.',
  translation:
    'Die Bescheinigung wird darüber ausgestellt, dass der Bürger von 1963 bis 1971 in [unleserlich] als Dreher tätig war. Die Einträge sind beglaubigt.',
};
export default manuscriptSample;
