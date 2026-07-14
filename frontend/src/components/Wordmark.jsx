// Brand wordmark + OO monogram (generated in-code, no external asset).
export function Monogram({ size = 30, stroke = 'var(--ink)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="18" cy="24" r="12" stroke={stroke} strokeWidth="1.4" />
      <circle cx="30" cy="24" r="12" stroke={stroke} strokeWidth="1.4" opacity="0.55" />
    </svg>
  );
}

// Compact header lockup
export function WordmarkLockup({ name, line1, line2 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem' }}>
      <Monogram size={26} />
      <span style={{ lineHeight: 1 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: '1.02rem', letterSpacing: '-0.01em', display: 'block' }}>{name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.52rem', letterSpacing: '.22em', color: 'var(--ink-soft)', display: 'block', marginTop: 2 }}>{line1} · {line2}</span>
      </span>
    </span>
  );
}

export default WordmarkLockup;
