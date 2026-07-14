import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContent } from '../content';
import { Reveal } from './Reveal';
import { gsap, prefersReducedMotion } from '../motion/motionSystem';
import { scrollToHash } from '../lib/scroll';
import { openOrderModal } from '../lib/orderModal';

// Reusable editorial lead-gen band. variant: proof | method | services | about
export default function CtaBand({ variant = 'method' }) {
  const c = useContent();
  const t = c.leadCta[variant] || c.leadCta.method;
  const nav = useNavigate();
  const loc = useLocation();
  const stamp = useRef(null);

  useEffect(() => {
    if (!stamp.current || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(stamp.current, { rotation: -22 }, {
        rotation: 14, ease: 'none',
        scrollTrigger: { trigger: stamp.current, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    });
    return () => ctx.revert();
  }, []);

  const goCalc = () => {
    if (loc.pathname === '/') { scrollToHash('#pricing'); return; }
    nav('/#pricing');
  };

  return (
    <section className="scene ctab-scene">
      <div className="container">
        <Reveal>
          {/* tear-off perforation — deliberate separator between content above and the slip */}
          <div className="ctab__perf" aria-hidden="true" />
          <div className="ctab" data-doc data-testid={`cta-band-${variant}`}>
            <span ref={stamp} className="ctab__stamp" aria-hidden="true">
              <i className="ctab__stamp-oo">OO</i>
              <i className="ctab__stamp-txt mono">UA·DE·EN</i>
            </span>
            <div className="ctab__grid">
              <div>
                <div className="mono ctab__kicker">{t.kicker}</div>
                <h3 className="ctab__title">{t.title}</h3>
                <p className="ctab__text">{t.text}</p>
              </div>
              <div className="ctab__actions">
                <button data-cta className="btn btn-primary" onClick={() => openOrderModal({ origin: `CTA · ${variant}` })} data-testid={`cta-${variant}-order`}>
                  <span className="dot" />{t.primary}
                </button>
                <button className="btn btn-ghost ctab__ghost" onClick={goCalc} data-testid={`cta-${variant}-calc`}>
                  {t.ghost} →
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
