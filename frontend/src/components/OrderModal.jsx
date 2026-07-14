import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContent } from '../content';
import QuickOrderForm from './QuickOrderForm';

/*
 * Global compact order modal. Opened from every "Замовити переклад" CTA
 * via openOrderModal({ origin, direction, docType }).
 * Submits DIRECTLY to /api/orders — the lead lands in admin «Заявки» instantly.
 * A link to the full /order form (more fields) is kept for those who need it.
 */
export default function OrderModal() {
  const { t } = useTranslation();
  const c = useContent();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState({});

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const h = (e) => { setCtx(e.detail || {}); setOpen(true); };
    window.addEventListener('order-modal:open', h);
    return () => window.removeEventListener('order-modal:open', h);
  }, []);

  // close on route change
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  // esc + scroll lock while open
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    if (window.__lenis && window.__lenis.stop) window.__lenis.stop();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (window.__lenis && window.__lenis.start) window.__lenis.start();
    };
  }, [open, close]);

  return (<>
    <div className={`omodal-overlay${open ? ' open' : ''}`} onClick={close} data-testid="order-modal-overlay" />
    <div className={`omodal${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open} data-testid="order-modal">
      <button type="button" className="omodal__close" onClick={close} aria-label="закрити" data-testid="order-modal-close">✕</button>
      <div className="mono omodal__kicker">{t('quick.modalTitle')}</div>
      <h3 className="omodal__title">{c.nav.order}</h3>
      <p className="omodal__sub">{t('quick.modalSub')}</p>
      {open && (
        <QuickOrderForm
          testPrefix="modal"
          initialDirection={ctx.direction || 'ua-de'}
          initialDocType={ctx.docType || ''}
          origin={ctx.origin || 'Швидке замовлення'}
        />
      )}
      <Link to="/order" className="omodal__full mono" onClick={close} data-testid="order-modal-full">{t('quick.fullForm')} →</Link>
    </div>
  </>);
}
