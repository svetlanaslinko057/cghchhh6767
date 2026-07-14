import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Select from './Select';
import store from '../lib/store';
import { DIRECTIONS, DIR_SHORT, pairMult } from '../lib/directions';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

let _pricingCache = null;
export async function fetchPricing() {
  if (_pricingCache) return _pricingCache;
  try {
    const r = await fetch(`${API}/pricing`);
    if (r.ok) { _pricingCache = await r.json(); return _pricingCache; }
  } catch {}
  return null;
}

// Full price breakdown: pair multiplier -> urgency -> % discounts -> certified fee.
export function calcPrice(p, typeIdx, pages, direction, opts = {}) {
  const t = p?.doc_types?.[typeIdx];
  if (!t) return { total: 0, discount: 0, volumePct: 0, prepayPct: 0, pct: 0, mult: 1, base: 0 };
  const mult = pairMult(p, direction);
  let base = (Number(t.price) + Math.max(0, pages - 1) * Number(p.extra_page_price || 0)) * mult;
  if (opts.urgent) base *= 1 + Number(p.urgent_pct || 0) / 100;
  const d = p.discounts || {};
  let volumePct = 0;
  if (d.volume_enabled) {
    (d.volume_tiers || []).forEach((tier) => {
      if (pages >= Number(tier.min_pages)) volumePct = Math.max(volumePct, Number(tier.pct) || 0);
    });
  }
  const prepayPct = opts.prepay && d.prepay_enabled ? Number(d.prepay_pct) || 0 : 0;
  const pct = Math.min(90, volumePct + prepayPct);
  const discount = (base * pct) / 100;
  const total = base - discount + (opts.certified ? Number(p.certified_fee || 0) : 0);
  return { total: Math.round(total), discount: Math.round(discount), volumePct, prepayPct, pct, mult, base: Math.round(base) };
}

// Closest volume tier above current page count (for the conversion nudge).
export function nextVolumeTier(p, pages) {
  const d = p?.discounts;
  if (!d?.volume_enabled) return null;
  const tiers = (d.volume_tiers || [])
    .map((t) => ({ min_pages: Number(t.min_pages), pct: Number(t.pct) }))
    .filter((t) => t.min_pages > pages && t.pct > 0)
    .sort((a, b) => a.min_pages - b.min_pages);
  return tiers[0] || null;
}

const CUR = { EUR: '€', USD: '$', UAH: '₴' };

