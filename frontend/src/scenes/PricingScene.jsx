import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContent } from '../content';
import { Reveal, RevealHeading } from '../components/Reveal';
import Calculator, { fetchPricing } from '../components/Calculator';

const CUR = { EUR: '€', USD: '$', UAH: '₴' };

// Home pricing scene: editorial price ticker + live calculator.
export default function PricingScene() {
  const c = useContent();
  const { i18n } = useTranslation();
  const [p, setP] = useState(null);

  useEffect(() => { fetchPricing().then(setP); }, []);

  if (p && p.enabled === false) return null;
  const cur = p ? (CUR[p.currency] || p.currency) : '€';
  const from = i18n.language === 'de' ? 'ab' : i18n.language === 'en' ? 'from' : 'від';
  const ticker = (p?.doc_types || []).map((d) => `${d.name} — ${from} ${d.price} ${cur}`);

  return (
    <section id="pricing" className="scene pricing-scene" style={{ background: 'var(--paper)' }} data-testid="pricing-scene">
      {/* animated editorial price ticker */}
      {ticker.length > 0 && (
        <div className="price-marquee" aria-hidden="true">
          <div className="marquee">
            <div className="marquee__track">
              {[...ticker, ...ticker].map((t, i) => (
                <span key={i} className="pm-item mono">{t}<i className="pm-dot" /></span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="container" style={{ paddingTop: 'clamp(2.6rem,5vw,4rem)' }}>
        <Reveal><div className="mono eyebrow" style={{ marginBottom: '1.2rem' }}>{c.pricing.kicker}</div></Reveal>
        <RevealHeading as="h2" text={c.pricing.title} className="scene-title" style={{ maxWidth: 700 }} />
        <Reveal delay={0.08}><p style={{ color: 'var(--ink-soft)', maxWidth: 620, marginTop: '1.2rem', marginBottom: '2.4rem' }}>{c.pricing.lead}</p></Reveal>
        <Reveal delay={0.12}><Calculator /></Reveal>
      </div>
    </section>
  );
}
