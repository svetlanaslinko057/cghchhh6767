import { useEffect, useState } from 'react';
import { adminApi } from './adminApi';

const EMPTY = { name: '', meta: '', text: '', rating: 5, published: true };

function ReviewForm({ initial, onSave, onCancel, saving, testPrefix }) {
  const [f, setF] = useState(initial);
  const upd = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="adm-revform" data-testid={`${testPrefix}-form`}>
      <div className="adm-grid">
        <div className="adm-field">
          <label className="adm-label mono">Ім'я клієнта *</label>
          <input className="adm-input" value={f.name} onChange={(e) => upd('name', e.target.value)} placeholder="Олена К." data-testid={`${testPrefix}-name`} />
        </div>
        <div className="adm-field">
          <label className="adm-label mono">Контекст (тип · напрям)</label>
          <input className="adm-input" value={f.meta} onChange={(e) => upd('meta', e.target.value)} placeholder="Договір · UA → DE" data-testid={`${testPrefix}-meta`} />
        </div>
      </div>
      <div className="adm-field adm-field--full">
        <label className="adm-label mono">Текст відгуку *</label>
        <textarea className="adm-input" rows={3} value={f.text} onChange={(e) => upd('text', e.target.value)} data-testid={`${testPrefix}-text`} />
      </div>
      <div className="adm-revform__row">
        <div className="adm-field">
          <label className="adm-label mono">Оцінка</label>
          <div className="adm-stars" data-testid={`${testPrefix}-stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={n <= (f.rating || 0) ? 'is-on' : ''} onClick={() => upd('rating', f.rating === n ? null : n)} aria-label={`${n} зірок`}>★</button>
            ))}
          </div>
        </div>
        <label className="adm-switch">
          <input type="checkbox" checked={!!f.published} onChange={(e) => upd('published', e.target.checked)} data-testid={`${testPrefix}-published`} />
          <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
          <span className="mono">Опубліковано на сайті</span>
        </label>
      </div>
      <div className="adm-revform__actions">
        <button className="btn btn-primary" onClick={() => onSave(f)} disabled={saving || !f.name.trim() || !f.text.trim()} data-testid={`${testPrefix}-save`} style={{ padding: '.75rem 1.4rem' }}>
          <span className="dot" />{saving ? 'Збереження…' : 'Зберегти'}
        </button>
        {onCancel && <button className="adm-btn-ghost mono" onClick={onCancel} data-testid={`${testPrefix}-cancel`}>Скасувати</button>}
      </div>
    </div>
  );
}

export default function ReviewsView({ onChanged }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.reviews().then(setItems).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const create = async (f) => {
    setSaving(true);
    try { await adminApi.createReview(f); setAdding(false); await load(); onChanged?.(); } catch (e) { setErr(e.message); }
    setSaving(false);
  };
  const save = async (id, f) => {
    setSaving(true);
    try { await adminApi.updateReview(id, f); setEditId(null); await load(); } catch (e) { setErr(e.message); }
    setSaving(false);
  };
  const remove = async (id) => {
    if (!window.confirm('Видалити відгук?')) return;
    try { await adminApi.deleteReview(id); await load(); onChanged?.(); } catch (e) { setErr(e.message); }
  };
  const togglePub = async (r) => {
    setItems((list) => list.map((x) => (x.id === r.id ? { ...x, published: !r.published } : x)));
    try { await adminApi.updateReview(r.id, { name: r.name, meta: r.meta, text: r.text, rating: r.rating, published: !r.published }); } catch { load(); }
  };
  const move = async (i, dir) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    try { await adminApi.reorderReviews(next.map((x) => x.id)); } catch { load(); }
  };

  if (err && !items) return <p className="adm-empty">{err}</p>;
  if (!items) return <p className="adm-empty">Завантаження…</p>;

  return (
    <div data-testid="reviews-view">
      {err && <div className="adm-toast adm-toast--err">{err}</div>}

      {adding ? (
        <section className="adm-block">
          <div className="adm-block__head">
            <span className="mono adm-block__no">+</span>
            <div><h2>Новий відгук</h2><p>Тільки реальні відгуки клієнтів. Опубліковані з'являються на головній сторінці.</p></div>
          </div>
          <ReviewForm initial={EMPTY} onSave={create} onCancel={() => setAdding(false)} saving={saving} testPrefix="review-new" />
        </section>
      ) : (
        <button className="adm-btn-ghost mono" onClick={() => setAdding(true)} data-testid="review-add" style={{ marginBottom: '1.4rem' }}>+ Додати відгук</button>
      )}

      {!items.length && !adding && (
        <p className="adm-empty" data-testid="reviews-empty">Відгуків поки немає. Додайте перший відгук — він з'явиться на головній сторінці сайту.</p>
      )}

      <div className="adm-list">
        {items.map((r, i) => (
          <article key={r.id} className={`adm-card${!r.published ? ' adm-card--muted' : ''}`} data-testid="admin-review-card">
            {editId === r.id ? (
              <ReviewForm initial={r} onSave={(f) => save(r.id, f)} onCancel={() => setEditId(null)} saving={saving} testPrefix="review-edit" />
            ) : (<>
              <div className="adm-card__top">
                <div>
                  <strong className="adm-card__name">{r.name}</strong>
                  <div className="adm-card__meta">
                    {r.meta && <span className="mono">{r.meta}</span>}
                    {r.rating ? <span className="mono" style={{ color: 'var(--accent-2, #B98A4E)' }}> {'★'.repeat(r.rating)}</span> : null}
                  </div>
                </div>
                <div className="adm-card__right">
                  <div className="adm-rev__tools">
                    <button className="adm-mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label="вгору" data-testid={`review-up-${i}`}>↑</button>
                    <button className="adm-mini" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="вниз" data-testid={`review-down-${i}`}>↓</button>
                    <button className="adm-mini" onClick={() => setEditId(r.id)} aria-label="редагувати" data-testid={`review-edit-${i}`}>✎</button>
                    <button className="adm-mini adm-mini--danger" onClick={() => remove(r.id)} aria-label="видалити" data-testid={`review-delete-${i}`}>✕</button>
                  </div>
                </div>
              </div>
              <p className="adm-card__msg">{r.text}</p>
              <label className="adm-switch" style={{ marginTop: '.4rem' }}>
                <input type="checkbox" checked={!!r.published} onChange={() => togglePub(r)} data-testid={`review-publish-${i}`} />
                <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
                <span className="mono">{r.published ? 'Опубліковано' : 'Приховано'}</span>
              </label>
            </>)}
          </article>
        ))}
      </div>
    </div>
  );
}
