import type { ReactNode, Ref } from 'react';

type Props = { shape: 'wide' | 'tall'; label: string; onPause?: () => void; onResume?: () => void; ref?: Ref<HTMLDivElement>; children: ReactNode };

/**
 * A screen of a product, shown as itself.
 *
 * It used to sit on the display of a 3D laptop. A drawn device only earns its place if the device
 * is worth looking at, and this one was not: it tilted the interface, shrank it and put a grey
 * chassis around it, so the one thing the panel exists to show came out smaller and harder to
 * read. Every product site that does this well — Linear, Raycast, Vercel — frames the interface
 * flat instead: a hairline border, a deep shadow, and enough width that the text inside is
 * legible at something near its real size.
 */
export function ScreenPanel({ shape, label, onPause, onResume, ref, children }: Props) {
  return (
    <div
      ref={ref}
      className={`screen screen--${shape}`}
      role="figure"
      aria-label={label}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
    >
      {children}
    </div>
  );
}