export default function Calculator({ compact = false, onOrdered }) {
  const nav = useNavigate();
  const { t: tr, i18n } = useTranslation();
  const [p, setP] = useState(null);
  const [typeIdx, setTypeIdx] = useState(0);
  const [pages, setPages] = useState(1);
  const [direction, setDirection] = useState('ua-de');
  const [urgent, setUrgent] = useState(false);
  const [certified, setCertified] = useState(false);
  const [prepay, setPrepay] = useState(false);
  // Fast-lead inline step: after calculating, the visitor leaves name + phone/email
  // right here — the request goes STRAIGHT to admin «Заявки» (no navigation).
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', contact: '' });
  const [leadState, setLeadState] = useState('idle');
  const [leadCode, setLeadCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchPricing().then(setP); }, []);

  if (!p || p.enabled === false) return null;

  const r = calcPrice(p, typeIdx, pages, direction, { urgent, certified, prepay });
  const cur = CUR[p.currency] || p.currency;
  const doc = p.doc_types[typeIdx] || {};
  // Admin-managed doc-type names + note are per-language (UA base, DE/EN optional with UA fallback)
  const lang = ['de', 'en'].includes(i18n.language) ? i18n.language : 'ua';
  const docName = (dt) => ((lang === 'ua' ? dt.name : dt[`name_${lang}`] || dt.name) || '');
  const noteText = lang === 'ua' ? p.note : p[`note_${lang}`] || p.note;
  const d = p.discounts || {};
  const mult = pairMult(p, direction);
  const tier = nextVolumeTier(p, pages);
  // Potential prepay saving in currency — shown on the highlighted option to motivate prepayment
  const prepaySave = d.prepay_enabled ? Math.round((r.base * (Number(d.prepay_pct) || 0)) / 100) : 0;

  const promoChips = [];
  if (d.volume_enabled) (d.volume_tiers || []).forEach((ti) => {
    if (Number(ti.pct) > 0) promoChips.push(tr('calc.promoVolume', { n: ti.min_pages, pct: ti.pct }));
  });
  if (d.prepay_enabled && Number(d.prepay_pct) > 0) promoChips.push(tr('calc.promoPrepay', { pct: d.prepay_pct }));

  const summary = () =>
    `${doc.name} · ${pages} стор. · ${DIR_SHORT[direction] || direction}` +
    `${urgent ? ' · терміново' : ''}${certified ? ' · засвідчений переклад' : ''}${prepay ? ' · передоплата' : ''}` +
    (r.pct ? ` · знижка ${r.pct}%` : '') +
    ` · орієнтовно від ${r.total} ${cur}`;

  const goOrder = () => {
    store.calc = { doc_type: doc.name, direction, message: `Прорахунок з калькулятора: ${summary()}` };
    onOrdered?.();
    nav('/order');
  };

  const sendLead = async (e) => {
    e.preventDefault();
    const contact = leadForm.contact.trim();
    if (!leadForm.name.trim() || !contact) return;
    setLeadState('sending');
    try {
      const isEmail = contact.includes('@');
      const res = await fetch(`${API}/estimate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name, email: isEmail ? contact : '', phone: isEmail ? '' : contact,
          direction, doc_type: doc.name, pages, urgent, certified, prepay, discount_pct: r.pct, price: r.total,
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setLeadCode(d.code || String(d.id || '').slice(0, 8));
      setLeadState('success');
    } catch { setLeadState('error'); }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(leadCode); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {}
  };

  const docOptions = p.doc_types.map((dt, i) => ({
    value: i, label: docName(dt),
    meta: `${tr('calc.from')} ${Math.round(Number(dt.price) * mult)} ${cur}`,
  }));
  const dirOptions = DIRECTIONS.map((k) => ({ value: k, label: tr(`calc.dirs.${k}`), meta: DIR_SHORT[k] }));

  return (
    <div className={`calc${compact ? ' calc--compact' : ''}`} data-testid="calculator">
      <div className="calc__form">
        {promoChips.length > 0 && (
          <div className="calc-promo" data-testid="calc-promo">
            <span className="mono calc-promo__label">{tr('calc.promo')}</span>
            {promoChips.map((chip, i) => <span key={i} className="calc-promo__chip">{chip}</span>)}
          </div>
        )}
        <div className="calc-field">
          <label className="mono calc-label">{tr('calc.docType')}</label>
          <Select value={typeIdx} options={docOptions} onChange={(v) => setTypeIdx(Number(v))} testId="calc-doc-type" ariaLabel={tr('calc.docType')} />
        </div>
        <div className="calc-row">
          <div className="calc-field">
            <label className="mono calc-label">{tr('calc.pages')}</label>
            <div className="calc-stepper">
              <button type="button" onClick={() => setPages((v) => Math.max(1, v - 1))} data-testid="calc-pages-minus" aria-label="менше">−</button>
              <span data-testid="calc-pages-value">{pages}</span>
              <button type="button" onClick={() => setPages((v) => Math.min(99, v + 1))} data-testid="calc-pages-plus" aria-label="більше">+</button>
            </div>
          </div>
          <div className="calc-field" style={{ flex: 1 }}>
            <label className="mono calc-label">{tr('calc.direction')}</label>
            <Select value={direction} options={dirOptions} onChange={setDirection} testId="calc-direction" ariaLabel={tr('calc.direction')} />
          </div>
        </div>
        <div className="calc-opts">
          <label className="calc-check" data-testid="calc-urgent">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            <span className="calc-check__box" />
            <span>{tr('calc.urgent')} <em className="mono">+{p.urgent_pct}%</em></span>
          </label>
          <label className="calc-check" data-testid="calc-certified">
            <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
            <span className="calc-check__box" />
            <span>{tr('calc.certified')} <em className="mono">+{p.certified_fee} {cur}</em>
              <small className="calc-hint">{tr('calc.certifiedHint')}</small></span>
          </label>
          {d.prepay_enabled && Number(d.prepay_pct) > 0 && (
            <label className={`calc-check calc-check--prepay${prepay ? ' is-on' : ''}`} data-testid="calc-prepay">
              <span className="mono calc-prepay__badge">{tr('calc.prepayBadge')}</span>
              <input type="checkbox" checked={prepay} onChange={(e) => setPrepay(e.target.checked)} />
              <span className="calc-check__box" />
              <span>{tr('calc.prepay')} <em className="mono calc-prepay__pct">−{d.prepay_pct}%</em>
                {prepaySave > 0 && <em className="mono calc-prepay__save" data-testid="calc-prepay-save">≈ −{prepaySave} {cur}</em>}
                <small className="calc-hint">{tr('calc.prepayHint')}</small></span>
            </label>
          )}
        </div>
      </div>

      <div className="calc__receipt">
        <div className="mono calc-receipt__head">{tr('calc.receipt')}</div>
        <div className="calc-line"><span>{docName(doc)}{mult !== 1 ? <em className="mono calc-mult"> ×{mult}</em> : null}</span><span>{Math.round(Number(doc.price) * mult)} {cur}</span></div>
        {pages > 1 && <div className="calc-line"><span>+ {pages - 1} {tr('calc.extraPages')}</span><span>{Math.round((pages - 1) * Number(p.extra_page_price) * mult)} {cur}</span></div>}
        {urgent && <div className="calc-line"><span>{tr('calc.urgent')}</span><span>+{p.urgent_pct}%</span></div>}
        {r.volumePct > 0 && <div className="calc-line calc-line--discount" data-testid="calc-discount-volume"><span>{tr('calc.discountVolume')}</span><span>−{r.volumePct}%</span></div>}
        {r.prepayPct > 0 && <div className="calc-line calc-line--discount" data-testid="calc-discount-prepay"><span>{tr('calc.discountPrepay')}</span><span>−{r.prepayPct}%</span></div>}
        {certified && <div className="calc-line"><span>{tr('calc.certLine')}</span><span>+{p.certified_fee} {cur}</span></div>}
        <div className="calc-total">
          <span className="mono">{tr('calc.total')}</span>
          <strong data-testid="calc-total">{tr('calc.from')} {r.total} {cur}</strong>
        </div>
        {r.discount > 0 && (
          <div className="calc-save" data-testid="calc-savings">
            <strong>{tr('calc.youSave')} {r.discount} {cur}</strong>
          </div>
        )}
        {tier && (
          <div className="calc-nudge" data-testid="calc-nudge">
            <button type="button" onClick={() => setPages(tier.min_pages)}>
              {tr('calc.nudge', { n: tier.min_pages - pages, pct: tier.pct })}
            </button>
          </div>
        )}
        {noteText && <p className="calc-note">{noteText}</p>}
        <div className="calc-ctas">
          {leadState === 'success' ? (
            <div className="calc-sentbox" data-testid="calc-lead-success">
              <span className="calc-sentbox__check">✓</span>
              <p>{tr('calc.sent')}</p>
              {leadCode && (
                <div className="calc-sentbox__code mono">
                  <span>{tr('quick.codeLabel')}</span>
                  <strong data-testid="calc-lead-code">{leadCode}</strong>
                  <button type="button" onClick={copyCode} data-testid="calc-lead-copy">{copied ? tr('quick.copied') : tr('quick.copy')}</button>
                </div>
              )}
            </div>
          ) : leadOpen ? (
            <form onSubmit={sendLead} className="calc-lead calc-leadstep" data-testid="calc-lead-form">
              <div className="mono calc-leadstep__title">{tr('calc.leadTitle')}</div>
              <input className="calc-input" placeholder={tr('calc.leadName')} value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} required autoFocus data-testid="calc-lead-name" />
              <input className="calc-input" placeholder={tr('calc.leadContact')} value={leadForm.contact} onChange={(e) => setLeadForm({ ...leadForm, contact: e.target.value })} required data-testid="calc-lead-contact" />
              {leadState === 'error' && <p style={{ color: '#8a4a3a', fontSize: '.8rem' }}>{tr('calc.error')}</p>}
              <button className="btn btn-primary" type="submit" disabled={leadState === 'sending'} style={{ justifyContent: 'center', padding: '.85rem 1.2rem' }} data-testid="calc-lead-submit">
                <span className="dot" />{leadState === 'sending' ? tr('calc.sending') : tr('calc.leadSubmit')}
              </button>
            </form>
          ) : (
            <button className="btn btn-primary" onClick={() => setLeadOpen(true)} data-testid="calc-order" style={{ justifyContent: 'center', padding: '.9rem 1.2rem' }}>
              <span className="dot" />{tr('calc.order')}
            </button>
          )}
          {leadState !== 'success' && (
            <button className="calc-ghost mono" onClick={goOrder} data-testid="calc-full-form">{tr('calc.fullForm')} →</button>
          )}
        </div>
      </div>
    </div>
  );
}
