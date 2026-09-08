import type { CSSProperties, KeyboardEvent } from 'react';
import type { StepMeta } from './types';

type Props = { steps: StepMeta[]; index: number; playing: boolean; color: string; onSelect: (i: number) => void };

export function StepBar({ steps, index, playing, color, onSelect }: Props) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' && index < steps.length - 1) onSelect(index + 1);
    if (e.key === 'ArrowLeft' && index > 0) onSelect(index - 1);
  };
  return (
    <div className="stepbar" role="group" aria-label="Flow steps" tabIndex={0} onKeyDown={onKey} style={{ '--step-color': color } as CSSProperties}>
      {steps.map((s, i) => {
        const active = i === index;
        const fillClass = active ? 'step__fill step__fill--active' : i < index ? 'step__fill step__fill--done' : 'step__fill';
        const fillStyle: CSSProperties = active
          ? { animationDuration: `${s.ms}ms`, animationPlayState: playing ? 'running' : 'paused' }
          : {};
        return (
          <button key={s.id} type="button" className="step" aria-current={active ? 'step' : undefined} onClick={() => onSelect(i)}>
            <span className="step__track"><span key={`${s.id}-${index}`} className={fillClass} style={fillStyle} data-testid={`step-fill-${s.id}`} /></span>
            <span className="step__label">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
