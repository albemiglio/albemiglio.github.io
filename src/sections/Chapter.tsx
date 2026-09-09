import { Suspense, useCallback, useEffect, useRef, type ComponentType, type CSSProperties, type RefCallback } from 'react';
import type { Step } from '../flows/types';
import { useFlowPlayer } from '../flows/player';
import { DeviceFrame } from '../flows/DeviceFrame';
import { StepBar } from '../flows/StepBar';
import { useMotionPrefs } from '../MotionProvider';
import { sceneStore, useSceneSelector } from '../scene/store';
import { isNearIdentity, quadToMatrix3d } from '../scene/math';
import { useRectRegistration } from '../scene/useRectRegistration';
import type { ChapterMeta } from '../chapters';

export type ChapterDef<S> = {
  id: string; title: string; audience: string; blurb: string; fact: string; color: string;
  object: ChapterMeta['object']; device: 'laptop' | 'phone'; steps: Step<S>[]; Scene: ComponentType<{ state: S }>;
};

export type AnyChapterDef = ChapterDef<any>;

export function Chapter<S>({ def, active, register }: { def: ChapterDef<S>; active: boolean; register: RefCallback<HTMLElement> }) {
  const { reduced } = useMotionPrefs();
  const player = useFlowPlayer(def.steps, { active, reduced });
  const sceneOpen = useSceneSelector((s) => s.sceneOpen);
  const objectRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  useEffect(() => { sceneStore.set((s) => ({ stepState: { ...s.stepState, [def.id]: player.state } })); }, [def.id, player.state]);
  useRectRegistration(def.id, 'object', objectRef);
  useRectRegistration(def.id, 'frame', frameRef);
  useRectRegistration(def.id, 'chapter', articleRef);
  // The frame rides the 3D screen plane in CSS 3D: still DOM, still crisp, still clickable. The
  // quad arrives outside the reactive state (P2-R2), so this writes the transform straight to the
  // node — no React render per scroll frame. No scene, no quad, no matrix: the frame stays in
  // normal flow, and so does the frontal pose, where the projection is the layout rect itself.
  useEffect(() => sceneStore.subscribeQuad(def.id, (quad) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = sceneStore.get().rects[def.id]?.frame;
    const flat = !rect || !quad || isNearIdentity(rect, quad);
    el.style.transform = flat ? '' : quadToMatrix3d(rect!, quad!);
    // M2: `data-flat` gates the StepBar fade in flows.css — the pill only earns its keep once the
    // device has actually handed off to the flat DOM pose; while it's still rotating in/out, the
    // 3D shell is doing the talking and the pill would just clutter that.
    el.parentElement?.toggleAttribute('data-flat', flat);
  }), [def.id]);
  // M2: belt-and-suspenders for the fallback path — the CSS fade rule already requires
  // `[data-scene]` (only present while sceneOpen), so this never matters in practice, but keeps
  // the DOM attribute honest if that selector ever changes.
  useEffect(() => {
    if (!sceneOpen) frameRef.current?.parentElement?.setAttribute('data-flat', '');
  }, [sceneOpen]);
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
          <div className="chapter__object" ref={objectRef} aria-hidden="true">
            {!sceneOpen && (
              <picture>
                <source srcSet={`/fallback/${def.object}.webp`} type="image/webp" />
                <img src={`/fallback/${def.object}.png`} alt="" loading="lazy" />
              </picture>
            )}
          </div>
        </div>
        <div
          className="chapter__stage"
          data-scene={sceneOpen ? '' : undefined}
          onMouseEnter={player.pause}
          onMouseLeave={player.resume}
          onFocus={player.pause}
          onBlur={player.resume}
        >
          <DeviceFrame ref={frameRef} kind={def.device} label={`${def.id} — ${def.title}`}>
            <Suspense fallback={null}>
              <Scene state={player.state} />
            </Suspense>
          </DeviceFrame>
          <StepBar steps={def.steps} index={player.index} playing={player.playing} color={def.color} onSelect={player.goTo} />
        </div>
      </div>
    </article>
  );
}
