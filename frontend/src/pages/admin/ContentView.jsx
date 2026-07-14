import { useState, useEffect, useCallback } from 'react';
import { adminApi } from './adminApi';
import { deepMerge, refreshContent } from '../../lib/contentStore';
import { uk as ukC, de as deC, en as enC } from '../../content';
import uaL from '../../locales/ua';
import deL from '../../locales/de';
import enL from '../../locales/en';

const LANGS = [
  { code: 'ua', label: 'UA' },
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
];

const clone = (o) => JSON.parse(JSON.stringify(o));

// Built-in defaults per language ({content, locale}); manuscript.sample is structural (not editable)
function baseFor(lang) {
  const content = clone({ ua: ukC, de: deC, en: enC }[lang]);
  if (content.manuscript) delete content.manuscript.sample;
  const locale = clone({ ua: uaL, de: deL, en: enL }[lang]);
  return { content, locale };
}

const getDeep = (obj, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);
function setDeep(obj, path, value) {
  const keys = path.split('.');
  const root = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const nxt = cur[k];
    cur[k] = Array.isArray(nxt) ? [...nxt] : { ...(nxt || {}) };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return root;
}

/*
 * SCHEMA: every editable block of the public site.
 * Field types: text | area | strings (array of strings) | list (array of objects) | pairs (array of [a,b])
 */
