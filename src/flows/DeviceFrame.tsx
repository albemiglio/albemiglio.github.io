import type { ReactNode, Ref } from 'react';

type Props = { kind: 'laptop' | 'phone'; label: string; onPause?: () => void; onResume?: () => void; ref?: Ref<HTMLDivElement>; children: ReactNode };

// `ref` reaches the `.device` box itself: that box is the rect the scene projects the 3D screen
// onto, and the element the handoff matrix is written to.
export function DeviceFrame({ kind, label, onPause, onResume, ref, children }: Props) {
  return (
    <div
      ref={ref}
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
