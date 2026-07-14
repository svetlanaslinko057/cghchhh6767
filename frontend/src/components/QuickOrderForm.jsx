import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Select from './Select';
import { DIRECTIONS, DIR_SHORT } from '../lib/directions';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.txt';

/*
 * Quick order form: submits DIRECTLY to /api/orders (multipart, multiple files).
 * The request lands in admin «Заявки» immediately — no redirect to other forms.
 * Fast-lead concept: only name + ONE contact field (phone or email) are required.
 * Used inside OrderModal (all CTAs), SideSheet (hero quick request) and LeadWidget «Заявка» tab.
 */
export default function QuickOrderForm({ testPrefix = 'qform', initialDirection = 'ua-de', initialDocType = '', origin = '', onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', contact: '', direction: initialDirection, doc_type: initialDocType, message: '' });
  const [files, setFiles] = useState([]);
  const [state, setState] = useState('idle');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addFiles = (list) => setFiles((prev) => [...prev, ...Array.from(list || [])]);
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    const contact = form.contact.trim();
    if (!form.name.trim() || !contact) return;
    setState('sending');
    try {
      const isEmail = contact.includes('@');
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', isEmail ? contact : '');
      fd.append('phone', isEmail ? '' : contact);
      fd.append('direction', form.direction);
      fd.append('doc_type', form.doc_type);
      fd.append('message', origin ? `[${origin}]${form.message ? ' ' + form.message : ''}` : form.message);
      files.forEach((f) => fd.append('files', f));
      const res = await fetch(`${API}/orders`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('bad');
      const d = await res.json();
      setCode(d.code || String(d.id || '').slice(0, 8));
      setState('success');
      onSuccess?.(d);
    } catch {
      setState('error');
    }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {}
  };

  if (state === 'success') {
    return (
      <div className="qform-sent" data-testid={`${testPrefix}-success`}>
        <span className="qform-sent__check">✓</span>
        <p className="qform-sent__t">{t('quick.success')}</p>
        <div className="qform-code">
          <span className="mono qform-code__label">{t('quick.codeLabel')}</span>
          <div className="qform-code__row">
            <strong className="mono qform-code__val" data-testid={`${testPrefix}-code`}>{code}</strong>
            <button type="button" className="qform-code__copy mono" onClick={copyCode} data-testid={`${testPrefix}-copy`}>
              {copied ? t('quick.copied') : t('quick.copy')}
            </button>
          </div>
        </div>
        <p className="qform-sent__hint">{t('quick.trackHint')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="qform" data-testid={`${testPrefix}-form`}>
      <div className="qform-row">
        <div className="qform-field">
          <label className="mono qform-label">{t('quick.name')} *</label>
          <input className="calc-input" value={form.name} onChange={(e) => upd('name', e.target.value)} required data-testid={`${testPrefix}-name`} />
        </div>
        <div className="qform-field">
          <label className="mono qform-label">{t('quick.contact')} *</label>
          <input className="calc-input" value={form.contact} onChange={(e) => upd('contact', e.target.value)} placeholder={t('quick.contactPlaceholder')} required data-testid={`${testPrefix}-contact`} />
        </div>
      </div>
      <div className="qform-row">
        <div className="qform-field">
          <label className="mono qform-label">{t('quick.docType')}</label>
          <input className="calc-input" value={form.doc_type} onChange={(e) => upd('doc_type', e.target.value)} placeholder={t('orderPage.docTypePlaceholder')} data-testid={`${testPrefix}-doctype`} />
        </div>
        <div className="qform-field">
          <label className="mono qform-label">{t('quick.direction')}</label>
          <Select
            value={form.direction}
            options={DIRECTIONS.map((k) => ({ value: k, label: t(`calc.dirs.${k}`), meta: DIR_SHORT[k] }))}
            onChange={(v) => upd('direction', v)}
            testId={`${testPrefix}-direction`}
            ariaLabel={t('quick.direction')}
          />
        </div>
      </div>
      <div className="qform-field">
        <label className="mono qform-label">{t('quick.message')}</label>
        <textarea className="calc-input" rows={2} value={form.message} onChange={(e) => upd('message', e.target.value)} data-testid={`${testPrefix}-message`} />
      </div>
      <div className="qform-field">
        <label className="mono qform-label">{t('quick.files')}</label>
        <div
          className={`qform-drop${drag ? ' is-drag' : ''}`}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          data-testid={`${testPrefix}-drop`}
        >
          <span className="qform-drop__arrow">↑</span>
          <span>{t('quick.drop')}</span>
          <span className="mono qform-drop__hint">{t('orderPage.hint')}</span>
          <input ref={input} type="file" multiple hidden accept={ACCEPT} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} data-testid={`${testPrefix}-file-input`} />
        </div>
        {files.length > 0 && (
          <div className="qform-files" data-testid={`${testPrefix}-files`}>
            {files.map((f, i) => (
              <span key={i} className="qform-file mono">
                {f.name}
                <button type="button" onClick={() => removeFile(i)} aria-label="видалити файл" data-testid={`${testPrefix}-file-remove-${i}`}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>
      {state === 'error' && <p className="qform-err" data-testid={`${testPrefix}-error`}>{t('orderPage.error')}</p>}
      <button className="btn btn-primary" type="submit" disabled={state === 'sending'} style={{ justifyContent: 'center', padding: '.95rem' }} data-testid={`${testPrefix}-submit`}>
        <span className="dot" />{state === 'sending' ? t('orderPage.sending') : t('quick.submit')}
      </button>
    </form>
  );
}
