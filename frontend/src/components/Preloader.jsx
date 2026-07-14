import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Preloader() {
  const [done, setDone] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    const bar = document.querySelector('.preloader__bar i');
    if (bar) {
      bar.style.transition = 'transform 1.1s cubic-bezier(.7,0,.3,1)';
      requestAnimationFrame(() => { bar.style.transform = 'scaleX(1)'; });
    }
    const timer = setTimeout(() => setDone(true), 1250);
    return () => clearTimeout(timer);
  }, []);
  if (done) return null;
  return (
    <div className="preloader" style={{ transition: 'opacity .5s', opacity: done ? 0 : 1 }}>
      <div className="preloader__word">UA · DE · EN</div>
      <div className="preloader__bar"><i /></div>
    </div>
  );
}
