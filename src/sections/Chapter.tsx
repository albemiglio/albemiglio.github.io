import { Suspense, useCallback, useRef, type ComponentType, type CSSProperties, type RefCallback } from 'react';
import type { Step } from '../flows/types';
import { useFlowPlayer } from '../flows/player';
import { ScreenPanel } from '../flows/ScreenPanel';
import { StepBar } from '../flows/StepBar';
import { useMotionPrefs } from '../MotionProvider';
import { ShotScene, type Shot } from '../flows/ShotScene';
import { useWide } from '../useWide';

export type ChapterDef<S> = {
  id: string; title: string; audience: string; blurb: string; fact: string; color: string;
  device: 'laptop' | 'phone'; steps: Step<S>[];
  /** Either a reconstruction of the interface, or — better — captures of the real product. */
  Scene?: ComponentType<{ state: S }>;
  shots?: boolean;
};

export type AnyChapterDef = ChapterDef<any>;

export function Chapter<S>({ def, active, register }: { def: ChapterDef<S>; active: boolean; register: RefCallback<HTMLElement> }) {
  const { reduced } = useMotionPrefs();
  const player = useFlowPlayer(def.steps, { active, reduced });
  const wide = useWide();
  const articleRef = useRef<HTMLElement>(null);
  const { Scene } = def;
  // A stable callback: a fresh closure per render would re-register the article on every step tick.
  const articleRef_ = useCallback((el: HTMLElement | null) => { articleRef.current = el; register(el); }, [register]);
  return (
    <article
      id={`work-${def.id}`}
      className="chapter"
      ref={articleRef_}
      style={{ '--chapter-color': def.color } as CSSProperties}
    >
      <div className="rail chapter__grid">
        <div className="chapter__text">
          <p className="chapter__kicker">{def.id} · {def.audience}</p>
          <h3 className="chapter__title">{def.title}</h3>
          <p className="chapter__blurb">{def.blurb}</p>
          <p className="chapter__fact">{def.fact}</p>
        </div>
        <div
          className="chapter__stage"
          onMouseEnter={player.pause}
          onMouseLeave={player.resume}
          onFocus={player.pause}
          onBlur={player.resume}
        >
          <ScreenPanel shape={def.device === 'phone' ? 'tall' : 'wide'} label={`${def.id} — ${def.title}`}>
            {def.shots
              ? <ShotScene shot={player.state as Shot} wide={wide} />
              : Scene && <Suspense fallback={null}><Scene state={player.state} /></Suspense>}
          </ScreenPanel>
          <StepBar steps={def.steps} index={player.index} playing={player.playing} color={def.color} onSelect={player.goTo} />
        </div>
      </div>
    </article>
  );
}
