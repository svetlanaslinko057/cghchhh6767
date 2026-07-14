// motionSystem.js \u2014 single GSAP/Lenis motion module for the redesign.
// NOTE: This is a deliverable module. It is NOT yet imported by any component
// (visual implementation happens only after PROMPT 3 approval).
// All timelines honour prefers-reduced-motion and animate transform/opacity only.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Unified Lenis <-> GSAP ticker (used by SmoothScrollProvider in impl phase).
export function attachLenisToGsap(lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  const update = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(update);
  gsap.ticker.lagSmoothing(0);
  return () => { gsap.ticker.remove(update); };
}

// 1) Masked line reveal (hero name, headings). Uses SplitText lines + overflow mask.
export function maskLineReveal(el, { delay = 0, stagger = 0.09, duration = 1.1 } = {}) {
  if (!el) return null;
  if (prefersReducedMotion()) { gsap.set(el, { autoAlpha: 1 }); return null; }
  const split = new SplitText(el, { type: 'lines', linesClass: 'line' });
  split.lines.forEach((l) => {
    const w = document.createElement('span');
    w.style.display = 'block'; w.style.overflow = 'hidden';
    l.parentNode.insertBefore(w, l); w.appendChild(l);
  });
  gsap.set(el, { autoAlpha: 1 });
  const tl = gsap.from(split.lines, {
    yPercent: 118, duration, delay, stagger, ease: 'power4.out',
  });
  return { tl, revert: () => split.revert() };
}

// 2) Pinned scrub timeline (manuscript proof). Returns a timeline bound to ScrollTrigger.
//    phases: array of callbacks that add tweens at 0..1 progress positions.
export function pinnedScrub(section, buildTimeline, { end = '+=180%' } = {}) {
  if (!section) return null;
  if (prefersReducedMotion()) return null; // impl renders 3 sequential states instead
  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end, pin: true, scrub: 1, anticipatePin: 1 },
  });
  buildTimeline(tl);
  return tl;
}

// 3) Clip-path image reveal (portrait, document fragments).
export function clipReveal(el, { duration = 1.1, start = 'top 80%' } = {}) {
  if (!el) return null;
  if (prefersReducedMotion()) { gsap.set(el, { clipPath: 'inset(0 0 0 0)' }); return null; }
  return gsap.fromTo(el,
    { clipPath: 'inset(0 0 100% 0)' },
    { clipPath: 'inset(0 0 0% 0)', duration, ease: 'power3.out',
      scrollTrigger: { trigger: el, start } });
}

// 4) Gentle parallax (6\u20138%). y in px derived from viewport.
export function parallax(el, { amount = 0.07 } = {}) {
  if (!el || prefersReducedMotion()) return null;
  return gsap.to(el, {
    yPercent: -amount * 100, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

export { gsap, ScrollTrigger, SplitText };
