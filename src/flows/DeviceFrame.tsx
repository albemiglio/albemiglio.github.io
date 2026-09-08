import type { ReactNode } from 'react';

type Props = { kind: 'laptop' | 'phone'; label: string; onPause?: () => void; onResume?: () => void; children: ReactNode };

export function DeviceFrame({ kind, label, onPause, onResume, children }: Props) {
  return (
    <div
      className={`device device--${kind}`}
      role="figure"
      aria-label={label}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
    >
      {kind === 'laptop' ? (
        <div className="device__bar" aria-hidden="true"><span className="device__dot" /><span className="device__dot" /><span className="device__dot" /></div>
      ) : (
        <div className="device__notch" aria-hidden="true" />
      )}
      <div className="device__screen">{children}</div>
    </div>
  );
}
