import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const decide = (v) => {
    localStorage.setItem('cookie_consent', v);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`@keyframes cookieIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div role="dialog" aria-label="Cookies" data-testid="cookie-banner" style={{
        position: 'fixed', left: 20, bottom: 20, zIndex: 9990, maxWidth: 330, width: 'calc(100vw - 40px)',
        background: 'var(--paper-light, #FCFAF5)', border: '1px solid var(--line)', borderRadius: 14,
        padding: '1.05rem 1.15rem', boxShadow: '0 14px 44px rgba(27,27,24,.16)', animation: 'cookieIn .5s ease both',
      }}>
        <div className="mono" style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '.5rem' }}>Cookies</div>
        <p style={{ fontSize: '.84rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: '0 0 .45rem' }}>{t('cookie.text')}</p>
        <Link to="/legal/cookies" data-testid="cookie-more" className="mono" style={{ fontSize: '.64rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{t('cookie.more')}</Link>
        <div style={{ display: 'flex', gap: '.55rem', marginTop: '.85rem' }}>
          <button data-testid="cookie-accept" onClick={() => decide('accepted')} style={{
            flex: 1, padding: '.58rem .9rem', borderRadius: 100, border: 'none', background: 'var(--ink)', color: 'var(--paper)',
            fontFamily: 'var(--font-mono)', fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{t('cookie.accept')}</button>
          <button data-testid="cookie-decline" onClick={() => decide('declined')} style={{
            flex: 1, padding: '.58rem .9rem', borderRadius: 100, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)',
            fontFamily: 'var(--font-mono)', fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{t('cookie.decline')}</button>
        </div>
      </div>
    </>
  );
}
