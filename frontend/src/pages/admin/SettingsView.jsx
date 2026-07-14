import { useEffect, useState } from 'react';
import { adminApi } from './adminApi';
import { resolveMediaUrl } from '../../lib/settings';

const Field = ({ label, hint, ...props }) => (
  <div className="adm-field">
    <label className="adm-label mono">{label}</label>
    <input className="adm-input" {...props} />
    {hint && <span className="adm-hint mono">{hint}</span>}
  </div>
);

export default function SettingsView() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text}

  useEffect(() => { adminApi.getSettings().then(setS).catch(() => {}); }, []);

  const upd = (section, key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setS((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));
  };

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 6000); };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await adminApi.saveSettings({ site: s.site, contacts: s.contacts, notifications: s.notifications, widget: s.widget, trust: s.trust });
      setS(saved);
      flash('ok', 'Налаштування збережено');
    } catch (e) { flash('err', e.message); }
    setSaving(false);
  };

  const testEmail = async () => {
    setTesting(true);
    try {
      await adminApi.saveSettings({ site: s.site, contacts: s.contacts, notifications: s.notifications, widget: s.widget, trust: s.trust });
      const r = await adminApi.testEmail();
      flash('ok', `Тестовий лист надіслано (id: ${r.email_id || '—'})`);
    } catch (e) { flash('err', e.message); }
    setTesting(false);
  };

  const updFaq = (i, k, v) => setS((p) => {
    const faq = [...(p.widget.faq || [])]; faq[i] = { ...faq[i], [k]: v };
    return { ...p, widget: { ...p.widget, faq } };
  });
  const addFaq = () => setS((p) => ({ ...p, widget: { ...p.widget, faq: [...(p.widget.faq || []), { q: '', a: '' }] } }));
  const rmFaq = (i) => setS((p) => ({ ...p, widget: { ...p.widget, faq: (p.widget.faq || []).filter((_, j) => j !== i) } }));

  const uploadAboutImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await adminApi.uploadWorkImage(file);
      setS((p) => ({ ...p, site: { ...p.site, about_image: r.url } }));
      flash('ok', 'Зображення завантажено — не забудьте зберегти налаштування');
    } catch (err) { flash('err', err.message); }
    setUploading(false);
    e.target.value = '';
  };

  if (!s) return <p className="adm-empty">Завантаження…</p>;

  return (
    <div className="adm-settings" data-testid="settings-view">
      {msg && <div className={`adm-toast adm-toast--${msg.type}`} data-testid="settings-toast">{msg.text}</div>}

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">01</span>
          <div>
            <h2>Заголовки сайту</h2>
            <p>Порожнє поле — використовується стандартний текст сайту.</p>
          </div>
        </div>
        <div className="adm-grid">
          <Field label="Заголовок вкладки браузера" value={s.site.title} onChange={upd('site', 'title')} placeholder="Oksana Oliferenko — переклади UA ⇄ DE" data-testid="settings-site-title" />
          <Field label="Головний заголовок (Hero)" value={s.site.hero_title} onChange={upd('site', 'hero_title')} placeholder="Oksana Oliferenko" data-testid="settings-hero-title" />
          <div className="adm-field adm-field--full">
            <label className="adm-label mono">Підзаголовок (Hero)</label>
            <textarea className="adm-input" rows={3} value={s.site.hero_lead} onChange={upd('site', 'hero_lead')} placeholder="Юридичні, нотаріальні, офіційні та рукописні документи…" data-testid="settings-hero-lead" />
          </div>
          <div className="adm-field adm-field--full">
            <label className="adm-label mono">Зображення на сторінці «Про мене»</label>
            <div className="adm-imgrow">
              {s.site.about_image
                ? <img src={resolveMediaUrl(s.site.about_image)} alt="Про мене" className="adm-imgprev" data-testid="settings-about-image-preview" />
                : <div className="adm-imgprev adm-imgprev--empty mono">немає</div>}
              <div style={{ flex: 1, display: 'grid', gap: '.55rem' }}>
                <input className="adm-input" value={s.site.about_image || ''} onChange={upd('site', 'about_image')} placeholder="https://… або завантажте файл" data-testid="settings-about-image" />
                <label className="adm-btn-ghost mono adm-uploadbtn" data-testid="settings-about-image-upload">
                  {uploading ? 'Завантаження…' : '↑ Завантажити файл'}
                  <input type="file" accept="image/*" onChange={uploadAboutImage} data-testid="settings-about-image-file" />
                </label>
              </div>
            </div>
            <span className="adm-hint mono">Нейтральне зображення або портрет — показується у блоці на сторінці «Про мене». Порожнє поле — стандартне зображення.</span>
          </div>
        </div>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">02</span>
          <div>
            <h2>Контакти та соцмережі</h2>
            <p>Заповнені канали автоматично з'являться на сайті — у футері та на сторінці контактів.</p>
          </div>
        </div>
        <div className="adm-grid">
          <Field label="Email (публічний)" type="email" value={s.contacts.email} onChange={upd('contacts', 'email')} placeholder="hello@example.com" data-testid="settings-contact-email" />
          <Field label="Телефон" value={s.contacts.phone} onChange={upd('contacts', 'phone')} placeholder="+49 170 000 00 00" data-testid="settings-contact-phone" />
          <Field label="Telegram" value={s.contacts.telegram} onChange={upd('contacts', 'telegram')} placeholder="@username або посилання" data-testid="settings-contact-telegram" />
          <Field label="WhatsApp" value={s.contacts.whatsapp} onChange={upd('contacts', 'whatsapp')} placeholder="+49 170 000 00 00" data-testid="settings-contact-whatsapp" />
          <Field label="Viber" value={s.contacts.viber} onChange={upd('contacts', 'viber')} placeholder="+49 170 000 00 00" data-testid="settings-contact-viber" />
          <Field label="Instagram" value={s.contacts.instagram} onChange={upd('contacts', 'instagram')} placeholder="@username або посилання" data-testid="settings-contact-instagram" />
          <Field label="Facebook" value={s.contacts.facebook} onChange={upd('contacts', 'facebook')} placeholder="посилання на сторінку" data-testid="settings-contact-facebook" />
        </div>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">03</span>
          <div>
            <h2>Сповіщення на пошту (Resend)</h2>
            <p>Нові заявки та повідомлення пересилатимуться на вказану пошту через Resend.</p>
          </div>
        </div>
        <label className="adm-switch" data-testid="settings-notify-toggle">
          <input type="checkbox" checked={!!s.notifications.enabled} onChange={upd('notifications', 'enabled')} />
          <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
          <span className="mono">Пересилати заявки на пошту</span>
        </label>
        <div className="adm-grid" style={{ marginTop: '1.2rem' }}>
          <Field label="Resend API Key" type="password" value={s.notifications.resend_api_key} onChange={upd('notifications', 'resend_api_key')} placeholder="re_…" hint="resend.com → API Keys" data-testid="settings-resend-key" autoComplete="off" />
          <Field label="Пошта отримувача" type="email" value={s.notifications.recipient_email} onChange={upd('notifications', 'recipient_email')} placeholder="куди пересилати заявки" data-testid="settings-recipient-email" />
          <Field label="Відправник" value={s.notifications.sender_email} onChange={upd('notifications', 'sender_email')} placeholder="onboarding@resend.dev" hint="для власного домену — підтвердіть його в Resend" data-testid="settings-sender-email" />
        </div>
        <button className="adm-btn-ghost mono" onClick={testEmail} disabled={testing} data-testid="settings-test-email">
          {testing ? 'Надсилання…' : '→ Надіслати тестовий лист'}
        </button>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">04</span>
          <div>
            <h2>FAQ та віджет допомоги</h2>
            <p>Питання-відповіді показуються на головній, сторінці контактів та у плаваючому віджеті (одне джерело). Віджет також містить калькулятор і швидку заявку.</p>
          </div>
        </div>
        <label className="adm-switch" data-testid="settings-widget-toggle">
          <input type="checkbox" checked={!!s.widget?.enabled} onChange={(e) => setS((p) => ({ ...p, widget: { ...p.widget, enabled: e.target.checked } }))} />
          <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
          <span className="mono">Показувати віджет на сайті</span>
        </label>
        <div style={{ marginTop: '1.3rem', display: 'grid', gap: '1rem' }} data-testid="settings-widget-faq">
          {(s.widget?.faq || []).map((f, i) => (
            <div key={i} className="adm-faqrow">
              <div style={{ flex: 1, display: 'grid', gap: '.5rem' }}>
                <div className="mono" style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'var(--ink-soft)' }}>UA</div>
                <input className="adm-input" value={f.q || ''} onChange={(e) => updFaq(i, 'q', e.target.value)} placeholder="Питання (UA)" data-testid={`settings-faq-q-${i}`} />
                <textarea className="adm-input" rows={2} value={f.a || ''} onChange={(e) => updFaq(i, 'a', e.target.value)} placeholder="Відповідь (UA)" data-testid={`settings-faq-a-${i}`} />
                <div className="mono" style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'var(--ink-soft)', marginTop: '.3rem' }}>DE <span style={{ opacity: .6, textTransform: 'none', letterSpacing: 0 }}>· якщо порожньо — показується UA</span></div>
                <input className="adm-input" value={f.q_de || ''} onChange={(e) => updFaq(i, 'q_de', e.target.value)} placeholder="Frage (DE)" data-testid={`settings-faq-qde-${i}`} />
                <textarea className="adm-input" rows={2} value={f.a_de || ''} onChange={(e) => updFaq(i, 'a_de', e.target.value)} placeholder="Antwort (DE)" data-testid={`settings-faq-ade-${i}`} />
                <div className="mono" style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'var(--ink-soft)', marginTop: '.3rem' }}>EN <span style={{ opacity: .6, textTransform: 'none', letterSpacing: 0 }}>· якщо порожньо — показується UA</span></div>
                <input className="adm-input" value={f.q_en || ''} onChange={(e) => updFaq(i, 'q_en', e.target.value)} placeholder="Question (EN)" data-testid={`settings-faq-qen-${i}`} />
                <textarea className="adm-input" rows={2} value={f.a_en || ''} onChange={(e) => updFaq(i, 'a_en', e.target.value)} placeholder="Answer (EN)" data-testid={`settings-faq-aen-${i}`} />
              </div>
              <button className="adm-mini adm-mini--danger" onClick={() => rmFaq(i)} aria-label="видалити" data-testid={`settings-faq-remove-${i}`}>✕</button>
            </div>
          ))}
        </div>
        <button className="adm-btn-ghost mono" onClick={addFaq} data-testid="settings-faq-add">+ Додати питання</button>
      </section>

      <section className="adm-block">
        <div className="adm-block__head">
          <span className="mono adm-block__no">05</span>
          <div>
            <h2>Цифри довіри</h2>
            <p>Смуга статистики на головній сторінці. Порожні поля приховуються; якщо всі порожні — блок не показується.</p>
          </div>
        </div>
        <label className="adm-switch" data-testid="settings-trust-toggle">
          <input type="checkbox" checked={s.trust?.enabled !== false} onChange={(e) => setS((p) => ({ ...p, trust: { ...p.trust, enabled: e.target.checked } }))} />
          <span className="adm-switch__track"><span className="adm-switch__thumb" /></span>
          <span className="mono">Показувати блок на сайті</span>
        </label>
        <div className="adm-grid" style={{ marginTop: '1.2rem', gridTemplateColumns: '1fr 1fr 1fr' }}>
          <Field label="Років досвіду" type="number" min="0" value={s.trust?.years ?? ''} onChange={upd('trust', 'years')} placeholder="напр. 10" data-testid="settings-trust-years" />
          <Field label="Перекладених документів" type="number" min="0" value={s.trust?.docs_count ?? ''} onChange={upd('trust', 'docs_count')} placeholder="напр. 1500" data-testid="settings-trust-docs" />
          <Field label="Середня відповідь, год." type="number" min="0" value={s.trust?.response_hours ?? ''} onChange={upd('trust', 'response_hours')} placeholder="напр. 2" data-testid="settings-trust-response" />
        </div>
      </section>

      <div className="adm-savebar">
        <button className="btn btn-primary" onClick={save} disabled={saving} data-testid="settings-save" style={{ padding: '.9rem 1.8rem' }}>
          <span className="dot" />{saving ? 'Збереження…' : 'Зберегти налаштування'}
        </button>
      </div>
    </div>
  );
}