const SCHEMA = [
  {
    id: 'brand', title: 'Бренд і навігація', hint: 'Назва в шапці, підписи, пункти меню',
    fields: [
      ['text', 'content.brand.name', 'Назва бренду'],
      ['text', 'content.brand.line1', 'Підпис у шапці (рядок 1)'],
      ['text', 'content.brand.line2', 'Підпис у шапці (мови)'],
      ['text', 'content.nav.about', 'Меню: Про мене'],
      ['text', 'content.nav.services', 'Меню: Послуги'],
      ['text', 'content.nav.work', 'Меню: Приклади'],
      ['text', 'content.nav.contact', 'Меню: Контакти'],
      ['text', 'content.nav.order', 'Кнопка: Замовити переклад'],
    ],
  },
  {
    id: 'hero', title: 'Hero — перший екран',
    fields: [
      ['text', 'content.hero.role', 'Роль (кікер над імʼям)'],
      ['area', 'content.hero.lead', 'Лід-абзац'],
      ['text', 'content.hero.note', 'Примітка (моно-рядок)'],
      ['text', 'content.hero.ctaPrimary', 'Основна кнопка'],
      ['text', 'content.hero.ctaSecondary', 'Другорядна кнопка'],
    ],
  },
  {
    id: 'expertise', title: 'Спеціалізація',
    fields: [
      ['text', 'content.expertise.kicker', 'Кікер секції'],
      ['list', 'content.expertise.items', 'Напрями', [['term', 'Назва', 'text'], ['note', 'Пояснення', 'text']]],
    ],
  },
  {
    id: 'pricing', title: 'Вартість — блок на головній', hint: 'Самі ціни/типи документів — у розділі «Ціни»',
    fields: [
      ['text', 'content.pricing.kicker', 'Кікер'],
      ['text', 'content.pricing.title', 'Заголовок'],
      ['area', 'content.pricing.lead', 'Підзаголовок'],
      ['text', 'content.pricing.heroHint', 'Хінт у Hero (від 35 € …)'],
      ['text', 'content.pricing.expLink', 'Лінк «Розрахувати вартість…»'],
    ],
  },
  {
    id: 'manuscript', title: 'Головне доказове (рукопис)', hint: 'Демо-фрагмент рукопису — структурний, не редагується',
    fields: [
      ['text', 'content.manuscript.kicker', 'Кікер'],
      ['text', 'content.manuscript.title', 'Заголовок'],
      ['text', 'content.manuscript.sampleLabel', 'Підпис фрагмента'],
      ['text', 'content.manuscript.labels.original', 'Мітка 01 — оригінал'],
      ['text', 'content.manuscript.labels.transcription', 'Мітка 02 — розшифровка'],
      ['text', 'content.manuscript.labels.translation', 'Мітка 03 — переклад'],
      ['text', 'content.manuscript.notesTitle', 'Заголовок приміток'],
      ['strings', 'content.manuscript.notes', 'Примітки перекладача'],
      ['area', 'content.manuscript.reviewNote', 'Дисклеймер під фрагментом'],
      ['text', 'content.manuscript.enNote', 'Чіп про англійську (EN)'],
    ],
  },
  {
    id: 'person', title: 'Про мене — сцена на головній',
    fields: [
      ['text', 'content.person.kicker', 'Кікер'],
      ['text', 'content.person.name', 'Імʼя'],
      ['strings', 'content.person.paragraphs', 'Абзаци'],
      ['area', 'content.person.principle', 'Принцип (цитата)'],
      ['text', 'content.person.annotation', 'Редакторська позначка'],
    ],
  },
  {
    id: 'method', title: 'Як я працюю',
    fields: [
      ['text', 'content.method.kicker', 'Кікер'],
      ['text', 'content.method.title', 'Заголовок'],
      ['list', 'content.method.steps', 'Кроки', [['n', '№', 'text'], ['t', 'Назва', 'text'], ['d', 'Опис', 'area']]],
    ],
  },
  {
    id: 'contactScene', title: 'Фінальний блок замовлення (футер)',
    fields: [
      ['text', 'content.contact.kicker', 'Кікер'],
      ['area', 'content.contact.title', 'Заголовок'],
      ['text', 'content.contact.cta', 'Кнопка'],
      ['text', 'content.contact.rights', 'Права (копірайт)'],
      ['text', 'content.contact.privacy', 'Лінк конфіденційності'],
    ],
  },
  {
    id: 'leadCta', title: 'CTA-стрічки (між секціями)',
    fields: ['proof', 'method', 'services', 'about'].flatMap((k, i) => [
      ['text', `content.leadCta.${k}.kicker`, `Стрічка ${i + 1} · кікер`],
      ['text', `content.leadCta.${k}.title`, `Стрічка ${i + 1} · заголовок`],
      ['area', `content.leadCta.${k}.text`, `Стрічка ${i + 1} · текст`],
      ['text', `content.leadCta.${k}.primary`, `Стрічка ${i + 1} · основна кнопка`],
      ['text', `content.leadCta.${k}.ghost`, `Стрічка ${i + 1} · друга кнопка`],
    ]),
  },
  {
    id: 'servicesPage', title: 'Сторінка «Послуги»',
    fields: [
      ['text', 'locale.servicesPage.title', 'Заголовок сторінки'],
      ['area', 'locale.servicesPage.intro', 'Вступ'],
      ['text', 'locale.services.kicker', 'Кікер списку'],
      ['text', 'locale.services.title', 'Заголовок списку'],
      ['pairs', 'locale.services.items', 'Послуги', ['Назва', 'Опис']],
      ['text', 'locale.services.all', 'Кнопка «Усі послуги»'],
    ],
  },
  {
    id: 'aboutPage', title: 'Сторінка «Про мене»',
    fields: [
      ['text', 'locale.aboutPage.title', 'Заголовок сторінки'],
      ['area', 'locale.aboutPage.intro', 'Вступ'],
      ['text', 'locale.about.kicker', 'Кікер'],
      ['text', 'locale.about.title', 'Заголовок блоку'],
      ['area', 'locale.about.p1', 'Абзац 1'],
      ['area', 'locale.about.p2', 'Абзац 2'],
      ['text', 'locale.about.cta', 'Кнопка'],
    ],
  },
  {
    id: 'workPage', title: 'Сторінка «Приклади»', hint: 'Самі приклади робіт — у розділі «Приклади»',
    fields: [
      ['text', 'locale.workPage.title', 'Заголовок сторінки'],
      ['area', 'locale.workPage.intro', 'Вступ'],
    ],
  },
  {
    id: 'contactPage', title: 'Сторінка «Контакти»',
    fields: [
      ['text', 'locale.contactPage.title', 'Заголовок'],
      ['area', 'locale.contactPage.intro', 'Вступ'],
      ['text', 'locale.contactPage.name', 'Поле: імʼя'],
      ['text', 'locale.contactPage.email', 'Поле: email'],
      ['text', 'locale.contactPage.message', 'Поле: повідомлення'],
      ['text', 'locale.contactPage.send', 'Кнопка надсилання'],
      ['text', 'locale.contactPage.sent', 'Повідомлення про успіх'],
    ],
  },
  {
    id: 'orderPage', title: 'Сторінка «Замовити переклад»',
    fields: [
      ['text', 'locale.orderPage.title', 'Заголовок'],
      ['area', 'locale.orderPage.intro', 'Вступ'],
      ['text', 'locale.orderPage.name', 'Поле: імʼя'],
      ['text', 'locale.orderPage.email', 'Поле: email'],
      ['text', 'locale.orderPage.phone', 'Поле: телефон'],
      ['text', 'locale.orderPage.direction', 'Поле: напрям'],
      ['text', 'locale.orderPage.docType', 'Поле: тип документа'],
      ['text', 'locale.orderPage.docTypePlaceholder', 'Плейсхолдер типу документа'],
      ['text', 'locale.orderPage.message', 'Поле: коментар'],
      ['text', 'locale.orderPage.files', 'Поле: документи'],
      ['text', 'locale.orderPage.drop', 'Зона перетягування'],
      ['text', 'locale.orderPage.hint', 'Хінт про формати'],
      ['text', 'locale.orderPage.submit', 'Кнопка'],
      ['text', 'locale.orderPage.sending', 'Стан надсилання'],
      ['area', 'locale.orderPage.success', 'Повідомлення про успіх'],
      ['text', 'locale.orderPage.error', 'Повідомлення про помилку'],
    ],
  },
  {
    id: 'sections', title: 'Заголовки секцій (FAQ, відгуки, цифри)', hint: 'Питання FAQ — у «Налаштуваннях», відгуки — у «Відгуках»',
    fields: [
      ['text', 'locale.faqSec.kicker', 'FAQ · кікер'],
      ['text', 'locale.faqSec.title', 'FAQ · заголовок'],
      ['text', 'locale.reviewsSec.kicker', 'Відгуки · кікер'],
      ['text', 'locale.reviewsSec.title', 'Відгуки · заголовок'],
      ['text', 'locale.trustBand.kicker', 'Цифри · кікер'],
      ['text', 'locale.trustBand.years', 'Цифри · років досвіду'],
      ['text', 'locale.trustBand.docs', 'Цифри · документів'],
      ['text', 'locale.trustBand.response', 'Цифри · час відповіді'],
    ],
  },
  {
    id: 'calc', title: 'Калькулятор вартості',
    fields: [
      ['text', 'locale.calc.docType', 'Тип документа'],
      ['text', 'locale.calc.pages', 'Сторінок'],
      ['text', 'locale.calc.direction', 'Напрям'],
      ['text', 'locale.calc.urgent', 'Терміново'],
      ['text', 'locale.calc.certified', 'Засвідчений переклад'],
      ['text', 'locale.calc.certifiedHint', 'Хінт засвідчення'],
      ['text', 'locale.calc.prepay', 'Оплата одразу'],
      ['text', 'locale.calc.prepayHint', 'Хінт передоплати'],
      ['text', 'locale.calc.prepayBadge', 'Бейдж «Вигідно»'],
      ['text', 'locale.calc.receipt', 'Заголовок чека'],
      ['text', 'locale.calc.extraPages', 'Дод. сторінки'],
      ['text', 'locale.calc.discountVolume', 'Знижка за обсяг'],
      ['text', 'locale.calc.discountPrepay', 'Знижка за передоплату'],
      ['text', 'locale.calc.certLine', 'Рядок засвідчення в чеку'],
      ['text', 'locale.calc.total', 'РАЗОМ'],
      ['text', 'locale.calc.from', 'від'],
      ['text', 'locale.calc.youSave', 'Ви заощаджуєте'],
      ['text', 'locale.calc.nudge', 'Апселл ({{n}}, {{pct}})'],
      ['text', 'locale.calc.promo', 'Промо-лейбл'],
      ['text', 'locale.calc.promoVolume', 'Промо-чип обсягу ({{n}}, {{pct}})'],
      ['text', 'locale.calc.promoPrepay', 'Промо-чип передоплати ({{pct}})'],
      ['text', 'locale.calc.order', 'Кнопка «Замовити»'],
      ['text', 'locale.calc.leadTitle', 'Заголовок кроку контактів'],
      ['text', 'locale.calc.leadName', 'Поле: імʼя'],
      ['text', 'locale.calc.leadContact', 'Поле: телефон або email'],
      ['text', 'locale.calc.leadSubmit', 'Кнопка надсилання'],
      ['text', 'locale.calc.fullForm', 'Лінк на повну форму'],
      ['text', 'locale.calc.sending', 'Стан надсилання'],
      ['area', 'locale.calc.sent', 'Повідомлення про успіх'],
      ['text', 'locale.calc.error', 'Повідомлення про помилку'],
      ['text', 'locale.calc.dirs.ua-de', 'Напрям UA→DE'],
      ['text', 'locale.calc.dirs.de-ua', 'Напрям DE→UA'],
      ['text', 'locale.calc.dirs.ua-en', 'Напрям UA→EN'],
      ['text', 'locale.calc.dirs.en-ua', 'Напрям EN→UA'],
      ['text', 'locale.calc.dirs.de-en', 'Напрям DE→EN'],
      ['text', 'locale.calc.dirs.en-de', 'Напрям EN→DE'],
    ],
  },
  {
    id: 'quick', title: 'Швидка заявка (модалка, віджет, бокова панель)',
    fields: [
      ['text', 'locale.quick.modalTitle', 'Заголовок модалки'],
      ['area', 'locale.quick.modalSub', 'Підзаголовок модалки'],
      ['text', 'locale.quick.name', 'Поле: імʼя'],
      ['text', 'locale.quick.contact', 'Поле: телефон або email'],
      ['text', 'locale.quick.contactPlaceholder', 'Плейсхолдер контакту'],
      ['text', 'locale.quick.direction', 'Поле: напрям'],
      ['text', 'locale.quick.docType', 'Поле: тип документа'],
      ['text', 'locale.quick.message', 'Поле: коментар'],
      ['text', 'locale.quick.files', 'Поле: документи'],
      ['text', 'locale.quick.drop', 'Зона перетягування'],
      ['text', 'locale.quick.submit', 'Кнопка'],
      ['area', 'locale.quick.success', 'Повідомлення про успіх'],
      ['text', 'locale.quick.codeLabel', 'Підпис коду замовлення'],
      ['text', 'locale.quick.copy', 'Кнопка «Копіювати»'],
      ['text', 'locale.quick.copied', '«Скопійовано»'],
      ['area', 'locale.quick.trackHint', 'Хінт про трекінг'],
      ['text', 'locale.quick.fullForm', 'Лінк на повну форму'],
      ['text', 'locale.quick.tabFaq', 'Вкладка віджета: Питання'],
      ['text', 'locale.quick.tabCalc', 'Вкладка віджета: Вартість'],
      ['text', 'locale.quick.tabOrder', 'Вкладка віджета: Заявка'],
    ],
  },
  {
    id: 'track', title: 'Перевірка статусу замовлення',
    fields: [
      ['text', 'locale.track.kicker', 'Кікер'],
      ['text', 'locale.track.title', 'Заголовок'],
      ['area', 'locale.track.intro', 'Вступ'],
      ['text', 'locale.track.code', 'Поле: код'],
      ['text', 'locale.track.email', 'Поле: email'],
      ['text', 'locale.track.submit', 'Кнопка'],
      ['text', 'locale.track.checking', 'Стан перевірки'],
      ['text', 'locale.track.current', 'Поточний статус'],
      ['text', 'locale.track.notFound', 'Не знайдено'],
      ['text', 'locale.track.statuses.new', 'Статус: отримано'],
      ['text', 'locale.track.statuses.in_progress', 'Статус: у роботі'],
      ['text', 'locale.track.statuses.done', 'Статус: виконано'],
      ['text', 'locale.track.statuses.declined', 'Статус: відхилено'],
    ],
  },
  {
    id: 'legalCookie', title: 'Правові лінки та кукі-банер', hint: 'Тексти самих документів — у розділі «Правові тексти»',
    fields: [
      ['text', 'locale.legal.terms', 'Лінк: умови користування'],
      ['text', 'locale.legal.privacy', 'Лінк: конфіденційність'],
      ['text', 'locale.legal.cookies', 'Лінк: cookies'],
      ['text', 'locale.legal.updated', '«Оновлено»'],
      ['text', 'locale.legal.back', '«На головну»'],
      ['text', 'locale.legal.other', '«Інші документи»'],
      ['area', 'locale.cookie.text', 'Текст кукі-банера'],
      ['text', 'locale.cookie.accept', 'Кнопка «Прийняти»'],
      ['text', 'locale.cookie.decline', 'Кнопка «Відхилити»'],
      ['text', 'locale.cookie.more', 'Лінк «Детальніше»'],
    ],
  },
];

