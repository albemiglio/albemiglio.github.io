import { useEffect, useRef, type CSSProperties, type JSX, type RefCallback } from 'react';
import type { Step } from '../flows/types';
import { useFlowPlayer } from '../flows/player';
import { DeviceFrame } from '../flows/DeviceFrame';
import { StepBar } from '../flows/StepBar';
import { useMotionPrefs } from '../MotionProvider';
import { sceneStore, useSceneSelector } from '../scene/store';
import { useRectRegistration } from '../scene/useRectRegistration';

export type ChapterDef<S> = {
  id: string; title: string; audience: string; blurb: string; fact: string; color: string;
  device: 'laptop' | 'phone'; steps: Step<S>[]; Scene: (p: { state: S }) => JSX.Element;
};

export type AnyChapterDef = ChapterDef<any>;

export function Chapter<S>({ def, active, register }: { def: ChapterDef<S>; active: boolean; register: RefCallback<HTMLElement> }) {
  const { reduced } = useMotionPrefs();
  const player = useFlowPlayer(def.steps, { active, reduced });
  const sceneOpen = useSceneSelector((s) => s.sceneOpen);
  const objectRef = useRef<HTMLDivElement>(null);
  useEffect(() => { sceneStore.set((s) => ({ stepState: { ...s.stepState, [def.id]: player.state } })); }, [def.id, player.state]);
  useRectRegistration(def.id, 'object', objectRef);
  const { Scene } = def;
  return (
    <article id={`work-${def.id}`} className="chapter" ref={register} style={{ '--chapter-color': def.color } as CSSProperties}>
      <div className="rail chapter__grid">
        <div>
          <p className="chapter__kicker">{def.id} · {def.audience}</p>
          <h3 className="chapter__title">{def.title}</h3>
          <p className="chapter__blurb">{def.blurb}</p>
          <p className="chapter__fact">{def.fact}</p>
          <div className="chapter__object" ref={objectRef} aria-hidden="true">
            {!sceneOpen && (
              <picture>
                <source srcSet={`/fallback/${def.id}.webp`} type="image/webp" />
                <img src={`/fallback/${def.id}.png`} alt="" loading="lazy" />
              </picture>
            )}
          </div>
        </div>
        <div
          className="chapter__stage"
          onMouseEnter={player.pause}
          onMouseLeave={player.resume}
          onFocus={player.pause}
          onBlur={player.resume}
        >
          <DeviceFrame kind={def.device} label={`${def.id} — ${def.title}`}>
            <Scene state={player.state} />
          </DeviceFrame>
          <StepBar steps={def.steps} index={player.index} playing={player.playing} color={def.color} onSelect={player.goTo} />
        </div>
      </div>
    </article>
  );
}
