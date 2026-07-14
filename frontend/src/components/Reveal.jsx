import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Generic reveal (fade + rise) tied to scroll
export function Reveal({ children, className = '', y = 40, delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { opacity: 0, y }, {
        opacity: 1, y: 0, duration: 1, delay, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
    return () => ctx.revert();
  }, [y, delay]);
  return <Tag ref={ref} className={className} data-reveal>{children}</Tag>;
}

// Word-by-word heading reveal (with slight blur)
export function RevealHeading({ text, className = '', as: Tag = 'h2', style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = el.querySelectorAll('.word > span');
    const ctx = gsap.context(() => {
      gsap.fromTo(spans, { yPercent: 115, filter: 'blur(6px)', opacity: 0 }, {
        yPercent: 0, filter: 'blur(0px)', opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.06,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
    return () => ctx.revert();
  }, [text]);
  const words = String(text).split(' ');
  return (
    <Tag ref={ref} className={className} data-reveal style={{ opacity: 1, ...style }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="word" aria-hidden="true"><span>{w}{i < words.length - 1 ? '\u00A0' : ''}</span></span>
      ))}
    </Tag>
  );
}

export { gsap, ScrollTrigger };
