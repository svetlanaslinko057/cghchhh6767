import { useEffect, useRef, useState } from 'react';

// Editorial select: paper dropdown, olive active row, keyboard accessible.
// options: [{ value, label, meta? }]
export default function Select({ value, options, onChange, testId = 'select', ariaLabel, placeholder = '—' }) {
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(-1);
  const ref = useRef(null);
  const active = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc); };
  }, [open]);

  useEffect(() => {
    if (open) setHl(options.findIndex((o) => String(o.value) === String(value)));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (o) => { onChange(o.value); setOpen(false); };

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && hl >= 0 && options[hl]) pick(options[hl]); else setOpen(true);
    } else if (e.key === 'Escape') { setOpen(false);
    } else if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setHl((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(0, h - 1));
    } else if (e.key === 'Tab') { setOpen(false); }
  };

  return (
    <div className={`esel${open ? ' is-open' : ''}`} ref={ref} data-testid={testId}>
      <button
        type="button" className="esel__btn" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)} onKeyDown={onKey} data-testid={`${testId}-btn`}
      >
        <span className="esel__val">{active ? active.label : placeholder}</span>
        <svg className="esel__chev" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <ul className="esel__menu" role="listbox" data-testid={`${testId}-menu`}>
          {options.map((o, i) => (
            <li key={String(o.value)}>
              <button
                type="button" role="option" aria-selected={String(o.value) === String(value)}
                className={`esel__opt${String(o.value) === String(value) ? ' is-active' : ''}${hl === i ? ' is-hl' : ''}`}
                onMouseEnter={() => setHl(i)} onClick={() => pick(o)} data-testid={`${testId}-opt-${i}`}
              >
                <span>{o.label}</span>
                {o.meta && <em className="mono esel__meta">{o.meta}</em>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
