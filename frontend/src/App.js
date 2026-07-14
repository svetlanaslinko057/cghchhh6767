import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './i18n';
import './App.css';
import { ScrollTrigger } from './components/Reveal';
import SmoothScrollProvider from './motion/SmoothScrollProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Work from './pages/Work';
import Order from './pages/Order';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Legal from './pages/Legal';
import CookieBanner from './components/CookieBanner';
import LeadWidget from './components/LeadWidget';
import OrderModal from './components/OrderModal';
import { SettingsProvider } from './lib/settings';
import Seo from './lib/seo';

function ScrollManager() {
  const loc = useLocation();
  useEffect(() => {
    if (loc.hash) {
      // anchor navigation (e.g. /#pricing from other pages): settle layout, then glide
      const t = setTimeout(() => {
        import('./lib/scroll').then(({ scrollToHash }) => scrollToHash(loc.hash));
        ScrollTrigger.refresh();
      }, 450);
      return () => clearTimeout(t);
    }
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    const t = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => clearTimeout(t);
  }, [loc.pathname, loc.hash]);
  return null;
}

function Curtain() {
  const loc = useLocation();
  return <div key={loc.pathname} className="curtain" aria-hidden="true" />;
}

function Layout({ children }) {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith('/admin');
  return (<>
    {!isAdmin && <Header />}
    <main className="App">{children}</main>
    {!isAdmin && <Footer />}
    <LeadWidget />
    {!isAdmin && <OrderModal />}
    {!isAdmin && <CookieBanner />}
  </>);
}

export default function App() {
  useEffect(() => {
    const onReady = () => ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onReady);
    window.addEventListener('load', onReady);
    return () => window.removeEventListener('load', onReady);
  }, []);
  return (
    <BrowserRouter>
      <SettingsProvider>
      <Seo />
      <SmoothScrollProvider>
        <div className="grain" />
        <CustomCursor />
        <ScrollManager />
        <Curtain />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/work" element={<Work />} />
            <Route path="/order" element={<Order />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal/:slug" element={<Legal />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </SmoothScrollProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
