import { Fragment, type ElementType, type ReactNode } from 'react';
import type { TextPart } from '@/lib/data';

type SplitTextProps = {
  /** Plain text to split (or use `parts` for emphasised segments). */
  text?: string;
  parts?: TextPart[];
  /** 'chars' wraps every character; 'words' wraps words only. */
  type?: 'chars' | 'words';
  /** Wrap each word's content in `.word__inner` inside an overflow-hidden `.word--mask`. */
  mask?: boolean;
  as?: ElementType;
  className?: string;
};

/**
 * Renders text pre-split into `.word` / `.char` spans (server-rendered, React-owned DOM),
 * with a visually-hidden plain copy for screen readers and the pieces aria-hidden.
 * Class names match the animation helpers in lib/animations.ts and app/globals.css.
 */
export default function SplitText({ text, parts, type = 'chars', mask = false, as: Tag = 'span', className }: SplitTextProps) {
  const segments: TextPart[] = parts ?? [{ text: text ?? '' }];
  const plain = segments.map((s) => s.text).join('').replace(/\s+/g, ' ').trim();

  let wordKey = 0;
  const renderWord = (word: string) => {
    const content = type === 'chars'
      ? Array.from(word).map((c, i) => <span className="char" key={i}>{c}</span>)
      : word;
    return (
      <span className={mask ? 'word word--mask' : 'word'} aria-hidden="true" key={`w${wordKey++}`}>
        {mask ? <span className="word__inner">{content}</span> : content}
      </span>
    );
  };

  const renderSegment = (seg: TextPart, si: number) => {
    const nodes: ReactNode[] = [];
    seg.text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      nodes.push(/^\s+$/.test(part) ? ' ' : renderWord(part));
    });
    return seg.em ? <em key={`s${si}`}>{nodes}</em> : <Fragment key={`s${si}`}>{nodes}</Fragment>;
  };

  return (
    <Tag className={className}>
      <span className="sr-only">{plain}</span>
      {segments.map(renderSegment)}
    </Tag>
  );
}
