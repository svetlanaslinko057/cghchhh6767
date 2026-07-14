import { useRef, useEffect, useState } from 'react';
import { useContent } from '../content';
import { gsap, prefersReducedMotion } from '../motion/motionSystem';

const TOKENS = ['received', 'analysed', 'translated', 'proofread', 'ready'];

export default function Method() {
  const c = useContent(); const mth = c.method;
  const line = useRef(null); const wrap = useRef(null);
  const [stage, setStage] = useState(() => (prefersReducedMotion() ? 5 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) { setStage(5); return undefined; }
    const ctx = gsap.context(() => {
      gsap.fromTo(line.current, { scaleY: 0 }, { scaleY: 1, ease: 'none', transformOrigin: 'top',
        scrollTrigger: { trigger: wrap.current, start: 'top 65%', end: 'bottom 80%', scrub: true } });
      // Stage is driven by overall progress -> robust to fast scroll jumps
      const steps = gsap.utils.toArray('.method-step', wrap.current);
      gsap.timeline({
        scrollTrigger: {
          trigger: wrap.current, start: 'top 70%', end: 'bottom 72%', scrub: true,
          onUpdate: (self) => setStage(Math.min(5, Math.round(self.progress * 5))),
        },
      });
      steps.forEach((el) => {
        gsap.fromTo(el, { opacity: 0.35, x: -8 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 74%' } });
      });
    }, wrap);
    return () => ctx.revert();
  }, [c]);

  const docCls = TOKENS.slice(0, stage).map((_, i) => `s-ge-${i + 1}`).join(' ');

  return (
    <section className="scene" style={{ background: 'var(--card)' }}>
      <div className="container">
        <div className="mono eyebrow" style={{ marginBottom: '1rem' }}>{mth.kicker}</div>
        <h2 className="scene-title" style={{ maxWidth: 720, marginBottom: '3rem' }}>{mth.title}</h2>
        <div ref={wrap} className="method-journey">
          {/* Document token travelling through the 5 stages */}
          <div className="mj-docwrap" aria-hidden="true">
            <div className={`mj-doc ${docCls}`} data-doc>
              <div className="mj-doc__tag">DOC · UA·DE·EN</div>
              <div className="mj-lines"><i /><i /><i /><i /><i /><i /></div>
              <span className="mj-badge b1">{TOKENS[0]}</span>
              <span className="mj-badge b2">{TOKENS[1]}</span>
              <span className="mj-badge b3">{TOKENS[2]}</span>
              <span className="mj-badge b4">{TOKENS[3]}</span>
              <span className="mj-badge b5">{TOKENS[4]}</span>
              <div className="mj-layer">… als Dreher tätig war</div>
              <div className="mj-proof">OK</div>
              <div className="mj-doc__overlay" />
            </div>
            <div className="mj-progress mono">{stage}/5 · {stage > 0 ? TOKENS[stage - 1] : '—'}</div>
          </div>
          <div className="mj-steps">
            <div className="method">
              <span ref={line} className="method-line" />
              {mth.steps.map((s, i) => (
                <div key={i} className="method-step">
                  <div className="mono method-n">{s.n}</div>
                  <div className="method-dot" />
                  <div className="method-body"><h3>{s.t}</h3><p>{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
