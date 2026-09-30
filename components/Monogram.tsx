/**
 * MH monogram drawn as a node graph — the letters are "edges" between "agents",
 * with one live (green) node. Sized by font-size (height: 1em); colour = currentColor.
 */
export default function Monogram({ className = '', title }: { className?: string; title?: string }) {
  return (
    <svg
      className={`monogram ${className}`.trim()}
      viewBox="0 0 44 28"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path className="monogram__edge" d="M3 25V3l9 12 9-12v22M28 3v22M41 3v22M28 14h13" />
      <circle className="monogram__node" cx="3" cy="3" r="2.4" />
      <circle className="monogram__node" cx="21" cy="3" r="2.4" />
      <circle className="monogram__node" cx="28" cy="14" r="2.4" />
      <circle className="monogram__node" cx="41" cy="14" r="2.4" />
      <circle className="monogram__node monogram__node--hot" cx="12" cy="15" r="2.8" />
    </svg>
  );
}
