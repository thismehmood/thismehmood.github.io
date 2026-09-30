import { Fragment } from 'react';
import type { RichText as RichTextParts } from '@/lib/data';

/** Renders rich-text segments from lib/data.ts (`em` / `strong` emphasis). */
export default function RichText({ parts }: { parts: RichTextParts }) {
  return (
    <>
      {parts.map((seg, i) =>
        seg.strong ? <strong key={i}>{seg.text}</strong>
          : seg.em ? <em key={i}>{seg.text}</em>
          : <Fragment key={i}>{seg.text}</Fragment>,
      )}
    </>
  );
}
