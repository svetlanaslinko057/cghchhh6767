import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from './Reveal';
import { useSiteSettings } from '../lib/settings';

/*
 * Site-wide FAQ: one source of truth — settings.widget.faq (admin-managed).
 * Editorial numbered accordion + FAQPage JSON-LD for SEO (only when items exist).
 */
export default function Faq({ compactHead = false }) {
  const { t, i18n } = useTranslation();
  const settings = useSiteSettings();
  const [open, setOpen] = useState(0);
  // Per-language Q&A with UA fallback: item.q/a = UA base, item.q_de/a_de, item.q_en/a_en
  const lang = ['de', 'en'].includes(i18n.language) ? i18n.language : 'ua';
  const pick = (f, k) => ((lang === 'ua' ? f[k] : f[`${k}_${lang}`] || f[k]) || '').trim();
  const items = (settings?.widget?.faq || [])
    .map((f) => ({ q: pick(f, 'q'), a: pick(f, 'a') }))
    .filter((f) => f.q && f.a);

  // FAQPage structured data for SEO
  useEffect(() => {
    if (!items.length) return;
    let el = document.getElementById('faq-jsonld');
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = 'faq-jsonld';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    return () => { document.getElementById('faq-jsonld')?.remove(); };
  }, [JSON.stringify(items)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items.length) return null;

  return (
    <section className="scene faqx" data-testid="faq-section">
      <div className="container">
        <Reveal><div className="mono eyebrow" style={{ marginBottom: compactHead ? '1.2rem' : '2rem' }}>{t('faqSec.kicker')}</div></Reveal>
        {!compactHead && <RevealHeading as="h2" text={t('faqSec.title')} style={{ fontSize: 'clamp(1.9rem,4vw,3.2rem)', marginBottom: '2.6rem' }} />}
        <div className="faqx__list">
          {items.map((f, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className={`faqx__item${open === i ? ' is-open' : ''}`}>
                <button className="faqx__q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} data-testid={`faq-q-${i}`} data-cursor>
                  <span className="mono faqx__no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="faqx__qt">{f.q}</span>
                  <span className="faqx__ic" aria-hidden="true">{open === i ? '−' : '+'}</span>
                </button>
                <div className="faqx__a" data-testid={`faq-a-${i}`}>
                  <p>{f.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
