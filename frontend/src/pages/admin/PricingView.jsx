import { useEffect, useState } from 'react';
import { adminApi } from './adminApi';
import Select from '../../components/Select';

const PAIR_LABELS = [
  { key: 'ua-de', label: 'Українська ⇄ Німецька', hint: 'базова пара' },
  { key: 'ua-en', label: 'Українська ⇄ Англійська', hint: '' },
  { key: 'de-en', label: 'Німецька ⇄ Англійська', hint: '' },
];

export default function PricingView() {
  const [p, setP] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { adminApi.getPricing().then(setP).catch(() => {}); }, []);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000); };

  const upd = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setP((prev) => ({ ...prev, [k]: v }));
  };

  const updType = (i, k, v) => setP((prev) => {
    const dt = [...prev.doc_types]; dt[i] = { ...dt[i], [k]: v };
    return { ...prev, doc_types: dt };
  });

  const addType = () => setP((prev) => ({ ...prev, doc_types: [...prev.doc_types, { name: '', price: 0 }] }));
  const rmType = (i) => setP((prev) => ({ ...prev, doc_types: prev.doc_types.filter((_, j) => j !== i) }));

  const updMult = (key) => (e) => setP((prev) => ({
    ...prev, pair_multipliers: { ...(prev.pair_multipliers || {}), [key]: e.target.value },
  }));

  const updDisc = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setP((prev) => ({ ...prev, discounts: { ...(prev.discounts || {}), [k]: v } }));
  };

  const updTier = (i, k, v) => setP((prev) => {
    const tiers = [...(prev.discounts?.volume_tiers || [])];
    tiers[i] = { ...tiers[i], [k]: v };
    return { ...prev, discounts: { ...prev.discounts, volume_tiers: tiers } };
  });

  const addTier = () => setP((prev) => ({
    ...prev, discounts: { ...prev.discounts, volume_tiers: [...(prev.discounts?.volume_tiers || []), { min_pages: '', pct: '' }] },
  }));

  const rmTier = (i) => setP((prev) => ({
    ...prev, discounts: { ...prev.discounts, volume_tiers: (prev.discounts?.volume_tiers || []).filter((_, j) => j !== i) },
  }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...p,
        doc_types: p.doc_types.filter((d) => d.name.trim()).map((d) => ({ name: d.name.trim(), price: Number(d.price) || 0 })),
        extra_page_price: Number(p.extra_page_price) || 0,
        urgent_pct: Number(p.urgent_pct) || 0,
        certified_fee: Number(p.certified_fee) || 0,
        pair_multipliers: {
          'ua-de': Math.max(0.1, Number(p.pair_multipliers?.['ua-de']) || 1),
          'ua-en': Math.max(0.1, Number(p.pair_multipliers?.['ua-en']) || 1),
          'de-en': Math.max(0.1, Number(p.pair_multipliers?.['de-en']) || 1),
        },
        discounts: {
          volume_enabled: !!p.discounts?.volume_enabled,
          volume_tiers: (p.discounts?.volume_tiers || [])
            .map((t) => ({ min_pages: Number(t.min_pages) || 0, pct: Number(t.pct) || 0 }))
            .filter((t) => t.min_pages > 0 && t.pct > 0)
            .sort((a, b) => a.min_pages - b.min_pages),
          prepay_enabled: !!p.discounts?.prepay_enabled,
          prepay_pct: Math.min(90, Math.max(0, Number(p.discounts?.prepay_pct) || 0)),
        },
      };
      const saved = await adminApi.savePricing(payload);
      setP(saved);
      flash('ok', 'Ціни збережено');
    } catch (e) { flash('err', e.message); }
    setSaving(false);
  };

  if (!p) return <p className="adm-empty">Завантаження…</p>;
  const disc = p.discounts || {};
  const mults = p.pair_multipliers || {};

  return (
    <div className="adm-settings" data-testid="pricing-view">
      {msg && <div className={`adm-toast adm-toast--${msg.type}`} data-testid="pricing-toast">{msg.text}</div>}

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">01</span>
          <div>
            <h2>Калькулятор вартості</h2>
            <p>Калькулятор показується на головній, сторінці «Приклади» та у віджеті. Ціна = базова + додаткові сторінки + опції − знижки.</p>
          </div>
        </div>
        <label className="adm-switch" data-testid="pricing-enabled">
          <input type="checkbox" checked={!!p.enabled} onChange={upd('enabled')} />
          <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
          <span className="mono">Показувати калькулятор на сайті</span>
        </label>
        <div className="adm-grid" style={{ marginTop: '1.2rem', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <div className="adm-field">
            <label className="adm-label mono">Валюта</label>
            <div className="adm-esel">
              <Select
                value={p.currency}
                options={[{ value: 'EUR', label: 'EUR €' }, { value: 'UAH', label: 'UAH ₴' }, { value: 'USD', label: 'USD $' }]}
                onChange={(v) => setP((prev) => ({ ...prev, currency: v }))}
                testId="pricing-currency"
                ariaLabel="Валюта"
              />
            </div>
          </div>
          <div className="adm-field">
            <label className="adm-label mono">Дод. сторінка</label>
            <input className="adm-input" type="number" min="0" value={p.extra_page_price} onChange={upd('extra_page_price')} data-testid="pricing-extra-page" />
          </div>
          <div className="adm-field">
            <label className="adm-label mono">Терміново, %</label>
            <input className="adm-input" type="number" min="0" value={p.urgent_pct} onChange={upd('urgent_pct')} data-testid="pricing-urgent" />
          </div>
          <div className="adm-field">
            <label className="adm-label mono">Засвідчення, фікс.</label>
            <input className="adm-input" type="number" min="0" value={p.certified_fee} onChange={upd('certified_fee')} data-testid="pricing-certified" />
          </div>
        </div>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">02</span>
          <div>
            <h2>Типи документів і базові ціни</h2>
            <p>Базова ціна — за першу сторінку документа цього типу (для пари українська ⇄ німецька).</p>
          </div>
        </div>
        <div className="adm-pricelist" data-testid="pricing-types">
          {p.doc_types.map((d, i) => (
            <div key={i} className="adm-pricerow">
              <input className="adm-input" value={d.name} onChange={(e) => updType(i, 'name', e.target.value)} placeholder="Назва типу" data-testid={`pricing-type-name-${i}`} />
              <input className="adm-input" type="number" min="0" style={{ width: 110 }} value={d.price} onChange={(e) => updType(i, 'price', e.target.value)} data-testid={`pricing-type-price-${i}`} />
              <button className="adm-mini adm-mini--danger" onClick={() => rmType(i)} aria-label="видалити" data-testid={`pricing-type-remove-${i}`}>✕</button>
            </div>
          ))}
        </div>
        <button className="adm-btn-ghost mono" onClick={addType} data-testid="pricing-type-add">+ Додати тип</button>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">03</span>
          <div>
            <h2>Мовні пари</h2>
            <p>Коефіцієнт до базової ціни для кожної пари. 1 — базова ціна, 1.2 — на 20% дорожче. Діє в обох напрямах пари.</p>
          </div>
        </div>
        <div className="adm-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }} data-testid="pricing-pairs">
          {PAIR_LABELS.map(({ key, label, hint }) => (
            <div className="adm-field" key={key}>
              <label className="adm-label mono">{label}{hint ? ` · ${hint}` : ''}</label>
              <input
                className="adm-input" type="number" min="0.1" step="0.05"
                value={mults[key] ?? 1}
                onChange={updMult(key)}
                data-testid={`pricing-mult-${key}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">04</span>
          <div>
            <h2>Знижки та акції</h2>
            <p>Інструменти конверсії: знижка за обсяг мотивує надсилати більше сторінок, знижка за передоплату — швидше підтверджувати замовлення. Показуються в калькуляторі автоматично.</p>
          </div>
        </div>

        <label className="adm-switch" data-testid="pricing-volume-enabled">
          <input type="checkbox" checked={!!disc.volume_enabled} onChange={updDisc('volume_enabled')} />
          <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
          <span className="mono">Знижка за обсяг (сторінки)</span>
        </label>

        {!!disc.volume_enabled && (
          <div style={{ marginTop: '1rem' }}>
            <div className="adm-pricelist" data-testid="pricing-tiers">
              {(disc.volume_tiers || []).map((t, i) => (
                <div key={i} className="adm-pricerow adm-pricerow--tier">
                  <span className="mono adm-tier-label">від</span>
                  <input className="adm-input" type="number" min="2" style={{ width: 90 }} value={t.min_pages} onChange={(e) => updTier(i, 'min_pages', e.target.value)} placeholder="стор." data-testid={`pricing-tier-pages-${i}`} />
                  <span className="mono adm-tier-label">стор. →</span>
                  <input className="adm-input" type="number" min="1" max="90" style={{ width: 80 }} value={t.pct} onChange={(e) => updTier(i, 'pct', e.target.value)} placeholder="%" data-testid={`pricing-tier-pct-${i}`} />
                  <span className="mono adm-tier-label">%</span>
                  <button className="adm-mini adm-mini--danger" onClick={() => rmTier(i)} aria-label="видалити" data-testid={`pricing-tier-remove-${i}`}>✕</button>
                </div>
              ))}
            </div>
            <button className="adm-btn-ghost mono" onClick={addTier} data-testid="pricing-tier-add">+ Додати поріг</button>
          </div>
        )}

        <div style={{ marginTop: '1.4rem' }}>
          <label className="adm-switch" data-testid="pricing-prepay-enabled">
            <input type="checkbox" checked={!!disc.prepay_enabled} onChange={updDisc('prepay_enabled')} />
            <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
            <span className="mono">Знижка за передоплату</span>
          </label>
          {!!disc.prepay_enabled && (
            <div className="adm-field" style={{ marginTop: '.9rem', maxWidth: 220 }}>
              <label className="adm-label mono">Розмір знижки, %</label>
              <input className="adm-input" type="number" min="0" max="90" value={disc.prepay_pct ?? 0} onChange={updDisc('prepay_pct')} data-testid="pricing-prepay-pct" />
            </div>
          )}
        </div>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">05</span>
          <div><h2>Примітка під прорахунком</h2></div>
        </div>
        <textarea className="adm-input" rows={2} value={p.note} onChange={upd('note')} data-testid="pricing-note" />
      </section>

      <div className="adm-savebar">
        <button className="btn btn-primary" onClick={save} disabled={saving} data-testid="pricing-save" style={{ padding: '.9rem 1.8rem' }}>
          <span className="dot" />{saving ? 'Збереження…' : 'Зберегти ціни'}
        </button>
      </div>
    </div>
  );
}
