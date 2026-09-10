import { lazy, Suspense } from 'react';
import { CHAPTERS } from '../chapters';
import { ObjectAnchor } from './ObjectAnchor';
import { Device } from './devices/Device';

// Lazy: each object's own code (and its useGLTF call) only loads once a chapter's object
// actually mounts, rather than up front with the rest of the scene — the same lazy-boundary
// pattern SceneMount already uses for SceneCanvas itself.
const OBJECTS = {
  ipcam: lazy(() => import('./objects/IpCamera').then((m) => ({ default: m.IpCamera }))),
  card: lazy(() => import('./objects/Card').then((m) => ({ default: m.Card }))),
  cake: lazy(() => import('./objects/Cake').then((m) => ({ default: m.Cake }))),
  capsule: lazy(() => import('./objects/Capsule').then((m) => ({ default: m.Capsule }))),
} as const;
// The cake is taller than it is wide: at the default size its cherry pokes above the object box
// into the chapter's text column.
const SIZE: Record<string, number> = { cake: 0.62 };

export function ChapterObjects({ shadows }: { shadows: boolean }) {
  return (
    <Suspense fallback={null}>
      {CHAPTERS.map((c) => {
        const Obj = OBJECTS[c.object as keyof typeof OBJECTS];
        return (
          <group key={c.id}>
            {Obj && (
              <ObjectAnchor id={c.id} size={SIZE[c.object] ?? 0.8} shadows={shadows}>
                <Obj />
              </ObjectAnchor>
            )}
            <Device id={c.id} kind={c.device} />
          </group>
        );
      })}
    </Suspense>
  );
}
