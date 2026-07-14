import { useTranslation } from 'react-i18next';
import { Reveal } from './Reveal';
import { useSiteSettings } from '../lib/settings';

/*
 * Editorial trust stats strip (admin-configurable via settings.trust).
 * Hidden entirely when disabled or when no stat has a value.
 */
export default function TrustBand() {
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const trust = settings?.trust;
  if (!trust || trust.enabled === false) return null;

  const stats = [
    { key: 'years', val: trust.years, label: t('trustBand.years'), suffix: '+' },
    { key: 'docs', val: trust.docs_count, label: t('trustBand.docs'), suffix: '+' },
    { key: 'response', val: trust.response_hours, label: t('trustBand.response'), suffix: '' },
  ].filter((s) => String(s.val ?? '').trim() !== '' && Number(s.val) > 0);

  if (!stats.length) return null;

  return (
    <section className="tband" data-testid="trust-band">
      <div className="container">
        <Reveal>
          <div className="tband__inner">
            <span className="mono tband__kicker">{t('trustBand.kicker')}</span>
            <div className="tband__stats">
              {stats.map((s, i) => (
                <div key={s.key} className="tband__stat" data-testid={`trust-stat-${s.key}`}>
                  <strong className="tband__num">{s.val}{s.suffix}</strong>
                  <span className="mono tband__label">{s.label}</span>
                  {i < stats.length - 1 && <span className="tband__sep" aria-hidden="true" />}
                </div>
              ))}
            </div>
            <span className="tband__stamp mono" aria-hidden="true">OO</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
