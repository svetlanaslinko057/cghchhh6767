import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '../lib/settings';
import Calculator from './Calculator';
import QuickOrderForm from './QuickOrderForm';

function Faq({ items }) {
  const [open, setOpen] = useState(-1);
  if (!items?.length) return <p className="lw-empty">Напишіть мені — відповім якнайшвидше.</p>;
  return (
    <div className="lw-faq" data-testid="widget-faq">
      {items.map((f, i) => (
        <div key={i} className={`lw-faq__item${open === i ? ' is-open' : ''}`}>
          <button className="lw-faq__q" onClick={() => setOpen(open === i ? -1 : i)} data-testid={`widget-faq-q-${i}`}>
            <span>{f.q}</span><span className="lw-faq__ic">{open === i ? '−' : '+'}</span>
          </button>
          <div className="lw-faq__a">{f.a}</div>
        </div>
      ))}
    </div>
  );
}

export default function LeadWidget() {
  const loc = useLocation();
  const { t, i18n } = useTranslation();
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('faq');
  const [seen, setSeen] = useState(false);

  useEffect(() => { if (open) setSeen(true); }, [open]);
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  if (loc.pathname.startsWith('/admin')) return null;
  if (settings && settings.widget && settings.widget.enabled === false) return null;
  // Per-language FAQ with UA fallback
  const wlang = ['de', 'en'].includes(i18n.language) ? i18n.language : 'ua';
  const wpick = (f, k) => ((wlang === 'ua' ? f[k] : f[`${k}_${wlang}`] || f[k]) || '').trim();
  const faq = (settings?.widget?.faq || [])
    .map((f) => ({ q: wpick(f, 'q'), a: wpick(f, 'a') }))
    .filter((f) => f.q && f.a);

  return (
    <div className="lw" data-testid="lead-widget">
      {open && (
        <div className="lw-panel" data-testid="widget-panel">
          <div className="lw-head">
            <div className="lw-head__brand">
              <span className="lw-stamp-mini">OO</span>
              <div>
                <div className="lw-head__t">Чим допомогти?</div>
                <div className="mono lw-head__s">UA · DE · EN · ПЕРЕКЛАД ДОКУМЕНТІВ</div>
              </div>
            </div>
            <button className="lw-close" onClick={() => setOpen(false)} aria-label="закрити" data-testid="widget-close">✕</button>
          </div>
          <div className="lw-tabs mono">
            <button className={tab === 'faq' ? 'is-active' : ''} onClick={() => setTab('faq')} data-testid="widget-tab-faq">{t('quick.tabFaq')}</button>
            <button className={tab === 'calc' ? 'is-active' : ''} onClick={() => setTab('calc')} data-testid="widget-tab-calc">{t('quick.tabCalc')}</button>
            <button className={tab === 'ask' ? 'is-active' : ''} onClick={() => setTab('ask')} data-testid="widget-tab-ask">{t('quick.tabOrder')}</button>
          </div>
          <div className="lw-body">
            {tab === 'faq' && <Faq items={faq} />}
            {tab === 'calc' && <Calculator compact onOrdered={() => setOpen(false)} />}
            {/* «Заявка» = REAL order with files -> /api/orders -> admin «Заявки» (was: contact form) */}
            {tab === 'ask' && <QuickOrderForm testPrefix="widget-order" origin="Віджет" />}
          </div>
        </div>
      )}
      <button className={`lw-toggle${open ? ' is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="швидка допомога" aria-expanded={open} data-testid="widget-toggle">
        <span className="lw-toggle__oo">{open ? '✕' : 'OO'}</span>
        <span className="lw-toggle__ring" aria-hidden="true" />
        {!open && !seen && <span className="lw-toggle__pulse" aria-hidden="true" />}
      </button>
    </div>
  );
}
