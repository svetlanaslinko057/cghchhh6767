import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from '../components/Reveal';
import CtaBand from '../components/CtaBand';
import { useSiteSettings, resolveMediaUrl } from '../lib/settings';

// Neutral editorial fallback (fountain pen on manuscript) — admin can override in settings
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200';

export default function About() {
  const { t } = useTranslation();
  const s = useSiteSettings();
  const img = resolveMediaUrl(s?.site?.about_image) || FALLBACK_IMG;
  return (
    <div>
      <section style={{ padding:'clamp(9rem,14vw,12rem) 0 3rem' }}><div className="container">
        <Reveal><div className="eyebrow mono" style={{ marginBottom:'1.5rem' }}>{t('about.kicker')}</div></Reveal>
        <RevealHeading as="h1" text={t('aboutPage.title')} style={{ fontSize:'clamp(2.4rem,6vw,5rem)' }} />
      </div></section>
      <section style={{ padding:'2rem 0 clamp(3rem,6vw,5rem)' }}><div className="container">
        <div className="about-grid">
          <Reveal>
            <figure className="about-figure" data-doc data-testid="about-figure">
              <img className="about-figure__img" src={img} alt={t('aboutPage.title')} loading="lazy" />
              <figcaption className="about-figure__cap">
                <span className="mono">Document translation</span>
                <span className="mono">UA · DE · EN</span>
              </figcaption>
            </figure>
          </Reveal>
          <div>
            <Reveal><p style={{ fontSize:'clamp(1.2rem,2vw,1.6rem)', marginBottom:'1.5rem', lineHeight:1.5 }}>{t('aboutPage.intro')}</p></Reveal>
            <Reveal delay={0.1}><p style={{ color:'var(--ink-soft)', marginBottom:'1rem' }}>{t('about.p1')}</p></Reveal>
            <Reveal delay={0.15}><p style={{ color:'var(--ink-soft)' }}>{t('about.p2')}</p></Reveal>
          </div>
        </div>
      </div></section>
      <div style={{ paddingBottom:'clamp(5rem,8vw,7rem)' }}>
        <CtaBand variant="about" />
      </div>
    </div>
  );
}
