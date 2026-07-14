import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContent } from '../content';
import { Monogram } from './Wordmark';
import { openOrderModal } from '../lib/orderModal';

const LANGS = [
  { code: 'ua', label: 'UA', name: 'Українська' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'en', label: 'EN', name: 'English' },
];

// Editorial dropdown language switcher (keyboard accessible)
export function LangDropdown({ compact = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(-1);
  const ref = useRef(null);
  const cur = LANGS.find((l) => l.code === i18n.language) || LANGS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) { setOpen(true); setHl(LANGS.findIndex(l => l.code === cur.code)); }
      else if (hl >= 0) pick(LANGS[hl].code);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) { setOpen(true); setHl(0); } else setHl((h) => (h + 1) % LANGS.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (open) setHl((h) => (h - 1 + LANGS.length) % LANGS.length); }
  };

  return (
    <div ref={ref} className={`langdd${open ? ' is-open' : ''}${compact ? ' langdd--compact' : ''}`} data-testid="lang-dropdown">
      <button type="button" className="langdd__btn" onClick={() => setOpen(o => !o)} onKeyDown={onKey}
        aria-haspopup="listbox" aria-expanded={open} aria-label="Language" data-testid="lang-dropdown-btn">
        <span className="langdd__cur">{cur.label}</span>
        <svg className="langdd__chev" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="langdd__menu" role="listbox" aria-label="Language">
          {LANGS.map((l, i) => (
            <li key={l.code} role="option" aria-selected={l.code === cur.code}>
              <button type="button" data-testid={`lang-opt-${l.code}`}
                className={`langdd__opt${l.code === cur.code ? ' is-active' : ''}${i === hl ? ' is-hl' : ''}`}
                onMouseEnter={() => setHl(i)} onClick={() => pick(l.code)}>
                <span className="langdd__code">{l.label}</span>
                <span className="langdd__name">{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Header() {
  const c = useContent();
  const { i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [msStage, setMsStage] = useState(-1);
  const loc = useLocation(); const nav = useNavigate();
  const menuRef = useRef(null);

  // Manuscript scene broadcasts its physical state; console shows the label
  useEffect(() => {
    const h = (e) => setMsStage(typeof e.detail === 'number' ? e.detail : -1);
    window.addEventListener('ms:stage', h);
    return () => window.removeEventListener('ms:stage', h);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll); onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const el = menuRef.current; const f = el?.querySelectorAll('a,button'); f?.[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab' || !f?.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const setLang = (l) => { i18n.changeLanguage(l); localStorage.setItem('lang', l); };
  const segs = [['/about', 'about'], ['/services', 'services'], ['/work', 'work'], ['/contact', 'contact']];

  return (
    <header className={`hd${scrolled ? ' is-compact' : ''}`} style={{ paddingTop: scrolled ? 0 : 12 }}>
      <div className="container">
        <div className="hd__inner" style={{ height: scrolled ? 58 : 78 }}>
          <Link to="/" aria-label={c.brand.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem' }}>
            <Monogram size={26} />
            <span style={{ lineHeight: 1 }}>
              <span className="hd-brand" style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '1.02rem', letterSpacing: '-0.01em', display: 'block' }}>{c.brand.name}</span>
              {!scrolled && <span className="hd-brand-sub" style={{ fontFamily: 'var(--font-mono)', fontSize: '.52rem', letterSpacing: '.22em', color: 'var(--ink-soft)', display: 'block', marginTop: 2 }}>{c.brand.line1} · {c.brand.line2}</span>}
            </span>
          </Link>

          <nav className="nav-console" aria-label="primary">
            {segs.map(([to, k], i) => (
              <Link key={to} to={to} className={`nav-seg${loc.pathname === to ? ' is-active' : ''}`}>
                <span className="seg-n">0{i + 1}</span>{c.nav[k]}
              </Link>
            ))}
            {msStage >= 0 && (
              <span className="nav-seg nav-seg--ms" aria-hidden="true">
                {['01 · Original', '02 · Transcription', '03 · Translation'][msStage]}
              </span>
            )}
          </nav>

          <div className="hd-actions">
            <span className="lang-switch">
              <LangDropdown />
            </span>
            <button data-cta className="btn btn-primary hd-cta" onClick={() => openOrderModal({ origin: 'CTA · Шапка' })} style={{ padding: '.6rem 1.1rem' }} data-testid="header-order-cta">{c.nav.order}</button>
            <button className="burger" onClick={() => setOpen(o => !o)} style={{ display: 'none', flexDirection: 'column', gap: 5 }} aria-label="menu" aria-expanded={open}>
              <span style={{ width: 24, height: 2, background: 'var(--ink)' }} /><span style={{ width: 24, height: 2, background: 'var(--ink)' }} />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div ref={menuRef} role="dialog" aria-modal="true" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', padding: '1rem clamp(20px,5vw,64px) 2rem' }}>
          {segs.map(([to, k]) => (<Link key={to} to={to} style={{ display: 'block', padding: '.85rem 0', fontFamily: 'var(--font-head)', fontSize: '1.6rem', borderBottom: '1px solid var(--line)' }}>{c.nav[k]}</Link>))}
          <div style={{ display: 'flex', gap: '.7rem', margin: '1.2rem 0', fontFamily: 'var(--font-mono)' }}>
            {['ua', 'de', 'en'].map((l) => (
              <button key={l} onClick={() => setLang(l)} data-testid={`menu-lang-${l}`}
                style={{ padding: '.5rem 1rem', borderRadius: 100, border: '1px solid var(--line)', fontSize: '.72rem', letterSpacing: '.08em',
                  background: i18n.language === l ? 'var(--ink)' : 'transparent', color: i18n.language === l ? 'var(--paper)' : 'var(--ink)' }}
                aria-pressed={i18n.language === l}>{l.toUpperCase()}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => { setOpen(false); openOrderModal({ origin: 'CTA · Меню' }); }} style={{ width: '100%', justifyContent: 'center' }} data-testid="menu-order-cta">{c.nav.order}</button>
        </div>
      )}
    </header>
  );
}
