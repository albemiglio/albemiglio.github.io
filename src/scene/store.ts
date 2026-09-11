import { useSyncExternalStore } from 'react';
import { heroExitFromRect, type Pt, type Rect } from './math';

export type { Rect } from './math';
export type ChapterRects = { object?: Rect; chapter?: Rect };
export type SceneState = {
  progress: number;
  activeId: string | null;
  rects: Record<string, ChapterRects>;
  stepState: Record<string, unknown>;
  viewport: { w: number; h: number };
  sceneOpen: boolean;
};

let state: SceneState = {
  progress: 0,
  activeId: null,
  rects: {},
  stepState: {},
  viewport: { w: 0, h: 0 },
  sceneOpen: false,
};
const listeners = new Set<(s: SceneState) => void>();

function emit() {
  for (const l of listeners) l(state);
}

// Screen quads live outside the reactive state: they change every scroll frame and must not
// trigger useSceneSelector re-renders. See P2-R2.
export type Quad = [Pt, Pt, Pt, Pt];
// The rect the quad was measured against travels with it: both come from the same frame, so the
// matrix can never map from a box the page has already scrolled away from.
// The frame elements themselves, so the scene can measure their layout box per frame.

export const sceneStore = {
  get: () => state,
  set(patch: Partial<SceneState> | ((s: SceneState) => Partial<SceneState>)) {
    const p = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...p };
    emit();
  },
  setRect(id: string, kind: 'object' | 'chapter', rect: Rect | null) {
    const current = { ...(state.rects[id] ?? {}) };
    if (rect) current[kind] = rect; else delete current[kind];
    state = { ...state, rects: { ...state.rects, [id]: current } };
    emit();
  },
  subscribe(fn: (s: SceneState) => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};

export function useSceneSelector<T>(sel: (s: SceneState) => T): T {
  return useSyncExternalStore(sceneStore.subscribe, () => sel(state), () => sel(state));
}

// Below this width the page drops the sticky stage and the sculpture (work.css / sections.css);
// the scene follows: no hero mode, no device rotation, objects only as chapter badges.
export const NARROW_MAX = 900;
export const isNarrow = (s: SceneState) => s.viewport.w > 0 && s.viewport.w < NARROW_MAX;

// One reading of the hero exit for every subscriber (objects, anchors, the sculpture's tilt).
export const heroExitOf = (s: SceneState) => (isNarrow(s) ? 1 : heroExitFromRect(s.rects.hero?.object?.y, s.viewport.h));
