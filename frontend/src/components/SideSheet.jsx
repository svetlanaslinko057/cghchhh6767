import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useContent } from '../content';
import QuickOrderForm from './QuickOrderForm';

/*
 * Quick request side sheet: a COMPLETE mini order form.
 * Submitting (with any number of files) creates the order immediately —
 * it lands in admin «Заявки», no redirect to other pages.
 */
export default function SideSheet({ open, onClose }) {
  const c = useContent();
  const { t } = useTranslation();
  return (<>
    <div className={`sheet-overlay${open ? ' open' : ''}`} onClick={onClose} />
    <aside className={`side-sheet${open ? ' open' : ''}`} aria-hidden={!open} data-testid="side-sheet">
      <button onClick={onClose} className="mono" style={{ float: 'right', color: 'var(--ink-soft)' }} data-testid="sheet-close">✕</button>
      <div className="mono" style={{ color: 'var(--accent)', marginBottom: '.6rem' }}>{c.contact.kicker}</div>
      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', marginBottom: '1.3rem' }}>{c.nav.order}</h3>
      {open && <QuickOrderForm testPrefix="sheet" origin="Швидка заявка" />}
      <Link to="/order" onClick={onClose} className="mono sheet-fulllink" data-testid="sheet-full-form">{t('quick.fullForm')} →</Link>
    </aside>
  </>);
}
