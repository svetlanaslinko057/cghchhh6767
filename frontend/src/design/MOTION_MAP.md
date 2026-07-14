# MOTION MAP

Engine: **GSAP** (single source) + **ScrollTrigger** + **SplitText** + **Lenis** via unified `gsap.ticker`.
Global rules:
- Animate only `transform` / `opacity` / `clip-path`. Never animate layout props inside scroll timelines.
- `gsap.matchMedia()` for desktop/mobile variants.
- `prefers-reduced-motion: reduce` \u2192 disable Lenis smooth scroll, disable ALL pins/scrubs, content shown statically (autoAlpha 1).
- `ScrollTrigger.refresh()` after fonts (`document.fonts.ready`) and hero images load.
- No artificial % preloader.

| Scene | Trigger | Motion | Duration | Easing | Pin / Scrub | Mobile fallback |
|---|---|---|---|---|---|---|
| Hero name | on load | masked line reveal (SplitText lines, yPercent 118\u21920) | \u2264 1.1s + stagger .09 (total \u2264 1.4s) | power4.out | none | same, faster |
| Hero role/CTA | after name | fade + 12px rise, staggered | 0.5s | power3.out | none | same |
| Hero document | in-view | slow y drift (parallax) | scrub | none | scrub, no pin | reduced amount |
| Expertise rows | in-view / hover | active row: x shift 12\u201320px + note fade-in | 0.4s | power2.out | none | in-view triggers note |
| Manuscript | section top | scrub timeline 0\u21921: original \u2192 line-highlight+transcription \u2192 translation | scrub 1 | none (linear scrub) | **pin + scrub**, end +=180% | **no pin**; 3 sequential clipReveal states |
| Person portrait | in-view | clipReveal inset(0 0 100%\u21920) + parallax 6\u20138% | 1.1s | power3.out | parallax scrub | clipReveal only, no parallax |
| Person text | in-view | masked line reveal | 0.9s + stagger | power4.out | none | same |
| Method line | section in-view | progress line scaleY/scaleX 0\u21921; active step opacity 0.4\u21921 | scrub | none | scrub (line fill) | vertical line, scrub |
| Header | scroll > 40px | transparent \u2192 solid paper + shrink height | 0.3s | power2.out | none | same |
| Page transition | route change | paper curtain wipe (OO monogram) in/out | \u2264 0.55s total | power3.inOut | none | same, \u2264 0.45s |
| Custom cursor | pointer: fine only | dot + ring lerp; label on interactive | \u2014 | \u2014 | \u2014 | DISABLED on touch |

Manuscript scrub detail (desktop):
- 0.00\u20130.33: original visible; annotation `01` in.
- 0.33\u20130.66: SVG guide lines draw (strokeDashoffset via transform-safe technique / opacity), transcription lines reveal; `02`.
- 0.66\u20131.00: translation lines reveal, original \u2192 opacity .35; `03`.
