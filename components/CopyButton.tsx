'use client';

/* ==========================================================================
   Copy-to-clipboard button + polite live region (main.js §15 initCopy).
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
        className={state === 'copied' ? 'copy-btn is-copied' : 'copy-btn'}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <span className="copy-btn__text">{label}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        <Fragment key={nonce}>{status}</Fragment>
      </span>
    </>
  );
}
