import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from '../components/Reveal';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const SLUGS = ['terms', 'privacy', 'cookies'];

function inline(text, keyBase) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 === 1 ? <strong key={`${keyBase}-b${i}`} style={{ color: 'var(--ink)' }}>{p}</strong> : p));
}

export function renderLegalContent(content) {
  const lines = (content || '').split('\n');
  const blocks = [];
  let para = [];
  let list = [];
  const flushPara = () => {
    if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = []; }
  };
  const flushList = () => {
    if (list.length) { blocks.push({ type: 'ul', items: list }); list = []; }
  };
  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (line.startsWith('### ')) { flushPara(); flushList(); blocks.push({ type: 'h3', text: line.slice(4) }); }
    else if (line.startsWith('## ')) { flushPara(); flushList(); blocks.push({ type: 'h2', text: line.slice(3) }); }
    else if (line.startsWith('- ')) { flushPara(); list.push(line.slice(2)); }
    else if (line.trim() === '') { flushPara(); flushList(); }
    else { flushList(); para.push(line.trim()); }
  });
  flushPara(); flushList();

  return blocks.map((b, i) => {
    if (b.type === 'h2') return <h2 key={i} style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.25rem,2.2vw,1.6rem)', marginTop: i === 0 ? 0 : '2.6rem', marginBottom: '.9rem', letterSpacing: '-.01em' }}>{inline(b.text, i)}</h2>;
    if (b.type === 'h3') return <h3 key={i} style={{ fontFamily: 'var(--font-head)', fontSize: '1.12rem', marginTop: '1.8rem', marginBottom: '.6rem' }}>{inline(b.text, i)}</h3>;
    if (b.type === 'ul') return (
      <ul key={i} style={{ margin: '0 0 1.1rem', paddingLeft: '1.15rem', display: 'grid', gap: '.45rem' }}>
        {b.items.map((it, j) => <li key={j} style={{ color: 'var(--ink-soft)', lineHeight: 1.75 }}>{inline(it, `${i}-${j}`)}</li>)}
      </ul>
    );
    return <p key={i} style={{ color: 'var(--ink-soft)', lineHeight: 1.8, margin: '0 0 1.1rem' }}>{inline(b.text, i)}</p>;
  });
}

export default function Legal() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [doc, setDoc] = useState(null);
  const [state, setState] = useState('loading');
  const raw = (i18n.language || 'ua');
  const lang = raw.startsWith('de') ? 'de' : raw.startsWith('en') ? 'en' : 'ua';

  useEffect(() => {
    if (!SLUGS.includes(slug)) { setState('notfound'); return; }
    setState('loading');
    fetch(`${API}/legal/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setDoc(d); setState('ready'); })
      .catch(() => setState('error'));
  }, [slug]);

  const title = doc ? (doc[`title_${lang}`] || doc.title_ua) : '';
  const content = doc ? (doc[`content_${lang}`] || doc.content_ua) : '';
  const updated = doc?.updated_at ? new Date(doc.updated_at).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'uk-UA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div data-testid="legal-page">
      <section style={{ padding: 'clamp(9rem,14vw,12rem) 0 2.5rem' }}><div className="container">
        <Reveal><div className="eyebrow mono" style={{ marginBottom: '1.5rem' }}>{t(`legal.${slug}`, '')}</div></Reveal>
        {state === 'ready' && <RevealHeading as="h1" text={title} style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', maxWidth: 900 }} />}
        {state === 'ready' && updated && (
          <Reveal delay={0.1}><div className="mono" data-testid="legal-updated" style={{ color: 'var(--ink-soft)', opacity: .7, marginTop: '1.2rem', fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>{t('legal.updated')}: {updated}</div></Reveal>
        )}
      </div></section>
      <section style={{ padding: '0 0 clamp(6rem,10vw,9rem)' }}><div className="container" style={{ maxWidth: 820 }}>
        {state === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>…</p>}
        {(state === 'error' || state === 'notfound') && (
          <div>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>404</p>
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}><span className="dot" />{t('legal.back')}</Link>
          </div>
        )}
        {state === 'ready' && <div data-testid="legal-content">{renderLegalContent(content)}</div>}
        {state === 'ready' && (
          <div style={{ marginTop: '3.5rem', paddingTop: '1.6rem', borderTop: '1px solid var(--line)', display: 'flex', gap: '1.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', opacity: .7 }}>{t('legal.other')}:</span>
            {SLUGS.filter(s => s !== slug).map(s => (
              <Link key={s} to={`/legal/${s}`} data-testid={`legal-link-${s}`} className="mono" style={{ fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{t(`legal.${s}`)}</Link>
            ))}
          </div>
        )}
      </div></section>
    </div>
  );
}
