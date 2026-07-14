import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContent } from '../content';
import { Monogram } from './Wordmark';
import { RevealHeading } from './Reveal';
import { useSiteSettings, channelLinks } from '../lib/settings';
import { openOrderModal } from '../lib/orderModal';

export default function Footer() {
  const c = useContent();
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const settings = useSiteSettings();
  const channels = channelLinks(settings?.contacts);
  const email = settings?.contacts?.email || c.contact.email;
  const phone = settings?.contacts?.phone || c.contact.phone;
  const hasContacts = email || phone;
  return (
    <footer id="contact" style={{ background: 'var(--ink)', color: 'var(--paper)', paddingTop: 'var(--space-scene,6rem)' }}>
      <div className="container">
        <div className="mono" style={{ color: 'var(--warm,#B9885A)', marginBottom: '1.5rem' }}>{c.contact.kicker}</div>
        <RevealHeading as="h2" text={c.contact.title} style={{ fontSize: 'clamp(2rem,4vw,3.6rem)', maxWidth: 900, color: 'var(--paper)' }} />
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => openOrderModal({ origin: 'CTA · Футер' })} style={{ background: 'var(--paper)', color: 'var(--ink)', border: 'none' }} data-testid="footer-order-cta"><span className="dot" />{c.contact.cta}</button>
        </div>
        {channels.length > 0 && (
          <div style={{ marginTop: '2.2rem' }} data-testid="footer-channels">
            <div className="mono" style={{ fontSize: '.58rem', letterSpacing: '.18em', opacity: .5, marginBottom: '.9rem' }}>ШВИДКИЙ ЗВ'ЯЗОК</div>
            <div className="chan-row">
              {channels.map((ch) => (
                <a key={ch.key} href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="chan-link" data-testid={`footer-channel-${ch.key}`}>
                  {ch.label} <span className="chan-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
        <div style={{ height: 1, background: 'rgba(245,241,232,.15)', margin: '3.5rem 0 2rem' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <Monogram size={30} stroke="var(--paper)" />
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem' }}>{c.brand.name}</div>
              <div className="mono" style={{ opacity: .5, fontSize: '.6rem', marginTop: 2 }}>{c.brand.line1} · {c.brand.line2}</div>
            </div>
          </div>
          {hasContacts ? (
            <div style={{ display: 'grid', gap: '.3rem' }}>
              {email && <a href={`mailto:${email}`} style={{ opacity: .85 }}>{email}</a>}
              {phone && <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ opacity: .85 }}>{phone}</a>}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 0', borderTop: '1px solid rgba(245,241,232,.15)', fontFamily: 'var(--font-mono)', fontSize: '.68rem', opacity: .55, letterSpacing: '.1em' }}>
          <span>© {year} · {c.brand.name} — {c.contact.rights}</span>
          <div style={{ display: 'flex', gap: '1.4rem', flexWrap: 'wrap' }}>
            <Link to="/legal/terms" data-testid="footer-terms" style={{ color: 'var(--paper)' }}>{t('legal.terms')}</Link>
            <Link to="/legal/privacy" data-testid="footer-privacy" style={{ color: 'var(--paper)' }}>{t('legal.privacy')}</Link>
            <Link to="/legal/cookies" data-testid="footer-cookies" style={{ color: 'var(--paper)' }}>{t('legal.cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
