import { useId } from 'react';
import type { ProjectArtId } from '@/lib/data';

/*
 * Decorative SVG illustrations for the Work cards (one per project).
 * Class names drive the CSS micro-animations in globals.css:
 *   .flow (dash), .stream (dots), .pulse / .pulse--delay / .pulse--delay-2 (breathe),
 *   .spin-view (orbit) — paused while the Work section is off-screen (.is-inview).
 * The wrapping `.card__art` is aria-hidden; the SVG is hidden too so it stays
 * decorative wherever it is rendered.
 */

function BillOfLading() {
  return (
    <svg className="art" viewBox="0 0 400 300" fill="none" aria-hidden="true" focusable="false">
      <rect x="112" y="52" width="176" height="212" rx="10" fill="#161B22" stroke="rgba(234,234,234,.12)" transform="rotate(-9 200 158)" />
      <rect x="112" y="46" width="176" height="212" rx="10" fill="#1F2833" stroke="rgba(234,234,234,.18)" transform="rotate(5 200 152)" />
      <g transform="rotate(-2 200 150)">
        <rect x="110" y="40" width="180" height="220" rx="10" fill="#0D0E15" stroke="#CCFF00" strokeOpacity=".6" />
        <text x="126" y="68" className="art-mono" fill="#CCFF00" fontSize="10">BILL OF LADING</text>
        <rect x="126" y="82" width="104" height="6" rx="3" fill="rgba(234,234,234,.28)" />
        <rect x="126" y="96" width="148" height="6" rx="3" fill="rgba(234,234,234,.12)" />
        <rect x="126" y="118" width="66" height="36" rx="4" stroke="rgba(234,234,234,.18)" />
        <rect x="200" y="118" width="74" height="36" rx="4" stroke="rgba(234,234,234,.18)" />
        <rect x="126" y="164" width="148" height="5" rx="2.5" fill="rgba(234,234,234,.1)" />
        <rect x="126" y="176" width="120" height="5" rx="2.5" fill="rgba(234,234,234,.1)" />
        <rect x="126" y="188" width="136" height="5" rx="2.5" fill="rgba(234,234,234,.1)" />
        <text x="138" y="200" className="art-display" fontSize="40" fill="none" stroke="#FF0080" strokeOpacity=".75" strokeWidth="1.5" transform="rotate(-16 200 185)">DRAFT</text>
        <text x="126" y="244" className="art-mono" fontSize="8" fill="rgba(234,234,234,.5)">sha256 · 9f2c…e41a · v3</text>
      </g>
      <circle className="pulse" cx="296" cy="232" r="34" fill="#CCFF00" opacity=".15" />
      <circle cx="296" cy="232" r="24" fill="#CCFF00" />
      <path d="M285 232l7.5 7.5L308 224" stroke="#0B0C10" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Gke({ hexId }: { hexId: string }) {
  const hex = `#${hexId}`;
  return (
    <svg className="art" viewBox="0 0 400 300" fill="none" aria-hidden="true" focusable="false">
      <defs><polygon id={hexId} points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" /></defs>
      <text x="40" y="44" className="art-mono" fontSize="10" fill="rgba(234,234,234,.5)">gke-autopilot · private-vpc</text>
      <g stroke="rgba(234,234,234,.14)" strokeWidth="1">
        <path d="M146 108 200 108 254 108M119 155 173 155 227 155 281 155M146 202 200 202 254 202M146 108 119 155 146 202M200 108 173 155 200 202M254 108 227 155 254 202M254 108 281 155 254 202M146 108 173 155M200 108 227 155M146 202 173 155M200 202 227 155" />
      </g>
      <use href={hex} x="146" y="108" fill="#161B22" stroke="rgba(234,234,234,.25)" />
      <use href={hex} x="200" y="108" fill="#CCFF00" className="pulse" />
      <use href={hex} x="254" y="108" fill="#161B22" stroke="rgba(234,234,234,.25)" />
      <use href={hex} x="119" y="155" fill="#161B22" stroke="rgba(234,234,234,.25)" />
      <use href={hex} x="173" y="155" fill="#1F2833" stroke="#CCFF00" strokeOpacity=".7" />
      <use href={hex} x="227" y="155" fill="#CCFF00" className="pulse pulse--delay" />
      <use href={hex} x="281" y="155" fill="#161B22" stroke="rgba(234,234,234,.25)" />
      <use href={hex} x="146" y="202" fill="#1F2833" stroke="#7928CA" />
      <use href={hex} x="200" y="202" fill="#161B22" stroke="rgba(234,234,234,.25)" />
      <use href={hex} x="254" y="202" fill="#CCFF00" className="pulse pulse--delay-2" />
      <rect x="260" y="236" width="110" height="26" rx="13" fill="#CCFF00" />
      <text x="272" y="253" className="art-mono" fontSize="10" fill="#0B0C10">response ↓ ~40%</text>
    </svg>
  );
}

function Gateway() {
  return (
    <svg className="art" viewBox="0 0 400 300" fill="none" aria-hidden="true" focusable="false">
      <g stroke="#CCFF00" strokeOpacity=".55" strokeWidth="1.5" className="flow">
        <path d="M150 140 C210 140 220 60 280 60" />
        <path d="M150 140 C210 140 220 100 280 100" />
        <path d="M150 140 C210 140 220 140 280 140" />
        <path d="M150 140 C210 140 220 180 280 180" />
        <path d="M150 140 C210 140 220 220 280 220" />
      </g>
      <rect x="60" y="112" width="92" height="56" rx="12" fill="#CCFF00" />
      <text x="75" y="136" className="art-mono" fontSize="10" fill="#0B0C10">GraphQL</text>
      <text x="75" y="152" className="art-mono" fontSize="10" fill="#0B0C10">gateway</text>
      <g className="art-mono" fontSize="9" fill="rgba(234,234,234,.75)">
        <rect x="280" y="48" width="70" height="24" rx="6" fill="#161B22" stroke="rgba(234,234,234,.2)" /><text x="292" y="64">svc · 01</text>
        <rect x="280" y="88" width="70" height="24" rx="6" fill="#161B22" stroke="rgba(234,234,234,.2)" /><text x="292" y="104">svc · 02</text>
        <rect x="280" y="128" width="70" height="24" rx="6" fill="#161B22" stroke="rgba(234,234,234,.2)" /><text x="292" y="144">svc · 03</text>
        <rect x="280" y="168" width="70" height="24" rx="6" fill="#161B22" stroke="rgba(234,234,234,.2)" /><text x="292" y="184">svc · 04</text>
        <rect x="280" y="208" width="70" height="24" rx="6" fill="#161B22" stroke="rgba(234,234,234,.2)" /><text x="292" y="224">svc · 05</text>
      </g>
      <rect x="60" y="250" width="290" height="18" rx="9" fill="#1F2833" />
      <text x="72" y="263" className="art-mono" fontSize="9" fill="rgba(234,234,234,.55)">kafka · async events</text>
      <g fill="#7928CA" className="stream">
        <circle cx="236" cy="259" r="4" />
        <circle cx="272" cy="259" r="4" />
        <circle cx="308" cy="259" r="4" />
        <circle cx="344" cy="259" r="4" />
      </g>
    </svg>
  );
}

function Headless() {
  return (
    <svg className="art" viewBox="0 0 400 300" fill="none" aria-hidden="true" focusable="false">
      <rect x="70" y="40" width="260" height="210" rx="12" fill="#0D0E15" stroke="rgba(234,234,234,.2)" />
      <path d="M70 64h260" stroke="rgba(234,234,234,.14)" />
      <circle cx="86" cy="52" r="4" fill="#FF0080" />
      <circle cx="100" cy="52" r="4" fill="#CCFF00" />
      <circle cx="114" cy="52" r="4" fill="rgba(234,234,234,.3)" />
      <text x="250" y="56" className="art-mono" fontSize="8" fill="rgba(234,234,234,.45)">PLP · SFRA</text>
      <g>
        <rect x="86" y="78" width="70" height="58" rx="6" fill="#1F2833" />
        <rect x="86" y="142" width="50" height="5" rx="2.5" fill="rgba(234,234,234,.3)" />
        <rect x="86" y="152" width="30" height="5" rx="2.5" fill="#CCFF00" />
        <rect x="165" y="78" width="70" height="58" rx="6" fill="#CCFF00" fillOpacity=".85" />
        <rect x="165" y="142" width="50" height="5" rx="2.5" fill="rgba(234,234,234,.3)" />
        <rect x="165" y="152" width="30" height="5" rx="2.5" fill="#CCFF00" />
        <rect x="244" y="78" width="70" height="58" rx="6" fill="#1F2833" />
        <rect x="244" y="142" width="50" height="5" rx="2.5" fill="rgba(234,234,234,.3)" />
        <rect x="244" y="152" width="30" height="5" rx="2.5" fill="#CCFF00" />
        <rect x="86" y="170" width="70" height="58" rx="6" fill="#1F2833" />
        <rect x="165" y="170" width="70" height="58" rx="6" fill="#1F2833" />
        <rect x="244" y="170" width="70" height="58" rx="6" fill="#7928CA" fillOpacity=".6" />
      </g>
      <path d="M330 150 C360 150 360 100 380 100" stroke="#CCFF00" strokeDasharray="3 5" className="flow" />
      <rect x="340" y="84" width="48" height="22" rx="11" fill="#161B22" stroke="#CCFF00" />
      <text x="351" y="99" className="art-mono" fontSize="9" fill="#CCFF00">API</text>
    </svg>
  );
}

function Payments() {
  return (
    <svg className="art" viewBox="0 0 400 300" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="200" cy="150" rx="150" ry="100" stroke="rgba(234,234,234,.12)" />
      <ellipse cx="200" cy="150" rx="104" ry="68" stroke="rgba(234,234,234,.16)" strokeDasharray="3 6" className="spin-view" />
      <circle cx="200" cy="150" r="38" fill="#CCFF00" />
      <text x="200" y="146" textAnchor="middle" className="art-display" fontSize="11" fill="#0B0C10">{"L'Oréal"}</text>
      <text x="200" y="162" textAnchor="middle" className="art-mono" fontSize="9" fill="#0B0C10">JAPAN</text>
      <g className="art-mono" fontSize="10">
        <rect x="60" y="62" width="84" height="26" rx="13" fill="#161B22" stroke="rgba(234,234,234,.25)" />
        <text x="102" y="79" textAnchor="middle" fill="#EAEAEA">Braintree</text>
        <rect x="270" y="70" width="70" height="26" rx="13" fill="#161B22" stroke="rgba(234,234,234,.25)" />
        <text x="305" y="87" textAnchor="middle" fill="#EAEAEA">PayPal</text>
        <rect x="54" y="206" width="64" height="26" rx="13" fill="#161B22" stroke="rgba(234,234,234,.25)" />
        <text x="86" y="223" textAnchor="middle" fill="#EAEAEA">Yotpo</text>
        <rect x="282" y="200" width="56" height="26" rx="13" fill="#7928CA" />
        <text x="310" y="217" textAnchor="middle" fill="#EAEAEA">GTM</text>
      </g>
      <g stroke="#CCFF00" strokeOpacity=".45" strokeDasharray="2 4" className="flow">
        <path d="M144 80 170 125" />
        <path d="M270 88 232 128" />
        <path d="M118 214 168 170" />
        <path d="M282 208 234 172" />
      </g>
    </svg>
  );
}

export default function ProjectArt({ id }: { id: ProjectArtId }) {
  // Unique, selector/URL-safe id for the hex <defs> (stable across SSR + hydration)
  const hexId = `art-hex-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;

  switch (id) {
    case 'bill-of-lading': return <BillOfLading />;
    case 'gke': return <Gke hexId={hexId} />;
    case 'gateway': return <Gateway />;
    case 'headless': return <Headless />;
    case 'payments': return <Payments />;
  }
}
