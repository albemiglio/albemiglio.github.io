import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import type { StepMeta } from './types';

type Props = { steps: StepMeta[]; index: number; playing: boolean; color: string; onSelect: (i: number) => void };

export function StepBar({ steps, index, playing, color, onSelect }: Props) {
  const groupRef = useRef<HTMLDivElement>(null);

  const focusStep = (i: number) => {
    groupRef.current?.querySelectorAll<HTMLButtonElement>('.step')[i]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' && index < steps.length - 1) {
      e.preventDefault();
      onSelect(index + 1);
      focusStep(index + 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      onSelect(index - 1);
      focusStep(index - 1);
    }
  };

  return (
    <div ref={groupRef} className="stepbar" role="group" aria-label="Flow steps" onKeyDown={onKey} style={{ '--step-color': color } as CSSProperties}>
      {steps.map((s, i) => {
        const active = i === index;
        const fillClass = active ? 'step__fill step__fill--active' : i < index ? 'step__fill step__fill--done' : 'step__fill';
        const fillStyle: CSSProperties = active
          ? { animationDuration: `${s.ms}ms`, animationPlayState: playing ? 'running' : 'paused' }
          : {};
        return (
          <button
            key={s.id}
            type="button"
            className="step"
            aria-current={active ? 'step' : undefined}
            aria-label={`Step ${i + 1} of ${steps.length}: ${s.label}`}
            onClick={() => onSelect(i)}
          >
            <span className="step__track"><span key={`${s.id}-${index}`} className={fillClass} style={fillStyle} data-testid={`step-fill-${s.id}`} /></span>
            <span className="step__label">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
