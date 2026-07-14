import { useRef, useEffect, useState, useCallback } from 'react';
import { useContent } from '../content';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../motion/motionSystem';

function OriginalText({ tokens, legend }) {
  return (
    <p className="ms-hand" data-edit>
      {tokens.map((tk, i) => {
        if (!tk.k) return <span key={i}>{tk.t}</span>;
        if (tk.k === 'strike') return <span key={i} className="ms-strike-anim">{tk.t}</span>;
        if (tk.k === 'fix') return <sup key={i} className="ms-fix ms-fix-anim">{tk.t}</sup>;
        const title = legend[tk.k] || tk.k;
        return <span key={i} className={`ms-mark ms-${tk.k}`} title={title}>{tk.t}</span>;
      })}
    </p>
  );
}

/* Wraps the corrected word so the connector can attach to the real DOM node */
function Transcription({ text }) {
  const word = 'токаря';
  const idx = text.indexOf(word);
  if (idx === -1) return <p className="ms-clean">{text}</p>;
  return (
    <p className="ms-clean">
      {text.slice(0, idx)}<span className="tr-hl">{word}</span>{text.slice(idx + word.length)}
    </p>
  );
}

function Translation({ text }) {
  const idx = text.indexOf('Dreher');
  if (idx === -1) return <p className="ms-de">{text}</p>;
  return (
    <p className="ms-de">
      {text.slice(0, idx)}<strong className="de-hl">Dreher</strong>{text.slice(idx + 6)}
    </p>
  );
}

const curveH = (s, e) =>
  `M${s.x} ${s.y} C ${s.x + (e.x - s.x) * 0.35} ${s.y - 36}, ${e.x - (e.x - s.x) * 0.18} ${e.y - 26}, ${e.x} ${e.y}`;
const curveV = (s, e) =>
  `M${s.x} ${s.y} C ${s.x + 24} ${s.y + (e.y - s.y) * 0.45}, ${e.x - 40} ${e.y - (e.y - s.y) * 0.35}, ${e.x} ${e.y}`;

