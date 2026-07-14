import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from '../components/Reveal';
import CtaBand from '../components/CtaBand';

function PageHead({ kicker, title, intro }) {
  return (
    <section style={{ padding: 'clamp(9rem,14vw,12rem) 0 3rem' }}><div className="container">
      <Reveal><div className="eyebrow mono" style={{ marginBottom: '1.5rem' }}>{kicker}</div></Reveal>
      <RevealHeading as="h1" text={title} style={{ fontSize: 'clamp(2.4rem,6vw,5rem)' }} />
      {intro && <Reveal delay={0.1}><p style={{ color: 'var(--ink-soft)', maxWidth: 640, marginTop: '1.5rem', fontSize: '1.1rem' }}>{intro}</p></Reveal>}
    </div></section>
  );
}

export default function Services() {
  const { t } = useTranslation();
  const items = t('services.items', { returnObjects: true }) || [];
  return (
    <div>
      <PageHead kicker={t('services.kicker')} title={t('servicesPage.title')} intro={t('servicesPage.intro')} />
      <section style={{ padding: '3rem 0 clamp(3rem,6vw,5rem)' }}><div className="container">
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {items.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="svc-row" data-doc>
                <div className="mono" style={{ color: 'var(--accent-2)' }}>0{i + 1}</div>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', marginBottom: '.8rem' }}>{s[0]}</h2>
                  <p style={{ color: 'var(--ink-soft)', maxWidth: 600 }}>{s[1]}</p>
                </div>
                {/* document fragment — reveals on hover / always visible on touch */}
                <div className={`svc-frag sf${i % 3}`} aria-hidden="true">
                  <span className="mono svc-frag__tag">UA → DE</span>
                  <div className="svc-frag__lines"><i /><i /><i /></div>
                  <span className="hand svc-frag__hand">/ 0{i + 1}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div></section>
      <div style={{ paddingBottom: 'clamp(5rem,8vw,7rem)' }}>
        <CtaBand variant="services" />
      </div>
    </div>
  );
}
