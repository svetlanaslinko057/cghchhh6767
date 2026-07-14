export default function Marquee({ items = [], sep = '\u2022' }) {
  const row = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee__track">
        {row.map((it, i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'3rem', fontFamily:'var(--font-mono)', fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase' }}>
            {it}<span style={{ color:'var(--accent-2)' }}>{sep}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
