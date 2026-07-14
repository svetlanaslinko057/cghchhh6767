import { useRef, useEffect, useState } from 'react';
import { useContent } from '../content';
import { gsap, maskLineReveal } from '../motion/motionSystem';
import SideSheet from '../components/SideSheet';
import { useSiteSettings } from '../lib/settings';
import { scrollToHash } from '../lib/scroll';
import { openOrderModal } from '../lib/orderModal';

export default function Hero() {
  const c = useContent();
  const settings = useSiteSettings();
  const heroTitle = settings?.site?.hero_title?.trim() || c.brand.name;
  const heroLead = settings?.site?.hero_lead?.trim() || c.hero.lead;
  const nameRef = useRef(null); const stage = useRef(null); const dotRef = useRef(null);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const n = maskLineReveal(nameRef.current, { duration: 1.05, stagger: 0.08, delay: 0.15 });
      gsap.from('[data-hero-fade]', { opacity: 0, y: 16, duration: 0.7, delay: 0.6, stagger: 0.07, ease: 'power3.out' });
      gsap.from('.sheet, .desk__scale, .desk__stamp, .desk__clip', { opacity: 0, z: -60, duration: 1, delay: 0.5, stagger: 0.08, ease: 'power3.out' });
      // scale marker travels UA -> DE, mirroring the translation path
      if (dotRef.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(dotRef.current, { top: '6%' }, { top: '78%', duration: 2.2, delay: 1.2, ease: 'power2.inOut' });
      }
      return () => { n && n.revert && n.revert(); };
    });
    // pointer parallax (desktop, fine pointer only)
    let cleanup;
    if (stage.current && matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(stage.current, { transformPerspective: 1300, transformStyle: 'preserve-3d' });
      const ry = gsap.quickTo(stage.current, 'rotationY', { duration: 0.7, ease: 'power3' });
      const rx = gsap.quickTo(stage.current, 'rotationX', { duration: 0.7, ease: 'power3' });
      const onMove = (e) => {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        ry(((e.clientX - cx) / cx) * 6);
        rx((-(e.clientY - cy) / cy) * 5);
      };
      window.addEventListener('pointermove', onMove);
      cleanup = () => window.removeEventListener('pointermove', onMove);
    }
    return () => { ctx.revert(); if (cleanup) cleanup(); };
  }, [c, heroTitle, heroLead]);

  return (
    <section className="hero" style={{ minHeight: '94vh', display: 'flex', alignItems: 'center', paddingTop: 110, paddingBottom: 40 }}>
      <div className="container hero-grid">
        <div>
          <div className="mono" data-hero-fade style={{ color: 'var(--accent)', marginBottom: '1.4rem' }}>{c.hero.role}</div>
          <h1 key={heroTitle} ref={nameRef} className="hero-name">{heroTitle}</h1>
          <p data-hero-fade className="hero-lead">{heroLead}</p>
          <div data-hero-fade className="hero-note mono">{c.hero.note}</div>
          <div data-hero-fade style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '2.2rem', flexWrap: 'wrap' }}>
            <button data-cta className="btn btn-primary" onClick={() => openOrderModal({ origin: 'CTA · Hero' })} data-testid="hero-order-cta"><span className="dot" />{c.hero.ctaPrimary}</button>
            <button className="doc-tab" onClick={() => setSheet(true)}>↑ {c.hero.ctaSecondary}</button>
          </div>
          <div data-hero-fade style={{ marginTop: '1.3rem' }}>
            <button className="price-hint" onClick={() => scrollToHash('#pricing')} data-testid="hero-pricing-link">
              <span className="ph-dot" />{c.pricing.heroHint} ↓
            </button>
          </div>
        </div>

        <div className="desk" data-doc aria-hidden="true">
          <div ref={stage} className="desk__stage">
            <div className="sheet sheet--original">
              <div className="sheet__tag">AKTE № — &nbsp; 1994–1999</div>
              <p className="hand" style={{ fontSize: '1.05rem', lineHeight: 1.9, marginTop: '.8rem' }}>Довідку видано в тім, що гр-нъ…</p>
              <p className="hand" style={{ fontSize: '1.05rem', opacity: .6 }}>…на посаді <span style={{ textDecoration: 'line-through' }}>слюсаря</span> токаря</p>
            </div>
            <div className="sheet sheet--tracing">
              <div className="sheet__tag">UA → DE · note</div>
              <p className="hand" style={{ color: 'var(--accent-2)', fontSize: '.95rem', marginTop: '.6rem' }}>токар = Dreher</p>
              <svg width="80" height="30" style={{ marginTop: '.4rem', overflow: 'visible' }}><path d="M2 22 C 25 4, 55 4, 76 20" stroke="var(--accent-2)" fill="none" strokeWidth="1.2" /><path d="M70 12 L76 20 L66 21" stroke="var(--accent-2)" fill="none" strokeWidth="1.2" /></svg>
            </div>
            <div className="sheet sheet--translation">
              <div className="sheet__tag">03 — DE</div>
              <p className="ms-de-mini" style={{ marginTop: '.6rem' }}>… als <strong>Dreher</strong> tätig war. Die Einträge sind beglaubigt.</p>
            </div>
            <div className="desk__scale" aria-hidden="true">
              <span>UA</span>
              <span className="bar"><i ref={dotRef} className="dot" /></span>
              <span>DE</span>
            </div>
            <div className="desk__stamp" aria-hidden="true">
              <span className="st-oo">OO</span>
              <span className="st-txt">UA ⇄ DE</span>
            </div>
            <div className="desk__clip" />
          </div>
        </div>
      </div>
      <SideSheet open={sheet} onClose={() => setSheet(false)} />
    </section>
  );
}
