import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from '../components/Reveal';
import Select from '../components/Select';
import store from '../lib/store';
import { DIRECTIONS, DIR_SHORT } from '../lib/directions';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

function TrackSection() {
  const { t } = useTranslation();
  const [f, setF] = useState({ code: '', email: '' });
  const [state, setState] = useState('idle'); // idle | checking | done | notfound | error
  const [res, setRes] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.code.trim() || !f.email.trim()) return;
    setState('checking');
    try {
      const r = await fetch(`${API}/orders/track`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: f.code.trim(), email: f.email.trim() }),
      });
      if (r.status === 404) { setState('notfound'); setRes(null); return; }
      if (!r.ok) throw new Error();
      setRes(await r.json());
      setState('done');
    } catch { setState('error'); }
  };

  const inputStyle = { width: '100%', padding: '1rem 1.1rem', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--card)', fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--ink)' };
  const label = { display: 'block', marginBottom: '.5rem', fontFamily: 'var(--font-mono)', fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)' };

  return (
    <section className="trackx" data-testid="track-section">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="trackx__card">
          <div className="trackx__perf" aria-hidden="true" />
          <div className="mono eyebrow" style={{ marginBottom: '1rem' }}>{t('track.kicker')}</div>
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', marginBottom: '.7rem' }}>{t('track.title')}</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: '1.6rem', maxWidth: 520 }}>{t('track.intro')}</p>
          <form onSubmit={submit} className="trackx__form">
            <div className="form-2col">
              <div><label style={label}>{t('track.code')}</label>
                <input style={inputStyle} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="a1b2c3d4" required data-testid="track-code" /></div>
              <div><label style={label}>{t('track.email')}</label>
                <input type="email" style={inputStyle} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required data-testid="track-email" /></div>
            </div>
            <button className="btn btn-ghost trackx__btn mono" type="submit" disabled={state === 'checking'} data-testid="track-submit">
              {state === 'checking' ? t('track.checking') : `→ ${t('track.submit')}`}
            </button>
          </form>
          {state === 'notfound' && <p className="trackx__nf" data-testid="track-notfound">{t('track.notFound')}</p>}
          {state === 'error' && <p className="trackx__nf">{t('orderPage.error')}</p>}
          {state === 'done' && res && (
            <div className="trackx__res" data-testid="track-result">
              <div className="trackx__meta mono">
                <span>{t('track.code').toUpperCase()} · {res.code}</span>
                {res.doc_type && <span>{res.doc_type}</span>}
                {res.direction && <span>{DIR_SHORT[res.direction] || res.direction}</span>}
              </div>
              <div className="trackx__status">
                <span className="mono">{t('track.current')}</span>
                <strong data-testid="track-status">{t(`track.statuses.${res.status}`, { defaultValue: res.status })}</strong>
              </div>
              <ol className="trackx__timeline" data-testid="track-timeline">
                {(res.status_history || []).map((h, i) => (
                  <li key={i} className={i === (res.status_history.length - 1) ? 'is-last' : ''}>
                    <span className="trackx__dot" aria-hidden="true" />
                    <div>
                      <strong>{t(`track.statuses.${h.status}`, { defaultValue: h.status })}</strong>
                      {h.at && <span className="mono trackx__at">{new Date(h.at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Order() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name:'', email:'', phone:'', direction:'ua-de', doc_type:'', message:'' });
  const [files, setFiles] = useState([]);
  const [state, setState] = useState('idle');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    if (store.files?.length) { setFiles(store.files); store.files = null; }
    else if (store.file) { setFiles([store.file]); store.file = null; }
    if (store.calc) {
      const { doc_type, direction, message } = store.calc;
      setForm(f => ({ ...f, doc_type: doc_type || f.doc_type, direction: direction || f.direction, message: message || f.message }));
      store.calc = null;
    }
    if (store.direction || store.docType) {
      setForm(f => ({ ...f, direction: store.direction || f.direction, doc_type: store.docType || f.doc_type }));
      store.direction = null; store.docType = null;
    }
  }, []);

  const upd = (k,v) => setForm(f=>({ ...f, [k]:v }));
  const addFiles = (list) => setFiles(prev => [...prev, ...Array.from(list||[])]);
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx)=>idx!==i));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setState('sending');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f));
      const res = await fetch(`${API}/orders`, { method:'POST', body: fd });
      if (!res.ok) throw new Error('bad');
      const d = await res.json();
      setCode(d.code || String(d.id || '').slice(0, 8));
      setState('success'); setForm({ name:'', email:'', phone:'', direction:'ua-de', doc_type:'', message:'' }); setFiles([]);
    } catch { setState('error'); }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {}
  };

  const inputStyle = { width:'100%', padding:'1rem 1.1rem', border:'1px solid var(--line)', borderRadius:10, background:'var(--card)', fontFamily:'var(--font-body)', fontSize:'1rem', color:'var(--ink)' };
  const label = { display:'block', marginBottom:'.5rem', fontFamily:'var(--font-mono)', fontSize:'.7rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-soft)' };

  return (
    <div>
      <section style={{ padding:'clamp(9rem,14vw,12rem) 0 3rem' }}><div className="container">
        <Reveal><div className="eyebrow mono" style={{ marginBottom:'1.5rem' }}>{t('nav.order')}</div></Reveal>
        <RevealHeading as="h1" text={t('orderPage.title')} style={{ fontSize:'clamp(2.4rem,6vw,5rem)' }} />
        <Reveal delay={0.1}><p style={{ color:'var(--ink-soft)', maxWidth:600, marginTop:'1.5rem', fontSize:'1.1rem' }}>{t('orderPage.intro')}</p></Reveal>
      </div></section>
      <section style={{ padding:'1rem 0 clamp(4rem,7vw,6rem)' }}><div className="container" style={{ maxWidth:820 }}>
        {state==='success' ? (
          <div className="order-success" data-testid="order-success">
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>✓</div>
            <h2 style={{ color:'var(--paper)', fontSize:'1.8rem', marginBottom:'1.4rem' }}>{t('orderPage.success')}</h2>
            <div className="order-success__code">
              <span className="mono order-success__label">{t('quick.codeLabel')}</span>
              <div className="order-success__row">
                <strong className="mono" data-testid="order-code">{code}</strong>
                <button type="button" className="mono order-success__copy" onClick={copyCode} data-testid="order-code-copy">
                  {copied ? t('quick.copied') : t('quick.copy')}
                </button>
              </div>
              <p className="order-success__hint">{t('quick.trackHint')}</p>
            </div>
          </div>
        ) : (
        <form onSubmit={submit} style={{ display:'grid', gap:'1.5rem' }}>
          <div className="form-2col">
            <div><label style={label}>{t('orderPage.name')} *</label><input style={inputStyle} value={form.name} onChange={e=>upd('name',e.target.value)} required /></div>
            <div><label style={label}>{t('orderPage.email')} *</label><input type="email" style={inputStyle} value={form.email} onChange={e=>upd('email',e.target.value)} required /></div>
          </div>
          <div className="form-2col">
            <div><label style={label}>{t('orderPage.phone')}</label><input style={inputStyle} value={form.phone} onChange={e=>upd('phone',e.target.value)} /></div>
            <div><label style={label}>{t('orderPage.direction')}</label>
              <Select
                value={form.direction}
                options={DIRECTIONS.map(k => ({ value: k, label: t(`calc.dirs.${k}`), meta: DIR_SHORT[k] }))}
                onChange={v => upd('direction', v)}
                testId="order-direction"
                ariaLabel={t('orderPage.direction')}
              />
            </div>
          </div>
          <div><label style={label}>{t('orderPage.docType')}</label><input style={inputStyle} placeholder={t('orderPage.docTypePlaceholder')} value={form.doc_type} onChange={e=>upd('doc_type',e.target.value)} /></div>
          <div><label style={label}>{t('orderPage.message')}</label><textarea rows={4} style={{ ...inputStyle, resize:'vertical' }} value={form.message} onChange={e=>upd('message',e.target.value)} /></div>
          <div>
            <label style={label}>{t('orderPage.files')}</label>
            <div onClick={()=>input.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}}
              data-cursor data-testid="order-dropzone" style={{ border:`1.5px dashed ${drag?'var(--accent)':'var(--line)'}`, borderRadius:12, padding:'2rem', textAlign:'center', cursor:'pointer', background:drag?'rgba(57,70,61,.06)':'var(--card)', transition:'all .3s' }}>
              <div style={{ fontSize:'1.6rem', color:'var(--accent)', marginBottom:'.5rem' }}>↑</div>
              <div style={{ fontFamily:'var(--font-head)' }}>{t('orderPage.drop')}</div>
              <div className="mono" style={{ color:'var(--ink-soft)', opacity:.7, marginTop:'.4rem' }}>{t('orderPage.hint')}</div>
              <input ref={input} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.txt" onChange={e=>{addFiles(e.target.files); e.target.value='';}} data-testid="order-file-input" />
            </div>
            {files.length>0 && <div style={{ marginTop:'1rem', display:'grid', gap:'.5rem' }} data-testid="order-files-list">
              {files.map((f,i)=>(<div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.7rem 1rem', background:'var(--card)', border:'1px solid var(--line)', borderRadius:8 }}>
                <span className="mono" style={{ fontSize:'.8rem' }}>{f.name}</span>
                <button type="button" onClick={()=>removeFile(i)} style={{ color:'#b1503f' }} aria-label="видалити">✕</button>
              </div>))}
            </div>}
          </div>
          {state==='error' && <p style={{ color:'#b1503f' }}>{t('orderPage.error')}</p>}
          <button className="btn btn-primary" type="submit" disabled={state==='sending'} style={{ justifyContent:'center', padding:'1.1rem' }} data-testid="order-submit">
            <span className="dot" />{state==='sending' ? t('orderPage.sending') : t('orderPage.submit')}
          </button>
        </form>
        )}
      </div></section>
      <TrackSection />
      <div style={{ height: 'clamp(4rem,7vw,6rem)' }} />
    </div>
  );
}
