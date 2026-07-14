import { useEffect, useState } from 'react';
import { adminApi } from './adminApi';

export default function ContactsView() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { adminApi.contacts().then(setItems).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="adm-empty">{err}</p>;
  if (!items) return <p className="adm-empty">Завантаження…</p>;
  if (!items.length) return <p className="adm-empty" data-testid="contacts-empty">Повідомлень поки немає.</p>;

  return (
    <div className="adm-list" data-testid="contacts-list">
      {items.map((m) => (
        <article key={m.id} className="adm-card" data-testid="contact-card">
          <div className="adm-card__top">
            <div>
              <strong className="adm-card__name">{m.name}</strong>
              <div className="adm-card__meta"><a href={`mailto:${m.email}`}>{m.email}</a></div>
            </div>
            <span className="mono adm-card__date">{new Date(m.created_at).toLocaleString('uk-UA')}</span>
          </div>
          <p className="adm-card__msg">{m.message}</p>
        </article>
      ))}
    </div>
  );
}
