import { useState } from 'react';
import { useContent } from '../content';
import { RevealHeading, Reveal } from '../components/Reveal';
import { scrollToHash } from '../lib/scroll';

export default function Expertise() {
  const c = useContent();
  const [active, setActive] = useState(0);
  return (
    <section className="scene" style={{ background: 'var(--card)' }}>
      <div className="container">
        <div className="mono eyebrow" style={{ marginBottom: '2rem' }}>{c.expertise.kicker}</div>
        <div className="exp-list">
          {c.expertise.items.map((it, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className={`exp-row${active === i ? ' is-active' : ''}`} data-cursor
                onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0}>
                <span className="exp-term">{it.term}</span>
                <span className="exp-note mono">{it.note}</span>
                <span className="exp-idx mono">/ {String(i + 1).padStart(2, '0')}</span>
              </div>
            </Reveal>
          ))}
        </div>
        {/* lead-gen nudge: straight into the calculator below */}
        <Reveal delay={0.1}>
          <div className="exp-cta">
            <button className="price-hint" onClick={() => scrollToHash('#pricing')} data-testid="expertise-pricing-link">
              <span className="ph-dot" />{c.pricing.expLink} ↓
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
