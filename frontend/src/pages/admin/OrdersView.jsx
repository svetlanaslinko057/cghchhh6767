import { useEffect, useState } from 'react';
import { adminApi, STATUS_OPTIONS, statusLabel } from './adminApi';
import Select from '../../components/Select';
import { DIR_SHORT } from '../../lib/directions';

export default function OrdersView({ onChanged }) {
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => adminApi.orders().then(setOrders).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    try { await adminApi.setOrderStatus(id, status); onChanged?.(); } catch { load(); }
  };

  if (err) return <p className="adm-empty">{err}</p>;
  if (!orders) return <p className="adm-empty">Завантаження…</p>;
  if (!orders.length) return <p className="adm-empty" data-testid="orders-empty">Заявок поки немає. Нові заявки з сайту з'являться тут.</p>;

  const counts = { all: orders.length };
  STATUS_OPTIONS.forEach((s) => { counts[s.value] = orders.filter((o) => o.status === s.value).length; });
  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="adm-chips mono" data-testid="orders-filter">
        <button className={`adm-chip${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')} data-testid="orders-filter-all">
          Всі <em>{counts.all}</em>
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button key={s.value} className={`adm-chip adm-chip--${s.value}${filter === s.value ? ' is-active' : ''}`} onClick={() => setFilter(s.value)} data-testid={`orders-filter-${s.value}`}>
            {s.label} <em>{counts[s.value]}</em>
          </button>
        ))}
      </div>

      {!visible.length && <p className="adm-empty" data-testid="orders-filter-empty">Немає заявок із цим статусом.</p>}

      <div className="adm-list" data-testid="orders-list">
        {visible.map((o) => (
          <article key={o.id} className="adm-card" data-testid="order-card">
            <div className="adm-card__top">
              <div>
                <strong className="adm-card__name">{o.name}</strong>
                <div className="adm-card__meta">
                  <a href={`mailto:${o.email}`}>{o.email}</a>
                  {o.phone ? <> · <a href={`tel:${o.phone}`}>{o.phone}</a></> : null}
                </div>
              </div>
              <div className="adm-card__right">
                <span className="mono adm-card__date">{new Date(o.created_at).toLocaleString('uk-UA')}</span>
                <div className={`adm-statusesel adm-statusesel--${o.status}`}>
                  <Select
                    value={o.status}
                    options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                    onChange={(v) => changeStatus(o.id, v)}
                    testId="order-status-select"
                    ariaLabel="Статус заявки"
                  />
                </div>
              </div>
            </div>
            <div className="mono adm-card__tags">
              <span className="adm-card__code" title="Код для відстеження клієнтом" data-testid="order-code-tag">№ {String(o.id).slice(0, 8)}</span>
              <span>{DIR_SHORT[o.direction] || o.direction}</span>
              {o.doc_type && <span>{o.doc_type}</span>}
              <span className={`adm-badge adm-badge--${o.status}`}>{statusLabel(o.status)}</span>
            </div>
            {o.message && <p className="adm-card__msg">{o.message}</p>}
            {o.files?.length > 0 && (
              <div className="adm-files">
                {o.files.map((f) => (
                  <button key={f.id} className="adm-file mono" onClick={() => adminApi.downloadFile(f.storage_path, f.original_filename)} data-testid="order-file-download">
                    ↓ {f.original_filename}
                  </button>
                ))}
              </div>
            )}
            {o.status_history?.length > 1 && (
              <div className="mono adm-card__history" data-testid="order-history">
                {o.status_history.map((h, i) => (
                  <span key={i}>
                    {statusLabel(h.status)} · {new Date(h.at).toLocaleDateString('uk-UA')}
                    {i < o.status_history.length - 1 ? ' → ' : ''}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
