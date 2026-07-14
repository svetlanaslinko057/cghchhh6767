// Smooth-scrolls to an in-page anchor, Lenis-aware.
export function scrollToHash(hash, offset = -80) {
  const el = document.querySelector(hash);
  if (!el) return false;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset, duration: 1.1 });
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
