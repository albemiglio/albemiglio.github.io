import { lazy, Suspense } from 'react';
import { ObjectAnchor } from './ObjectAnchor';

// Lazy: GLTFLoader alone pulls ~20 KB gz of three.js classes (skinning, animation tracks, every
// texture filter, …) it needs to parse any valid glTF, regardless of what our model actually
// uses. Keeping it out of the eagerly-bundled scene chunk (see task-6-report.md) means it only
// loads once a chapter's object actually mounts — the same lazy-boundary pattern SceneMount
// already uses for SceneCanvas itself.
const IpCamera = lazy(() => import('./objects/IpCamera').then((m) => ({ default: m.IpCamera })));

export function ChapterObjects() {
  return (
    <Suspense fallback={null}>
      <ObjectAnchor id="ipcam"><IpCamera /></ObjectAnchor>
    </Suspense>
  );
}
