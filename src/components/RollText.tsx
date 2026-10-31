/** Text that rolls letter by letter on hover of its closest link or button (see .roll in globals.css). */
export function RollText({ children }: { children: string }) {
  return (
    <span className="roll" aria-label={children}>
      {[...children].map((ch, i) => (
        <span className="ch" style={{ "--i": i } as React.CSSProperties} aria-hidden="true" key={i}>
          <b>{ch}</b>
          <b>{ch}</b>
        </span>
      ))}
    </span>
  );
}
