import { useRef, useEffect } from 'react';
import { useContent } from '../content';
import { gsap, clipReveal, maskLineReveal, parallax, prefersReducedMotion } from '../motion/motionSystem';
import { Monogram } from '../components/Wordmark';

export default function Person() {
  const c = useContent(); const p = c.person;
  const paper = useRef(null); const note = useRef(null); const principle = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (paper.current) clipReveal(paper.current, { duration: 1.0 });
      if (note.current && !prefersReducedMotion()) {
        gsap.from(note.current, { opacity: 0, y: 26, rotation: 6, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: note.current, start: 'top 84%' } });
        // layers move at different speeds while scrolling
        parallax(paper.current, { amount: 0.035 });
        parallax(note.current, { amount: 0.1 });
      }
      if (principle.current) maskLineReveal(principle.current, { duration: 0.9, stagger: 0.06 });
    });
    return () => ctx.revert();
  }, [c]);
  return (
    <section className="scene" style={{ background: 'var(--paper)' }}>
      <div className="container person-grid">
        {/* Editorial desk composition (photo asset-slot preserved for the future) */}
        <div className="person-comp" data-photo-slot="portrait-4x5" aria-hidden="true" data-doc>
          <div ref={paper} className="person-comp__paper">
            <div className="mono person-comp__tag">{p.annotation}</div>
            <p className="hand">… токаря → <span style={{ color: 'var(--accent)' }}>Dreher</span></p>
            <div className="person-comp__rule" />
            <div className="person-comp__sign">Oksana O.</div>
            <div className="person-comp__mono person-emboss"><Monogram size={40} /></div>
          </div>
          {/* Overlapping note — breaks out of the frame, moves faster on scroll */}
          <div ref={note} className="person-note">
            <div className="mono person-note__tag">UA · DE · EN</div>
            <p className="hand person-note__hand">{p.principle}</p>
          </div>
        </div>
        <div>
          <div className="mono eyebrow" style={{ marginBottom: '1.4rem' }}>{p.kicker}</div>
          <h2 className="scene-title" style={{ marginBottom: '1.6rem' }}>{p.name}</h2>
          {p.paragraphs.map((t, i) => <p key={i} className="person-p">{t}</p>)}
          <blockquote ref={principle} className="person-principle">{p.principle}</blockquote>
        </div>
      </div>
    </section>
  );
}
