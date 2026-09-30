'use client';

/* ==========================================================================
   Copy-to-clipboard button (mono pill) + polite live region.
   Renders the button and its sr-only status as siblings, matching the markup.
   ========================================================================== */

import { Fragment, useEffect, useRef, useState, type RefObject } from 'react';

type CopyState = 'idle' | 'copied' | 'failed';

type CopyButtonProps = {
  /** Text written to the clipboard. */
  text: string;
  /** Element whose text gets selected when automatic copying fails, so ⌘/Ctrl+C works. */
  selectOnFail?: RefObject<HTMLElement | null>;
  ariaLabel?: string;
  successMessage?: string;
  failMessage?: string;
};

const RESET_MS = 1800;

/** Legacy fallback for non-secure contexts / denied clipboard permission. */
function copyWithTextarea(text: string): boolean {
  const prev = document.activeElement as HTMLElement | null;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  prev?.focus?.({ preventScroll: true }); // don't drop keyboard focus to <body>
  return ok;
}

export default function CopyButton({
  text,
  selectOnFail,
  ariaLabel = 'Copy email address',
  successMessage = 'Email address copied to the clipboard.',
  failMessage = 'Could not copy automatically. The email address is selected; press Command or Control plus C.',
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  // Bumped per click so a repeated identical message is re-inserted (and re-announced)
  const [nonce, setNonce] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = copyWithTextarea(text);
      if (!ok) {
        // Select the visible address so the "press ⌘C" hint actually works
        const target = selectOnFail?.current;
        if (target) window.getSelection()?.selectAllChildren(target);
      }
    }

    setState(ok ? 'copied' : 'failed');
    setNonce((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), RESET_MS);
  };

  const label = state === 'copied' ? 'Copied!' : state === 'failed' ? 'Press ⌘/Ctrl+C' : 'Copy';
  const status = state === 'copied' ? successMessage : state === 'failed' ? failMessage : '';

  return (
    <>
      <button
        className={state === 'copied' ? 'copy-btn is-copied' : state === 'failed' ? 'copy-btn is-failed' : 'copy-btn'}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <svg className="copy-btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {state === 'copied' ? (
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="8.5" y="8.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" stroke="currentColor" strokeWidth="1.8" />
            </>
          )}
        </svg>
        <span className="copy-btn__text">{label}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        <Fragment key={nonce}>{status}</Fragment>
      </span>
    </>
  );
}
