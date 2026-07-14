import { useEffect, useRef } from 'react';
import { gsap } from '../motion/motionSystem';

const LABELS = { doc: 'READ', cta: 'SEND', lang: 'UA \u21c4 DE', edit: 'EDIT' };

export default function CustomCursor() {
  const dot = useRef(null); const ring = useRef(null); const label = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(max-width:900px)').matches || window.matchMedia('(pointer:coarse)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.35, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.35, ease: 'power3' });
    let mode = '';
    const move = (e) => {
      dot.current.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
      rx(e.clientX); ry(e.clientY);
    };
    const detect = (e) => {
      const t = e.target;
      let m = '';
      if (t.closest('[data-cta]')) m = 'cta';
      else if (t.closest('[data-edit]')) m = 'edit';
      else if (t.closest('[data-doc]')) m = 'doc';
      else if (t.closest('[data-lang]')) m = 'lang';
      else if (t.closest('a,button')) m = 'link';
      if (m === mode) return;
      ['pc-doc', 'pc-cta', 'pc-lang', 'pc-edit', 'pc-link'].forEach((c) => document.body.classList.remove(c));
      mode = m;
      if (m) document.body.classList.add('pc-' + m);
      if (label.current) label.current.textContent = LABELS[m] || '';
    };
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerover', detect);
    gsap.set(ring.current, { xPercent: -50, yPercent: -50 });
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('pointerover', detect); };
  }, []);
  return (<>
    <div ref={dot} className="pcursor" aria-hidden="true" />
    <div ref={ring} className="pring" aria-hidden="true"><span ref={label} className="plabel" /></div>
  </>);
}
