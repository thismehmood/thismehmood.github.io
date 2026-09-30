/** Schematic corner brackets (styles: `.corners` in app/styles/base.css). Parent must be positioned. */
export default function Corners({ accent = false }: { accent?: boolean }) {
  return <span className={accent ? 'corners corners--accent' : 'corners'} aria-hidden="true" />;
}
