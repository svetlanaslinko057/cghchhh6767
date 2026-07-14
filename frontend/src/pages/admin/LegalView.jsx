import { useState, useEffect, useCallback } from 'react';
import { adminApi } from './adminApi';
import { renderLegalContent } from '../Legal';

const SLUGS = [
  { key: 'terms', label: 'Умови користування' },
  { key: 'privacy', label: 'Політика конфіденційності' },
  { key: 'cookies', label: 'Політика cookies' },
];

export default function LegalView() {
  const [docs, setDocs] = useState({});
  const [slug, setSlug] = useState('terms');
  const [lang, setLang] = useState('ua');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [showPreview, setShowPreview] = useState(false);

  const load = useCallback(() => {
    adminApi.legal().then((list) => {
      const map = {};
      (list || []).forEach((d) => { map[d.slug] = d; });
      setDocs(map);
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const cur = docs[slug] || {};
  const titleField = `title_${lang}`;
  const contentField = `content_${lang}`;

  const upd = (field, value) => {
    setSaveState('idle');
    setDocs((prev) => ({ ...prev, [slug]: { ...prev[slug], [field]: value } }));
  };

  const save = async () => {
    setSaveState('saving');
    try {
      const updated = await adminApi.saveLegal(slug, {
        title_ua: cur.title_ua || '', title_de: cur.title_de || '', title_en: cur.title_en || '',
        content_ua: cur.content_ua || '', content_de: cur.content_de || '', content_en: cur.content_en || '',
      });
      setDocs((prev) => ({ ...prev, [slug]: updated }));
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2500);
    } catch { setSaveState('error'); }
  };

  return (
    <div data-testid="admin-legal-view">
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        {SLUGS.map((s) => (
          <button key={s.key} data-testid={`legal-doc-${s.key}`} onClick={() => { setSlug(s.key); setSaveState('idle'); }} className="mono"
            style={{ padding: '.55rem 1.1rem', borderRadius: 100, border: '1px solid var(--line)', cursor: 'pointer', fontSize: '.72rem', background: slug === s.key ? 'var(--ink)' : 'transparent', color: slug === s.key ? 'var(--paper)' : 'var(--ink)' }}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {['ua', 'de', 'en'].map((l) => (
          <button key={l} data-testid={`legal-lang-${l}`} onClick={() => { setLang(l); setSaveState('idle'); }} className="mono"
            style={{ padding: '.42rem .9rem', borderRadius: 100, border: '1px solid var(--line)', cursor: 'pointer', fontSize: '.7rem', background: lang === l ? 'var(--ink)' : 'transparent', color: lang === l ? 'var(--paper)' : 'var(--ink)' }}>
            {l.toUpperCase()}
          </button>
        ))}
        <button data-testid="legal-preview-toggle" onClick={() => setShowPreview(p => !p)} className="mono"
          style={{ padding: '.42rem .9rem', borderRadius: 100, border: '1px dashed var(--line)', cursor: 'pointer', fontSize: '.7rem', background: showPreview ? 'var(--card, #FCFAF5)' : 'transparent', color: 'var(--ink)' }}>
          {showPreview ? '✎ Редагування' : '👁 Перегляд'}
        </button>
        <a href={`/legal/${slug}`} target="_blank" rel="noreferrer" className="mono" data-testid="legal-open-site"
          style={{ marginLeft: 'auto', fontSize: '.68rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Відкрити на сайті ↗
        </a>
      </div>

      {showPreview ? (
        <div data-testid="legal-preview" style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--card, #FCFAF5)', padding: '2rem clamp(1.2rem,3vw,2.5rem)', maxWidth: 860 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.7rem', marginBottom: '1.5rem' }}>{cur[titleField] || ''}</h2>
          {renderLegalContent(cur[contentField] || '')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.2rem', maxWidth: 980 }}>
          <div className="adm-field">
            <label className="adm-label mono">Заголовок · {lang.toUpperCase()}</label>
            <input className="adm-input" data-testid="legal-title-input" value={cur[titleField] || ''} onChange={(e) => upd(titleField, e.target.value)} />
          </div>
          <div className="adm-field">
            <label className="adm-label mono">Текст документа · {lang.toUpperCase()}</label>
            <textarea className="adm-input" data-testid="legal-content-input" rows={24} spellCheck={false}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', lineHeight: 1.65, resize: 'vertical', minHeight: 420 }}
              value={cur[contentField] || ''} onChange={(e) => upd(contentField, e.target.value)} />
            <div className="mono" style={{ marginTop: '.5rem', fontSize: '.62rem', letterSpacing: '.06em', color: 'var(--ink-soft)', opacity: .75 }}>
              Форматування: ## заголовок розділу · - пункт списку · **жирний текст**
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.4rem', maxWidth: 980 }}>
        <button className="btn btn-primary" data-testid="legal-save" onClick={save} disabled={saveState === 'saving'} style={{ padding: '.9rem 1.8rem' }}>
          <span className="dot" />{saveState === 'saving' ? 'Збереження…' : 'Зберегти'}
        </button>
        {saveState === 'saved' && <span data-testid="legal-saved-msg" className="mono" style={{ color: 'var(--accent)', fontSize: '.72rem', letterSpacing: '.08em' }}>✓ Збережено</span>}
        {saveState === 'error' && <span data-testid="legal-error-msg" style={{ color: '#b1503f', fontSize: '.85rem' }}>Помилка збереження. Спробуйте ще раз.</span>}
        {cur.updated_at && <span className="mono" style={{ marginLeft: 'auto', fontSize: '.62rem', color: 'var(--ink-soft)', opacity: .7 }}>Оновлено: {new Date(cur.updated_at).toLocaleString()}</span>}
      </div>
    </div>
  );
}
