import type { ReactNode, Ref } from 'react';

type Props = { kind: 'laptop' | 'phone'; label: string; bare?: boolean; onPause?: () => void; onResume?: () => void; ref?: Ref<HTMLDivElement>; children: ReactNode };

// `ref` reaches the `.device` box itself: that box is the rect the scene projects the 3D screen
// onto, and the element the handoff matrix is written to.
// `bare` drops the window chrome: when the frame holds a capture of a real product, the capture
// already carries that product's own chrome, and a second title bar around it reads as a fake
// wrapper around a real thing.
export function DeviceFrame({ kind, label, bare, onPause, onResume, ref, children }: Props) {
  return (
    <div
      ref={ref}
      className={`device device--${kind}${bare ? ' device--bare' : ''}`}
      role="figure"
      aria-label={label}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
    >
      {bare ? null : kind === 'laptop' ? (
        <div className="device__bar" aria-hidden="true"><span className="device__dot" /><span className="device__dot" /><span className="device__dot" /></div>
      ) : (
        <div className="device__notch" aria-hidden="true" />
      )}
      <div className="device__screen">{children}</div>
    </div>
  );
}
