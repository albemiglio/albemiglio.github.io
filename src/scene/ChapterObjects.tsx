import { lazy, Suspense } from 'react';
import { ObjectAnchor } from './ObjectAnchor';
import { Device } from './devices/Device';

// Lazy: IpCamera's own code (and its useGLTF call) only loads once a chapter's object actually
// mounts, rather than up front with the rest of the scene — the same lazy-boundary pattern
// SceneMount already uses for SceneCanvas itself.
const IpCamera = lazy(() => import('./objects/IpCamera').then((m) => ({ default: m.IpCamera })));

export function ChapterObjects() {
  return (
    <Suspense fallback={null}>
      <ObjectAnchor id="ipcam"><IpCamera /></ObjectAnchor>
      <Device id="ipcam" kind="laptop" />
    </Suspense>
  );
}
