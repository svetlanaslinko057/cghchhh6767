import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal, RevealHeading } from '../components/Reveal';
import { useSiteSettings, channelLinks } from '../lib/settings';
import Faq from '../components/Faq';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Contact() {
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const channels = channelLinks(settings?.contacts);
  const [f, setF] = useState({ name:'', email:'', message:'' });
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/contact`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(f) });
      setSent(true); setF({name:'',email:'',message:''});
      setTimeout(() => {
        const el = document.querySelector('[data-testid="contact-success"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch {}
  };
  const inputStyle = { width:'100%', padding:'1rem 1.1rem', border:'1px solid var(--line)', borderRadius:10, background:'var(--card)', fontSize:'1rem', color:'var(--ink)', fontFamily:'var(--font-body)' };
  const label = { display:'block', marginBottom:'.5rem', fontFamily:'var(--font-mono)', fontSize:'.7rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-soft)' };
  return (
    <div>
      <section style={{ padding:'clamp(9rem,14vw,12rem) 0 3rem' }}><div className="container">
        <Reveal><div className="eyebrow mono" style={{ marginBottom:'1.5rem' }}>{t('nav.contact')}</div></Reveal>
        <RevealHeading as="h1" text={t('contactPage.title')} style={{ fontSize:'clamp(2.4rem,6vw,5rem)' }} />
        <Reveal delay={0.1}><p style={{ color:'var(--ink-soft)', maxWidth:600, marginTop:'1.5rem', fontSize:'1.1rem' }}>{t('contactPage.intro')}</p></Reveal>
        {channels.length > 0 && (
          <Reveal delay={0.15}>
            <div style={{ marginTop:'2rem' }} data-testid="contact-channels">
              <div className="mono" style={{ fontSize:'.58rem', letterSpacing:'.18em', color:'var(--ink-soft)', marginBottom:'.9rem' }}>ШВИДКИЙ ЗВ'ЯЗОК</div>
              <div className="chan-row">
                {channels.map((ch) => (
                  <a key={ch.key} href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="chan-link chan-link--light" data-testid={`contact-channel-${ch.key}`}>
                    {ch.label} <span className="chan-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </div></section>
      <section style={{ padding:'1rem 0 clamp(4rem,7vw,6rem)' }}><div className="container" style={{ maxWidth:700 }}>
        {sent ? (
          <div data-testid="contact-success" style={{ background:'var(--accent)', color:'var(--paper)', borderRadius:16, padding:'2.5rem', textAlign:'center' }}>
            <div style={{ width:52, height:52, border:'1.5px solid rgba(252,250,245,.6)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.2rem', fontSize:'1.3rem' }}>✓</div>
            <h2 style={{ color:'var(--paper)' }}>{t('contactPage.sent')}</h2>
          </div>
        ) : (
        <form onSubmit={submit} style={{ display:'grid', gap:'1.3rem' }}>
          <div><label style={label}>{t('contactPage.name')}</label><input style={inputStyle} value={f.name} onChange={e=>setF({...f,name:e.target.value})} required /></div>
          <div><label style={label}>{t('contactPage.email')}</label><input type="email" style={inputStyle} value={f.email} onChange={e=>setF({...f,email:e.target.value})} required /></div>
          <div><label style={label}>{t('contactPage.message')}</label><textarea rows={5} style={{...inputStyle,resize:'vertical'}} value={f.message} onChange={e=>setF({...f,message:e.target.value})} required /></div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent:'center', padding:'1.1rem' }}><span className="dot" />{t('contactPage.send')}</button>
        </form>
        )}
      </div></section>
      <Faq />
      <div style={{ height: 'clamp(3rem,5vw,4rem)' }} />
    </div>
  );
}
