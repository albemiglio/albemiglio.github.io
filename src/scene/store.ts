import { useSyncExternalStore } from 'react';
import type { Pt } from './math';

export type Rect = { x: number; y: number; w: number; h: number };
export type ChapterRects = { object?: Rect; frame?: Rect };
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
const quads = new Map<string, Quad | null>();
const quadListeners = new Map<string, Set<(q: Quad | null) => void>>();

export const sceneStore = {
  get: () => state,
  set(patch: Partial<SceneState> | ((s: SceneState) => Partial<SceneState>)) {
    const p = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...p };
    emit();
  },
  setRect(id: string, kind: 'object' | 'frame', rect: Rect | null) {
    const current = { ...(state.rects[id] ?? {}) };
    if (rect) current[kind] = rect; else delete current[kind];
    state = { ...state, rects: { ...state.rects, [id]: current } };
    emit();
  },
  subscribe(fn: (s: SceneState) => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  setQuad(id: string, quad: Quad | null) {
    quads.set(id, quad);
    quadListeners.get(id)?.forEach((fn) => fn(quad));
  },
  getQuad(id: string): Quad | null {
    return quads.get(id) ?? null;
  },
  subscribeQuad(id: string, fn: (q: Quad | null) => void): () => void {
    let set = quadListeners.get(id);
    if (!set) {
      set = new Set();
      quadListeners.set(id, set);
    }
    set.add(fn);
    return () => { set!.delete(fn); };
  },
};

export function useSceneSelector<T>(sel: (s: SceneState) => T): T {
  return useSyncExternalStore(sceneStore.subscribe, () => sel(state), () => sel(state));
}
