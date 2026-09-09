import { lazy, Suspense } from 'react';
import { CHAPTERS } from '../chapters';
import { ObjectAnchor } from './ObjectAnchor';
import { Device } from './devices/Device';

// Lazy: each object's own code (and its useGLTF call) only loads once a chapter's object
// actually mounts, rather than up front with the rest of the scene — the same lazy-boundary
// pattern SceneMount already uses for SceneCanvas itself. Only chapters whose object exists so
// far are listed here (Task 2 adds card/cake/capsule).
const OBJECTS = { ipcam: lazy(() => import('./objects/IpCamera').then((m) => ({ default: m.IpCamera }))) } as const;

export function ChapterObjects({ shadows }: { shadows: boolean }) {
  return (
    <Suspense fallback={null}>
      {CHAPTERS.map((c) => {
        const Obj = OBJECTS[c.object as keyof typeof OBJECTS];
        return (
          <group key={c.id}>
            {Obj && <ObjectAnchor id={c.id} shadows={shadows}><Obj /></ObjectAnchor>}
            <Device id={c.id} kind={c.device} />
          </group>
        );
      })}
    </Suspense>
  );
}
