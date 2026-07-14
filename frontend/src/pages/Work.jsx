import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from '../components/Reveal';
import Calculator from '../components/Calculator';
import { useSiteSettings, resolveMediaUrl } from '../lib/settings';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Work() {
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetch(`${API}/work`).then((r) => (r.ok ? r.json() : [])).then(setItems).catch(() => setItems([]));
  }, []);

  const fallback = settings?.site?.work_fallback_image || '';

  return (
    <div>
      <section style={{ padding: 'clamp(9rem,14vw,12rem) 0 3rem' }}><div className="container">
        <Reveal><div className="eyebrow mono" style={{ marginBottom: '1.5rem' }}>{t('nav.work')}</div></Reveal>
        <RevealHeading as="h1" text={t('workPage.title')} style={{ fontSize: 'clamp(2.4rem,6vw,5rem)' }} />
        <Reveal delay={0.1}><p style={{ color: 'var(--ink-soft)', maxWidth: 640, marginTop: '1.5rem', fontSize: '1.1rem' }}>{t('workPage.intro')}</p></Reveal>
      </div></section>

      <section style={{ padding: '2rem 0 clamp(4rem,7vw,6rem)' }}><div className="container">
        {items === null ? null : (
        <div className="work-grid" data-testid="work-grid">
          {items.map((d, i) => {
            const img = resolveMediaUrl(d.image_url) || fallback;
            return (
            <Reveal key={d.id} delay={(i % 4) * 0.06}>
              <div className={`work-item wv${i % 3}`} data-doc data-testid="work-card">
                <div className="work-stack">
                  <div className="ws ws1" />
                  <div className="ws ws2"><span className="ws-note hand">{d.direction || 'UA → DE'}</span></div>
                  <div className="ws ws3 ws3--photo">
                    {img && <div className="ws-img" style={{ backgroundImage: `url(${img})` }} />}
                    <div className="ws-imgfade" />
                    <span className="ws-tag mono">AKTE / {String(i + 1).padStart(2, '0')}</span>
                    <div className="ws-bottom">
                      <span className="work-term">{d.title}</span>
                      {d.note && <span className="ws-note-sub">{d.note}</span>}
                    </div>
                    {d.price_from > 0 && <span className="ws-price mono" data-testid="work-price">від {d.price_from} €</span>}
                  </div>
                </div>
                <div className="work-meta mono">
                  <span>{d.direction || 'UA ⇄ DE'}</span><span>/ {String(i + 1).padStart(2, '0')}</span>
                </div>
              </div>
            </Reveal>
          ); })}
        </div>
        )}
      </div></section>

      <section id="calculator" style={{ padding: '0 0 clamp(6rem,10vw,9rem)' }}><div className="container">
        <Reveal><div className="eyebrow mono" style={{ marginBottom: '1.5rem' }}>Вартість</div></Reveal>
        <RevealHeading as="h2" text="Скільки коштує переклад?" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', maxWidth: 700 }} />
        <Reveal delay={0.1}><p style={{ color: 'var(--ink-soft)', maxWidth: 620, marginTop: '1.2rem', marginBottom: '2.5rem' }}>Оберіть тип документа й отримайте орієнтовну вартість одразу — без очікування.</p></Reveal>
        <Reveal delay={0.15}><Calculator /></Reveal>
      </div></section>
    </div>
  );
}