function Field({ type, path, label, value, onChange, itemSchema, pairLabels, testid }) {
  if (type === 'text') {
    return (
      <div className="adm-field">
        <label className="adm-label mono">{label}</label>
        <input className="adm-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} data-testid={testid} />
      </div>
    );
  }
  if (type === 'area') {
    return (
      <div className="adm-field">
        <label className="adm-label mono">{label}</label>
        <textarea className="adm-input" rows={3} style={{ resize: 'vertical' }} value={value ?? ''} onChange={(e) => onChange(e.target.value)} data-testid={testid} />
      </div>
    );
  }
  if (type === 'strings') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="adm-field">
        <label className="adm-label mono">{label}</label>
        <div style={{ display: 'grid', gap: '.55rem' }}>
          {arr.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
              <textarea className="adm-input" rows={2} style={{ resize: 'vertical', flex: 1 }} value={s} onChange={(e) => { const n = [...arr]; n[i] = e.target.value; onChange(n); }} data-testid={`${testid}-${i}`} />
              <button className="adm-mini adm-mini--danger" onClick={() => onChange(arr.filter((_, j) => j !== i))} aria-label="видалити" title="Видалити">✕</button>
            </div>
          ))}
          <button className="adm-btn-ghost mono" style={{ justifySelf: 'start' }} onClick={() => onChange([...arr, ''])}>+ Додати</button>
        </div>
      </div>
    );
  }
  if (type === 'list') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="adm-field">
        <label className="adm-label mono">{label}</label>
        <div style={{ display: 'grid', gap: '.8rem' }}>
          {arr.map((item, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '.8rem .9rem', display: 'grid', gap: '.55rem', position: 'relative' }}>
              {itemSchema.map(([k, lbl, ft]) => (
                ft === 'area' ? (
                  <textarea key={k} className="adm-input" rows={2} style={{ resize: 'vertical' }} placeholder={lbl} value={item?.[k] ?? ''}
                    onChange={(e) => { const n = [...arr]; n[i] = { ...n[i], [k]: e.target.value }; onChange(n); }} data-testid={`${testid}-${i}-${k}`} />
                ) : (
                  <input key={k} className="adm-input" placeholder={lbl} value={item?.[k] ?? ''}
                    onChange={(e) => { const n = [...arr]; n[i] = { ...n[i], [k]: e.target.value }; onChange(n); }} data-testid={`${testid}-${i}-${k}`} />
                )
              ))}
              <button className="adm-mini adm-mini--danger" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => onChange(arr.filter((_, j) => j !== i))} aria-label="видалити" title="Видалити">✕</button>
            </div>
          ))}
          <button className="adm-btn-ghost mono" style={{ justifySelf: 'start' }} onClick={() => onChange([...arr, Object.fromEntries(itemSchema.map(([k]) => [k, '']))])}>+ Додати</button>
        </div>
      </div>
    );
  }
  if (type === 'pairs') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="adm-field">
        <label className="adm-label mono">{label}</label>
        <div style={{ display: 'grid', gap: '.8rem' }}>
          {arr.map((pair, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '.8rem .9rem', display: 'grid', gap: '.55rem', position: 'relative' }}>
              <input className="adm-input" placeholder={pairLabels[0]} value={pair?.[0] ?? ''}
                onChange={(e) => { const n = arr.map((p) => [...p]); n[i][0] = e.target.value; onChange(n); }} data-testid={`${testid}-${i}-0`} />
              <textarea className="adm-input" rows={2} style={{ resize: 'vertical' }} placeholder={pairLabels[1]} value={pair?.[1] ?? ''}
                onChange={(e) => { const n = arr.map((p) => [...p]); n[i][1] = e.target.value; onChange(n); }} data-testid={`${testid}-${i}-1`} />
              <button className="adm-mini adm-mini--danger" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => onChange(arr.filter((_, j) => j !== i))} aria-label="видалити" title="Видалити">✕</button>
            </div>
          ))}
          <button className="adm-btn-ghost mono" style={{ justifySelf: 'start' }} onClick={() => onChange([...arr.map((p) => [...p]), ['', '']])}>+ Додати</button>
        </div>
      </div>
    );
  }
  return null;
}

