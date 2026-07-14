// 3 working languages (UA / DE / EN) -> 6 translation directions.
// Base doc prices refer to the UA<->DE pair; other pairs apply a multiplier.
export const DIRECTIONS = ['ua-de', 'de-ua', 'ua-en', 'en-ua', 'de-en', 'en-de'];

export const PAIR_OF = {
  'ua-de': 'ua-de', 'de-ua': 'ua-de',
  'ua-en': 'ua-en', 'en-ua': 'ua-en',
  'de-en': 'de-en', 'en-de': 'de-en',
};

export const DIR_SHORT = {
  'ua-de': 'UA → DE', 'de-ua': 'DE → UA',
  'ua-en': 'UA → EN', 'en-ua': 'EN → UA',
  'de-en': 'DE → EN', 'en-de': 'EN → DE',
};

export function pairMult(pricing, direction) {
  const m = pricing?.pair_multipliers || {};
  const v = Number(m[PAIR_OF[direction]] ?? 1);
  return Number.isFinite(v) && v > 0 ? v : 1;
}
