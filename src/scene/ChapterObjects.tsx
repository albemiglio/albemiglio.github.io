import { lazy, Suspense } from 'react';
import { CHAPTERS } from '../chapters';
import { ObjectAnchor, type HeroSlot, type HeroTilt } from './ObjectAnchor';
import { Device } from './devices/Device';
import heroSlotsJson from './heroSlots.json';

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
// Where each object starts inside the hero sculpture box before it flies out to its chapter — see
// heroSlots.json; shared with tools/models/hero.py so the fallback render matches these numbers.
const HERO_SLOTS = heroSlotsJson as unknown as Record<string, HeroSlot>;

export function ChapterObjects({ shadows, heroTilt }: { shadows: boolean; heroTilt?: { current: HeroTilt } }) {
  return (
    <Suspense fallback={null}>
      {CHAPTERS.map((c) => {
        const Obj = OBJECTS[c.object as keyof typeof OBJECTS];
        return (
          <group key={c.id}>
            {Obj && (
              <ObjectAnchor id={c.id} size={SIZE[c.object] ?? 0.8} shadows={shadows} heroSlot={HERO_SLOTS[c.object]} heroTilt={heroTilt}>
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
