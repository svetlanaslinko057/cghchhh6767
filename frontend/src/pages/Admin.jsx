import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Monogram } from '../components/Wordmark';
import { adminApi, getToken, setToken, clearToken } from './admin/adminApi';
import DashboardView from './admin/DashboardView';
import OrdersView from './admin/OrdersView';
import ContactsView from './admin/ContactsView';
import ReviewsView from './admin/ReviewsView';
import WorkView from './admin/WorkView';
import PricingView from './admin/PricingView';
import SettingsView from './admin/SettingsView';
import LegalView from './admin/LegalView';
import ContentView from './admin/ContentView';

const NAV = [
  { key: 'dashboard', no: '01', label: 'Огляд' },
  { key: 'orders', no: '02', label: 'Заявки' },
  { key: 'contacts', no: '03', label: 'Повідомлення' },
  { key: 'reviews', no: '04', label: 'Відгуки' },
  { key: 'work', no: '05', label: 'Приклади' },
  { key: 'pricing', no: '06', label: 'Ціни' },
  { key: 'content', no: '07', label: 'Контент' },
  { key: 'legal', no: '08', label: 'Правові тексти' },
  { key: 'settings', no: '09', label: 'Налаштування' },
];

function Login({ onDone }) {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const d = await adminApi.login(creds.email, creds.password);
      setToken(d.token); onDone();
    } catch { setErr('Невірний email або пароль'); }
    setBusy(false);
  };

  return (
    <div className="adm-login">
      <form onSubmit={submit} className="adm-login__card" data-testid="admin-login-form">
        <div className="adm-login__brand">
          <Monogram size={34} />
          <div>
            <div className="adm-login__name">Oksana Oliferenko</div>
            <div className="mono adm-login__sub">ADMIN PANEL · UA ⇄ DE</div>
          </div>
        </div>
        <div className="adm-field">
          <label className="adm-label mono">Email</label>
          <input className="adm-input" value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })} data-testid="admin-login-email" autoFocus />
        </div>
        <div className="adm-field">
          <label className="adm-label mono">Пароль</label>
          <input className="adm-input" type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} data-testid="admin-login-password" />
        </div>
        {err && <p className="adm-login__err" data-testid="admin-login-error">{err}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy} data-testid="admin-login-submit" style={{ justifyContent: 'center' }}>
          <span className="dot" />{busy ? 'Вхід…' : 'Увійти'}
        </button>
        <Link to="/" className="mono adm-login__back">← На сайт</Link>
      </form>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  const refreshStats = useCallback(() => {
    if (getToken()) adminApi.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const onLogout = () => setAuthed(false);
    window.addEventListener('admin:logout', onLogout);
    return () => window.removeEventListener('admin:logout', onLogout);
  }, []);

  useEffect(() => { if (authed) refreshStats(); }, [authed, tab, refreshStats]);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const logout = () => { clearToken(); setAuthed(false); };
  const titles = {
    dashboard: 'Огляд',
    orders: 'Заявки на переклад',
    contacts: 'Повідомлення з сайту',
    reviews: 'Відгуки клієнтів',
    work: 'Приклади робіт',
    pricing: 'Ціни та калькулятор',
    content: 'Контент сайту (UA · DE · EN)',
    legal: 'Правові тексти',
    settings: 'Налаштування сайту',
  };
  const counts = { orders: stats?.orders_total, contacts: stats?.contacts_total, reviews: stats?.reviews_total };

  return (
    <div className="adm" data-testid="admin-shell">
      <aside className="adm-side" data-testid="admin-sidebar">
        <div className="adm-side__brand">
          <Monogram size={30} />
          <div>
            <div className="adm-side__name">Oksana Oliferenko</div>
            <div className="mono adm-side__sub">ADMIN PANEL</div>
          </div>
        </div>
        <nav className="adm-side__nav" aria-label="admin">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`adm-side__item${tab === n.key ? ' is-active' : ''}`}
              onClick={() => setTab(n.key)}
              data-testid={`admin-nav-${n.key}`}
            >
              <span className="mono adm-side__no">{n.no}</span>
              <span className="adm-side__label">{n.label}</span>
              {counts[n.key] > 0 && <span className="mono adm-side__count">{counts[n.key]}</span>}
              {n.key === 'orders' && stats?.orders_new > 0 && <span className="adm-side__dot" title={`${stats.orders_new} нових`} />}
            </button>
          ))}
        </nav>
        <div className="adm-side__bottom">
          <Link to="/" className="mono adm-side__link">← На сайт</Link>
          <button className="mono adm-side__link adm-side__logout" onClick={logout} data-testid="admin-logout">Вийти →</button>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-main__head">
          <h1 data-testid="admin-section-title">{titles[tab]}</h1>
          {tab === 'orders' && stats?.orders_new > 0 && <span className="adm-badge adm-badge--new mono">{stats.orders_new} нових</span>}
        </header>
        {tab === 'dashboard' && <DashboardView onOpenOrders={() => setTab('orders')} />}
        {tab === 'orders' && <OrdersView onChanged={refreshStats} />}
        {tab === 'contacts' && <ContactsView />}
        {tab === 'reviews' && <ReviewsView onChanged={refreshStats} />}
        {tab === 'work' && <WorkView />}
        {tab === 'pricing' && <PricingView />}
        {tab === 'content' && <ContentView />}
        {tab === 'legal' && <LegalView />}
        {tab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

