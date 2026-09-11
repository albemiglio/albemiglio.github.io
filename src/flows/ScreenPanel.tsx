import type { ReactNode, Ref } from 'react';

type Props = { shape: 'wide' | 'tall'; label: string; onPause?: () => void; onResume?: () => void; ref?: Ref<HTMLDivElement>; children: ReactNode };

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
