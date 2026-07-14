import { useEffect } from 'react';
import Lenis from 'lenis';
import { attachLenisToGsap, prefersReducedMotion } from './motionSystem';

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
    const detach = attachLenisToGsap(lenis);
    window.__lenis = lenis;
    return () => { detach(); lenis.destroy(); window.__lenis = null; };
  }, []);
  return children;
}
