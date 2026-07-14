import { useEffect, useState, useRef } from 'react';
import { adminApi } from './adminApi';
import { resolveMediaUrl } from '../../lib/settings';

const EMPTY = { title: '', note: '', direction: 'UA ⇄ DE', price_from: '', image_url: '', published: true };

function ItemForm({ initial, onSave, onCancel, saving }) {
  const [f, setF] = useState({ ...EMPTY, ...initial, price_from: initial?.price_from ?? '' });
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setErr('');
    try {
      const r = await adminApi.uploadWorkImage(file);
      setF((p) => ({ ...p, image_url: r.url }));
    } catch (e) { setErr(e.message); }
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) { setErr('Вкажіть назву'); return; }
    onSave({ ...f, price_from: f.price_from === '' ? null : Number(f.price_from) });
  };

  const img = resolveMediaUrl(f.image_url);

  return (
    <form onSubmit={submit} className="adm-workform" data-testid="work-form">
      <div className="adm-grid">
        <div className="adm-field">
          <label className="adm-label mono">Назва *</label>
          <input className="adm-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="напр. Дипломи" data-testid="work-form-title" />
        </div>
        <div className="adm-field">
          <label className="adm-label mono">Підпис (типи документів)</label>
          <input className="adm-input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="напр. Дипломи з додатками, атестати" data-testid="work-form-note" />
        </div>
        <div className="adm-field">
          <label className="adm-label mono">Напрям</label>
          <input className="adm-input" value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value })} data-testid="work-form-direction" />
        </div>
        <div className="adm-field">
          <label className="adm-label mono">Ціна «від», € (необов'язково)</label>
          <input className="adm-input" type="number" min="0" step="1" value={f.price_from} onChange={(e) => setF({ ...f, price_from: e.target.value })} placeholder="45" data-testid="work-form-price" />
        </div>
        <div className="adm-field adm-field--full">
          <label className="adm-label mono">Зображення (фон картки)</label>
          <div className="adm-imgrow">
            {img ? <span className="adm-thumb" style={{ backgroundImage: `url(${img})` }} /> : <span className="adm-thumb adm-thumb--empty mono">немає</span>}
            <input className="adm-input" style={{ flex: 1 }} value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} placeholder="https://… або завантажте файл" data-testid="work-form-image-url" />
            <button type="button" className="adm-btn-ghost mono" style={{ margin: 0, whiteSpace: 'nowrap' }} onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="work-form-upload">
              {uploading ? 'Завантаження…' : '↑ Файл'}
            </button>
            <input ref={fileRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => upload(e.target.files?.[0])} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
        <label className="adm-switch" data-testid="work-form-published">
          <input type="checkbox" checked={!!f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
          <span className="mono">Показувати на сайті</span>
        </label>
        <span style={{ flex: 1 }} />
        {err && <span style={{ color: '#8a4a3a', fontSize: '.85rem' }}>{err}</span>}
        <button type="button" className="adm-btn-ghost mono" style={{ margin: 0 }} onClick={onCancel}>Скасувати</button>
        <button className="btn btn-primary" type="submit" disabled={saving} style={{ padding: '.7rem 1.4rem' }} data-testid="work-form-save">
          <span className="dot" />{saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </form>
  );
}

export default function WorkView() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // 'new' | item.id | null
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => adminApi.work().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000); };

  const save = async (payload, id) => {
    setSaving(true);
    try {
      if (id) await adminApi.updateWork(id, payload);
      else await adminApi.createWork(payload);
      setEditing(null); await load();
      flash('ok', 'Приклад збережено');
    } catch (e) { flash('err', e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Видалити цей приклад?')) return;
    try { await adminApi.deleteWork(id); await load(); flash('ok', 'Видалено'); } catch (e) { flash('err', e.message); }
  };

  const togglePub = async (it) => {
    setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, published: !x.published } : x)));
    try { await adminApi.updateWork(it.id, { ...it, published: !it.published }); } catch { load(); }
  };

  const move = async (idx, dir) => {
    const arr = [...items];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setItems(arr);
    try { await adminApi.reorderWork(arr.map((x) => x.id)); } catch { load(); }
  };

  if (!items) return <p className="adm-empty">Завантаження…</p>;

  return (
    <div data-testid="work-view">
      {msg && <div className={`adm-toast adm-toast--${msg.type}`} style={{ marginBottom: '1.2rem' }} data-testid="work-toast">{msg.text}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', maxWidth: 520 }}>Картки з'являються на сторінці «Приклади» у вказаному порядку. Фото документа — фон верхнього аркуша картки.</p>
        <button className="btn btn-primary" onClick={() => setEditing('new')} style={{ padding: '.7rem 1.4rem' }} data-testid="work-add">
          <span className="dot" />Додати приклад
        </button>
      </div>

      {editing === 'new' && (
        <div className="adm-block" style={{ marginBottom: '1.2rem' }}>
          <ItemForm initial={null} saving={saving} onSave={(p) => save(p)} onCancel={() => setEditing(null)} />
        </div>
      )}

      <div className="adm-list">
        {items.map((it, idx) => (
          <article key={it.id} className="adm-card" data-testid="work-item-card" style={{ opacity: it.published ? 1 : .55 }}>
            {editing === it.id ? (
              <ItemForm initial={it} saving={saving} onSave={(p) => save(p, it.id)} onCancel={() => setEditing(null)} />
            ) : (
              <div className="adm-workrow">
                {resolveMediaUrl(it.image_url) ? (
                  <span className="adm-thumb" style={{ backgroundImage: `url(${resolveMediaUrl(it.image_url)})` }} />
                ) : (
                  <span className="adm-thumb adm-thumb--empty mono">фон</span>
                )}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <strong className="adm-card__name">{it.title}</strong>
                  <div className="adm-card__meta">{it.note || '—'}</div>
                  <div className="mono adm-card__tags" style={{ marginTop: '.35rem' }}>
                    <span>{it.direction}</span>
                    {it.price_from > 0 && <span>від {it.price_from} €</span>}
                    {!it.published && <span className="adm-badge adm-badge--declined">приховано</span>}
                  </div>
                </div>
                <div className="adm-workrow__actions">
                  <button className="adm-mini" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="вгору">↑</button>
                  <button className="adm-mini" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="вниз">↓</button>
                  <label className="adm-switch" title="Показувати на сайті">
                    <input type="checkbox" checked={!!it.published} onChange={() => togglePub(it)} data-testid="work-item-publish" />
                    <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
                  </label>
                  <button className="adm-mini mono" onClick={() => setEditing(it.id)} data-testid="work-item-edit">Ред.</button>
                  <button className="adm-mini adm-mini--danger" onClick={() => del(it.id)} data-testid="work-item-delete">✕</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
