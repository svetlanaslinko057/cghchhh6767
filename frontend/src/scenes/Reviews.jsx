import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from '../components/Reveal';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

function Stars({ n }) {
  if (!n) return null;
  return (
    <span className="revx__stars mono" aria-label={`${n} з 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? 'is-on' : ''}>★</span>
      ))}
    </span>
  );
}

/*
 * Client reviews scene (Home). Only published reviews from admin.
 * Entire scene is hidden when there are none — no fake content.
 */
export default function Reviews() {
  const { t } = useTranslation();
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (alive) setItems(Array.isArray(d) ? d : []); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);

  if (!items || !items.length) return null;

  return (
    <section className="scene revx" data-testid="reviews-section">
      <div className="container">
        <Reveal><div className="mono eyebrow" style={{ marginBottom: '2rem' }}>{t('reviewsSec.kicker')}</div></Reveal>
        <RevealHeading as="h2" text={t('reviewsSec.title')} style={{ fontSize: 'clamp(1.9rem,4vw,3.2rem)', marginBottom: '3rem' }} />
        <div className="revx__grid">
          {items.map((r, i) => (
            <Reveal key={r.id || i} delay={(i % 3) * 0.08}>
              <article className="revx__card" style={{ '--rot': `${(i % 3 - 1) * 0.6}deg` }} data-testid="review-card">
                <div className="revx__pin" aria-hidden="true" />
                <Stars n={r.rating} />
                <p className="revx__text">{r.text}</p>
                <footer className="revx__foot">
                  <strong className="revx__name">{r.name}</strong>
                  {r.meta && <span className="mono revx__meta">{r.meta}</span>}
                </footer>
                <span className="mono revx__stamp" aria-hidden="true">OO · VERIFIED</span>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
