'use client';

/* ==========================================================================
   Contact form — bracketed panel, floating labels with green focus lines,
   inline validation (--danger), mailto hand-off.

   By default it opens the visitor's mail client with everything pre-filled
   (no backend needed). To POST to a form service instead (Formspree, Getform…)
   pass `endpoint`, or set NEXT_PUBLIC_FORM_ENDPOINT at build time.
   ========================================================================== */

import { Fragment, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/motion';
import { site } from '@/lib/data';
import Corners from '@/components/Corners';

type Control = HTMLInputElement | HTMLTextAreaElement;
type RequiredName = 'name' | 'email' | 'message';
type Status = { msg: string; type?: 'success' | 'error' };

/** Required fields, in DOM order (the first invalid one receives focus). */
const REQUIRED: readonly RequiredName[] = ['name', 'email', 'message'];

const isValid = (el: Control) => el.value.trim() !== '' && el.checkValidity();

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  invalid?: boolean;
  /** Renders the control; receives the ARIA props that depend on validity. */
  children: (aria: { 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
};

function Field({ id, label, error, invalid = false, children }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className={invalid ? 'field is-invalid' : 'field'}>
      {children(invalid && error ? { 'aria-invalid': true, 'aria-describedby': errorId } : {})}
      <label className="field__label" htmlFor={id}>{label}</label>
      <span className="field__line" aria-hidden="true" />
      {error && <span className="field__error" id={errorId}>{error}</span>}
    </div>
  );
}

type ContactFormProps = {
  /** Optional form-service URL; when empty the form hands off to the visitor's mail app. */
  endpoint?: string;
  /** Recipient address (mailto fallback + error messages). */
  email?: string;
};

export default function ContactForm({
  endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT,
  email = site.email,
}: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const controls = useRef<Partial<Record<RequiredName, Control | null>>>({});
  const [invalid, setInvalid] = useState<Record<RequiredName, boolean>>({ name: false, email: false, message: false });
  const [status, setStatusState] = useState<Status>({ msg: '' });
  // Bumped on every status so the live region re-announces even identical messages
  const [announceKey, setAnnounceKey] = useState(0);
  const setStatus = (s: Status) => { setStatusState(s); setAnnounceKey((k) => k + 1); };
  // In-flight guard for endpoint mode (a ref blocks two submits in the same frame)
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);

  const { contextSafe } = useGSAP({ scope: formRef });

  const shake = contextSafe((fields: Element[]) => {
    gsap.fromTo(fields, { x: -10 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)', clearProps: 'x' });
  });

  const setFieldInvalid = (name: RequiredName, value: boolean) =>
    setInvalid((prev) => (prev[name] === value ? prev : { ...prev, [name]: value }));

  const bind = (name: RequiredName) => ({
    ref: (el: Control | null) => { controls.current[name] = el; },
    // Blur validates once something has been typed…
    onBlur: (e: { currentTarget: Control }) => {
      if (e.currentTarget.value) setFieldInvalid(name, !isValid(e.currentTarget));
    },
    // …and an invalid field re-validates on every keystroke
    onInput: (e: { currentTarget: Control }) => {
      const ok = isValid(e.currentTarget);
      setInvalid((prev) => (prev[name] && ok ? { ...prev, [name]: false } : prev));
    },
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sendingRef.current) return;
    const form = e.currentTarget;

    // Validate every required field
    const results = REQUIRED.map((name) => {
      const el = controls.current[name] ?? null;
      return { name, el, ok: el ? isValid(el) : false };
    });
    setInvalid({
      name: !results[0].ok,
      email: !results[1].ok,
      message: !results[2].ok,
    });

    const bad = results.filter((r) => !r.ok).map((r) => r.el).filter((el): el is Control => el !== null);
    if (bad.length) {
      setStatus({ msg: 'Please fill in the highlighted fields.', type: 'error' });
      if (!prefersReducedMotion()) {
        shake(bad.map((el) => el.closest('.field')).filter((f): f is HTMLElement => f instanceof HTMLElement));
      }
      bad[0].focus();
      return;
    }

    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? '').trim();

    // Optional: POST to a form service
    if (endpoint) {
      sendingRef.current = true;
      setSending(true);
      try {
        setStatus({ msg: 'Sending…' });
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus({ msg: 'Thanks — your message is on its way. I’ll reply soon.', type: 'success' });
        form.reset();
      } catch {
        setStatus({ msg: `Something went wrong. Please email me directly at ${email}.`, type: 'error' });
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
      return;
    }

    // Default: open the visitor's mail client with everything pre-filled
    const name = get('name');
    const subject = get('subject') || `Portfolio enquiry from ${name}`;
    const body = `${get('message')}\n\n— ${name}\n${get('email')}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus({ msg: `Opening your email app… If nothing happens, email ${email} directly.`, type: 'success' });
  };

  const statusClass =
    status.type === 'success' ? 'form__status is-success' : status.type === 'error' ? 'form__status is-error' : 'form__status';

  return (
    <form
      ref={formRef}
      className="form"
      noValidate
      data-reveal
      onSubmit={onSubmit}
    >
      <Corners />
      <p className="form__head">
        <span className="form__head-title"><span className="pulse-dot" aria-hidden="true" />Send a message</span>{' '}
        <span className="form__head-meta">{endpoint ? 'Delivered directly' : 'Opens your email app'}</span>
      </p>
      <div className="form__row">
        <Field id="name" label="Your name" error="Please tell me your name." invalid={invalid.name}>
          {(aria) => (
            <input
              className="field__input"
              type="text"
              id="name"
              name="name"
              placeholder=" "
              autoComplete="name"
              required
              {...aria}
              {...bind('name')}
            />
          )}
        </Field>
        <Field id="email" label="Email address" error="Please enter a valid email." invalid={invalid.email}>
          {(aria) => (
            <input
              className="field__input"
              type="email"
              id="email"
              name="email"
              placeholder=" "
              autoComplete="email"
              required
              {...aria}
              {...bind('email')}
            />
          )}
        </Field>
      </div>
      <Field id="subject" label="Subject (optional)">
        {() => <input className="field__input" type="text" id="subject" name="subject" placeholder=" " />}
      </Field>
      <Field id="message" label="Tell me about your project" error="A short message helps." invalid={invalid.message}>
        {(aria) => (
          <textarea
            className="field__input"
            id="message"
            name="message"
            rows={4}
            placeholder=" "
            required
            {...aria}
            {...bind('message')}
          />
        )}
      </Field>
      <div className="form__footer">
        <button className="btn btn--primary btn--lg" type="submit" data-magnetic="0.3" disabled={sending} aria-busy={sending}>
          <span className="btn__label" data-magnetic-inner>
            Send message
            <svg className="btn__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <p className={statusClass} role="status" aria-live="polite">
          <Fragment key={announceKey}>{status.msg}</Fragment>
        </p>
      </div>
    </form>
  );
}
