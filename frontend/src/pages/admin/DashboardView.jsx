import { useEffect, useState } from 'react';
import { adminApi, statusLabel, STATUS_OPTIONS } from './adminApi';
import { DIR_SHORT } from '../../lib/directions';

/*
 * Admin dashboard «Огляд»: funnel stats + recent orders at a glance.
 */
export default function DashboardView({ onOpenOrders }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setErr(e.message));
    adminApi.orders().then(setOrders).catch(() => {});
  }, []);

  if (err) return <p className="adm-empty">{err}</p>;
  if (!stats) return <p className="adm-empty">Завантаження…</p>;

  const cards = [
    { key: 'total', label: 'Всього заявок', val: stats.orders_total, accent: false },
    { key: 'new', label: 'Нові', val: stats.by_status?.new ?? 0, accent: true },
    { key: 'in_progress', label: 'В роботі', val: stats.by_status?.in_progress ?? 0 },
    { key: 'done', label: 'Виконано', val: stats.by_status?.done ?? 0 },
    { key: 'last7', label: 'За 7 днів', val: stats.orders_last7 },
    { key: 'contacts', label: 'Повідомлення', val: stats.contacts_total },
    { key: 'reviews', label: 'Відгуки', val: stats.reviews_total },
  ];

  const recent = (orders || []).slice(0, 6);

  return (
    <div className="adm-dash" data-testid="dashboard-view">
      <div className="adm-dash__grid">
        {cards.map((c) => (
          <div key={c.key} className={`adm-dash__card${c.accent ? ' is-accent' : ''}`} data-testid={`dash-card-${c.key}`}>
            <strong className="adm-dash__num">{c.val ?? 0}</strong>
            <span className="mono adm-dash__label">{c.label}</span>
          </div>
        ))}
      </div>

      <section className="adm-block" style={{ marginTop: '1.6rem' }}>
        <div className="adm-block__head">
          <span className="mono adm-block__no">01</span>
          <div>
            <h2>Останні заявки</h2>
            <p>Шість останніх заявок з усіх джерел: форма, швидка заявка, віджет, калькулятор.</p>
          </div>
        </div>
        {!recent.length ? (
          <p className="adm-empty" data-testid="dash-recent-empty">Заявок поки немає.</p>
        ) : (
          <div className="adm-dash__recent" data-testid="dash-recent">
            {recent.map((o) => (
              <button key={o.id} className="adm-dash__row" onClick={onOpenOrders} data-testid="dash-recent-row">
                <span className="mono adm-dash__code">{String(o.id).slice(0, 8)}</span>
                <strong className="adm-dash__name">{o.name}</strong>
                <span className="mono adm-dash__dir">{DIR_SHORT[o.direction] || o.direction}</span>
                {o.files?.length > 0 && <span className="mono adm-dash__files">⤓ {o.files.length}</span>}
                <span className={`adm-badge adm-badge--${o.status} mono`}>{statusLabel(o.status)}</span>
                <span className="mono adm-dash__date">{new Date(o.created_at).toLocaleDateString('uk-UA')}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">02</span>
          <div>
            <h2>Воронка статусів</h2>
            <p>Розподіл усіх заявок за статусами.</p>
          </div>
        </div>
        <div className="adm-dash__funnel" data-testid="dash-funnel">
          {STATUS_OPTIONS.map((s) => {
            const v = stats.by_status?.[s.value] ?? 0;
            const max = Math.max(1, ...STATUS_OPTIONS.map((x) => stats.by_status?.[x.value] ?? 0));
            return (
              <div key={s.value} className="adm-dash__frow">
                <span className="mono adm-dash__flabel">{s.label}</span>
                <div className="adm-dash__fbar"><span className={`adm-dash__ffill adm-dash__ffill--${s.value}`} style={{ width: `${(v / max) * 100}%` }} /></div>
                <span className="mono adm-dash__fval">{v}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