export default function ContentView() {
  const [lang, setLang] = useState('ua');
  const [data, setData] = useState(null); // { ua: {content, locale}, ... }
  const [openSec, setOpenSec] = useState('hero');
  const [saveState, setSaveState] = useState('idle');

  const load = useCallback(async () => {
    let overrides = {};
    try { overrides = await adminApi.content(); } catch {}
    const next = {};
    LANGS.forEach(({ code }) => {
      const base = baseFor(code);
      const ov = overrides?.[code] || {};
      next[code] = {
        content: deepMerge(base.content, ov.content || {}),
        locale: deepMerge(base.locale, ov.locale || {}),
      };
    });
    setData(next);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return <p style={{ color: 'var(--ink-soft)' }}>Завантаження…</p>;

  const cur = data[lang];

  const updField = (path, value) => {
    setSaveState('idle');
    setData((prev) => ({ ...prev, [lang]: setDeep(prev[lang], path, value) }));
  };

  const save = async () => {
    setSaveState('saving');
    try {
      await adminApi.saveContent(lang, { content: cur.content, locale: cur.locale });
      await refreshContent(); // live-update the public site
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2500);
    } catch { setSaveState('error'); }
  };

  const reset = async () => {
    if (!window.confirm(`Скинути ${lang.toUpperCase()}-версію до стандартних текстів? Ваші правки цієї мови буде втрачено.`)) return;
    setSaveState('saving');
    try {
      await adminApi.resetContent(lang);
      await refreshContent();
      const base = baseFor(lang);
      setData((prev) => ({ ...prev, [lang]: base }));
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2500);
    } catch { setSaveState('error'); }
  };

  return (
    <div data-testid="admin-content-view">
      <p style={{ color: 'var(--ink-soft)', maxWidth: 760, marginBottom: '1.3rem', lineHeight: 1.65 }}>
        Усі тексти сайту трьома мовами. Оберіть мову, розгорніть блок, відредагуйте та збережіть — зміни зʼявляються на сайті одразу.
        Ціни, приклади робіт, відгуки, FAQ і правові тексти редагуються у своїх розділах.
      </p>

      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {LANGS.map((l) => (
          <button key={l.code} data-testid={`content-lang-${l.code}`} onClick={() => { setLang(l.code); setSaveState('idle'); }} className="mono"
            style={{ padding: '.5rem 1.1rem', borderRadius: 100, border: '1px solid var(--line)', cursor: 'pointer', fontSize: '.72rem', letterSpacing: '.08em',
              background: lang === l.code ? 'var(--ink)' : 'transparent', color: lang === l.code ? 'var(--paper)' : 'var(--ink)' }}>
            {l.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.9rem', alignItems: 'center' }}>
          {saveState === 'saved' && <span data-testid="content-saved-msg" className="mono" style={{ color: 'var(--accent)', fontSize: '.72rem', letterSpacing: '.08em' }}>✓ Збережено</span>}
          {saveState === 'error' && <span data-testid="content-error-msg" style={{ color: '#b1503f', fontSize: '.85rem' }}>Помилка збереження</span>}
          <button className="adm-btn-ghost mono" onClick={reset} data-testid="content-reset" title="Повернути стандартні тексти цієї мови">↺ Скинути {lang.toUpperCase()}</button>
          <button className="btn btn-primary" onClick={save} disabled={saveState === 'saving'} data-testid="content-save" style={{ padding: '.75rem 1.6rem' }}>
            <span className="dot" />{saveState === 'saving' ? 'Збереження…' : `Зберегти ${lang.toUpperCase()}`}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '.7rem', maxWidth: 980 }}>
        {SCHEMA.map((sec) => {
          const open = openSec === sec.id;
          return (
            <div key={sec.id} style={{ border: '1px solid var(--line)', borderRadius: 12, background: open ? 'var(--card, #FCFAF5)' : 'transparent', overflow: 'hidden' }}>
              <button onClick={() => setOpenSec(open ? '' : sec.id)} data-testid={`content-sec-${sec.id}`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.9rem', padding: '1rem 1.2rem', cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}>
                <span className="mono" style={{ fontSize: '.66rem', color: 'var(--accent-2)', letterSpacing: '.14em' }}>{open ? '▾' : '▸'}</span>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.05rem', fontWeight: 600 }}>{sec.title}</span>
                {sec.hint && <span className="mono" style={{ marginLeft: 'auto', fontSize: '.6rem', color: 'var(--ink-soft)', opacity: .7, letterSpacing: '.05em' }}>{sec.hint}</span>}
              </button>
              {open && (
                <div style={{ padding: '0 1.2rem 1.3rem', display: 'grid', gap: '1rem' }}>
                  {sec.fields.map(([type, path, label, extra]) => (
                    <Field key={path} type={type} path={path} label={label}
                      value={getDeep(cur, path)}
                      onChange={(v) => updField(path, v)}
                      itemSchema={type === 'list' ? extra : undefined}
                      pairLabels={type === 'pairs' ? extra : undefined}
                      testid={`content-f-${path.replace(/\./g, '-')}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 980, marginTop: '1.4rem' }}>
        <button className="btn btn-primary" onClick={save} disabled={saveState === 'saving'} data-testid="content-save-bottom" style={{ padding: '.85rem 1.8rem' }}>
          <span className="dot" />{saveState === 'saving' ? 'Збереження…' : `Зберегти ${lang.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
