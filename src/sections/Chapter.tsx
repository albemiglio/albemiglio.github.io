import { Suspense, useCallback, useEffect, useRef, type ComponentType, type CSSProperties, type RefCallback } from 'react';
import type { Step } from '../flows/types';
import { useFlowPlayer } from '../flows/player';
import { DeviceFrame } from '../flows/DeviceFrame';
import { StepBar } from '../flows/StepBar';
import { useMotionPrefs } from '../MotionProvider';
import { sceneStore, useSceneSelector, type QuadFrame } from '../scene/store';
import { isNearIdentity, layoutRect, quadToMatrix3d } from '../scene/math';
import { useRectRegistration } from '../scene/useRectRegistration';
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
  const sceneOpen = useSceneSelector((s) => s.sceneOpen);
  const frameRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  useEffect(() => { sceneStore.set((s) => ({ stepState: { ...s.stepState, [def.id]: player.state } })); }, [def.id, player.state]);
  useEffect(() => { sceneStore.setFrameEl(def.id, frameRef.current); return () => sceneStore.setFrameEl(def.id, null); }, [def.id]);
  useRectRegistration(def.id, 'chapter', articleRef);
  // The frame rides the 3D screen plane in CSS 3D: still DOM, still crisp, still clickable. The
  // quad arrives outside the reactive state (P2-R2), so this writes the transform straight to the
  // node — no React render per scroll frame. No scene, no quad, no matrix: the frame stays in
  // normal flow, and so does the frontal pose, where the projection is the layout rect itself.
  useEffect(() => {
    // The canvas is viewport-fixed, the frame scrolls with the page: between two renders the two
    // drift apart by exactly the scroll delta. Re-applying the matrix from the frame's CURRENT
    // layout box onto the last published corners keeps them together in the meantime — which is
    // what an engine that scrolls asynchronously (Safari) needs, since its scroll event and our
    // render can land a frame apart.
    let last: QuadFrame = null;
    const apply = () => {
      const el = frameRef.current;
      if (!el) return;
      const rect = last && layoutRect(el);
      const flat = !last || !rect || isNearIdentity(rect, last.quad);
      el.style.transform = flat ? '' : quadToMatrix3d(rect!, last!.quad);
      // Where the scene says the 3D screen is, in page pixels: the browser paints this element by
      // applying the matrix above to its current layout box, so these corners and the painted box
      // agree only while the two were measured together — the handoff's correctness condition,
      // and what the end-to-end scroll test asserts.
      if (last) el.dataset.quad = last.quad.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ');
      else delete el.dataset.quad;
      el.parentElement?.toggleAttribute('data-flat', flat);
    };
    const off = sceneStore.subscribeQuad(def.id, (f) => { last = f; apply(); });
    window.addEventListener('scroll', apply, { passive: true });
    return () => { off(); window.removeEventListener('scroll', apply); };
  }, [def.id]);
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
        </div>
        <div
          className="chapter__stage"
          data-scene={sceneOpen ? '' : undefined}
          onMouseEnter={player.pause}
          onMouseLeave={player.resume}
          onFocus={player.pause}
          onBlur={player.resume}
        >
          <DeviceFrame ref={frameRef} kind={def.device} label={`${def.id} — ${def.title}`} bare={def.shots}>
            {def.shots
              ? <ShotScene shot={player.state as Shot} wide={wide} />
              : Scene && <Suspense fallback={null}><Scene state={player.state} /></Suspense>}
          </DeviceFrame>
          <StepBar steps={def.steps} index={player.index} playing={player.playing} color={def.color} onSelect={player.goTo} />
        </div>
      </div>
    </article>
  );
}