export default function ManuscriptProof() {
  const c = useContent();
  const m = c.manuscript;
  const wrap = useRef(null);
  const wrapInner = useRef(null); // .msx-wrap — coordinate space for connectors
  const [stage, setStage] = useState(() => (prefersReducedMotion() ? 2 : 0));
  const [active, setActive] = useState(false);
  const [links, setLinks] = useState(null);

  // Notify header console about the current physical state of the scene
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ms:stage', { detail: active ? stage : -1 }));
  }, [stage, active]);
  useEffect(() => () => window.dispatchEvent(new CustomEvent('ms:stage', { detail: -1 })), []);

  useEffect(() => {
    if (prefersReducedMotion()) { setStage(2); return undefined; }
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const st = ScrollTrigger.create({
        trigger: wrap.current, start: 'top top', end: '+=240%', pin: true, scrub: 1, anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setStage(p < 0.32 ? 0 : p < 0.66 ? 1 : 2);
        },
        onToggle: (self) => setActive(self.isActive),
      });
      return () => st.kill();
    });
    mm.add('(max-width: 900px)', () => { setStage(2); setActive(false); });
    return () => mm.revert();
  }, [c]);

  /* Measure real word/note positions -> anchored connectors & magnifier.
     Sheets animate 0.8s, so we re-measure a few times after each stage change. */
  const measure = useCallback(() => {
    const w = wrapInner.current;
    if (!w || window.innerWidth <= 900) { setLinks(null); return; }
    const wr = w.getBoundingClientRect();
    const q = (sel) => w.querySelector(sel);
    const out = {};

    const ill = q('.msx-original .ms-hand .ms-illegible');
    if (ill) {
      const r = ill.getBoundingClientRect();
      out.mag = { left: r.left - wr.left + r.width / 2, top: r.top - wr.top };
    }
    const fix = q('.msx-original .ms-fix');
    const note2 = q('.msx-ol li:nth-child(2)');
    if (fix && note2) {
      const a = fix.getBoundingClientRect(); const b = note2.getBoundingClientRect();
      const s = { x: a.right - wr.left + 5, y: a.top - wr.top + a.height / 2 };
      const e = { x: b.left - wr.left - 12, y: b.top - wr.top + 12 };
      out.l1 = { s, e, d: curveH(s, e) };
    }
    const trW = q('.msx-tracing .tr-hl');
    const deW = q('.msx-translation .de-hl');
    if (trW && deW) {
      const a = trW.getBoundingClientRect(); const b = deW.getBoundingClientRect();
      const s = { x: a.left - wr.left + a.width / 2, y: a.bottom - wr.top + 3 };
      const e = { x: b.left - wr.left + b.width / 2, y: b.top - wr.top - 5 };
      out.l2 = { s, e, d: curveV(s, e) };
    }
    setLinks(out);
  }, []);

  useEffect(() => {
    measure();
    const t1 = setTimeout(measure, 450);
    const t2 = setTimeout(measure, 950);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', measure); };
  }, [stage, c, measure]);

  const stepLabels = [m.labels.original, m.labels.transcription, m.labels.translation];
  const noteOn = (i) => (stage === 1 && i === 1) || (stage === 2 && (i === 3 || i === 4));

  return (
    <section ref={wrap} className="scene ms msx" data-stage={stage}>
      <div className="container">
        <div className="mono eyebrow" style={{ marginBottom: '1rem' }}>{m.kicker}</div>
        <h2 className="scene-title" style={{ maxWidth: 760 }}>{m.title}</h2>
        <div className="mono ms-samplelabel" style={{ margin: '.8rem 0 0' }}>{m.sampleLabel}</div>
        <div className="msx-steps" aria-hidden="true">
          {stepLabels.map((l, i) => <span key={i} className={`msx-step${stage === i ? ' on' : ''}`}>{l}</span>)}
        </div>

        <div ref={wrapInner} className="msx-wrap">
          <div className="msx-stage" data-doc>
            {/* STATE 1 — the original manuscript, one large physical sheet */}
            <div className="msx-sheet msx-original">
              <div className="mono ms-lbl">{m.labels.original}</div>
              <OriginalText tokens={m.sample.original} legend={m.legend} />
              <div className="ms-legend mono">
                <span><i className="ms-mark ms-abbr">Aa</i> {m.legend.abbr}</span>
                <span><i className="ms-mark ms-illegible">[…]</i> {m.legend.illegible}</span>
                <span><i className="ms-strike">abc</i> {m.legend.strike}</span>
              </div>
            </div>

            {/* magnifier — anchored to the real […] token */}
            <div
              className="msx-mag"
              aria-hidden="true"
              style={links?.mag ? { left: links.mag.left, top: links.mag.top - 12 } : undefined}
            >
              <span className="hand">[…]</span>
              <span className="mono">{m.legend.illegible}</span>
            </div>

            {/* STATE 2 — translucent transcription tracing layer rises above */}
            <div className="msx-sheet msx-tracing">
              <div className="mono ms-lbl">{m.labels.transcription}</div>
              <Transcription text={m.sample.transcription} />
            </div>

            {/* STATE 3 — clean German sheet slides out in front */}
            <div className="msx-sheet msx-translation">
              <div className="mono ms-lbl">{m.labels.translation}</div>
              <Translation text={m.sample.translation} />
              <div className="mono ms-review">{m.reviewNote}</div>
              {m.enNote && <div className="mono ms-en" data-testid="ms-en-note">{m.enNote}</div>}
            </div>
          </div>

          <div className="msx-side">
            <div className="msx-notescard">
              <div className="mono ms-notes__t">{m.notesTitle}</div>
              <ol className="msx-ol">
                {m.notes.map((n, i) => <li key={i} className={noteOn(i) ? 'on' : ''}>{n}</li>)}
              </ol>
            </div>
          </div>

          {/* SVG connectors — computed from real word positions, dot-to-dot */}
          <svg className="msx-links" aria-hidden="true">
            {links?.l1 && (
              <g className="lkg lkg1">
                <path d={links.l1.d} />
                <circle cx={links.l1.s.x} cy={links.l1.s.y} r="3" />
                <circle cx={links.l1.e.x} cy={links.l1.e.y} r="3" />
              </g>
            )}
            {links?.l2 && (
              <g className="lkg lkg2">
                <path d={links.l2.d} />
                <circle cx={links.l2.s.x} cy={links.l2.s.y} r="3" />
                <circle cx={links.l2.e.x} cy={links.l2.e.y} r="3" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </section>
  );
}
