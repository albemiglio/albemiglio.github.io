import { lazy, useEffect, useRef } from 'react';
import { Chapter, type AnyChapterDef, type ChapterDef } from './Chapter';
import { useActiveChapter } from '../flows/useActiveChapter';
import { ipcamSteps, type IpcamState } from '../flows/ipcam/steps';
import { asdSteps, type AsdState } from '../flows/asd/steps';
import { pastisShots } from '../flows/pastis/shots';
import type { Shot } from '../flows/ShotScene';
import { CHAPTERS, type ChapterMeta } from '../chapters';
import { medSteps, type MedState } from '../flows/med/steps';
import { useSceneProgress } from '../scene/useSceneProgress';
import { sceneStore } from '../scene/store';
import { afterLoad, onIdle } from '../scene/useSceneGate';
import './work.css';

// The scene places a 3D device per chapter from the registry; taking the DOM frame's kind from
// the same row is what stops the two from ever disagreeing (a phone screen once had a laptop
// frame mapped onto it, which filled the viewport with a stretched interface).
const deviceOf = (id: ChapterMeta['id']) => CHAPTERS.find((c) => c.id === id)!.device;

// Lazy: each Scene is animation-heavy (motion/react + its own CSS) and only needed once its
// chapter scrolls into view — splitting it into the 'flows' chunk (vite.config.ts) keeps it off
// the initial JS path, same reasoning as SceneMount's SceneCanvas split (P3-R14/F4).
const IpcamScene = lazy(() => import('../flows/ipcam/Scene').then((m) => ({ default: m.IpcamScene })));
const AsdScene = lazy(() => import('../flows/asd/Scene').then((m) => ({ default: m.AsdScene })));
const MedScene = lazy(() => import('../flows/med/Scene').then((m) => ({ default: m.MedScene })));

// Idle-time prefetch, same after-load-then-idle timing as F1's useSceneGate: once the page has
// painted and gone idle, warm the 'flows' chunk so the first chapter scrolled to doesn't pay for
// a cold dynamic import.
function prefetchScenes(): () => void {
  let cancelIdle = () => {};
  const cancelLoad = afterLoad(() => {
    cancelIdle = onIdle(() => {
      import('../flows/ipcam/Scene');
      import('../flows/asd/Scene');
      import('../flows/med/Scene');
    });
  });
  return () => { cancelLoad(); cancelIdle(); };
}

const ipcam: ChapterDef<IpcamState> = {
  id: 'ipcam',
  title: "Live video, without the vendor's cloud",
  audience: 'home cameras',
  blurb: 'Client and server rebuilt from a reverse-engineered P2P protocol: live view, recordings, two-way audio and camera control, self-hosted.',
  fact: 'Protocol published as measured · github.com/albemiglio/ipcam-protocol',
  color: 'var(--c-ipcam)',
  object: 'ipcam',
  device: deviceOf('ipcam'),
  steps: ipcamSteps,
  Scene: IpcamScene,
};

const asd: ChapterDef<AsdState> = {
  id: 'asd', object: 'card', title: 'Members, fees and receipts in one place', audience: 'sports clubs',
  blurb: 'Multi-tenant management for amateur sports clubs: sign-ups, family links, fee tracking and the receipts the accountant asks for.',
  fact: '36 organisations live · asd.albemiglio.it', color: 'var(--c-asd)', device: deviceOf('asd'), steps: asdSteps, Scene: AsdScene,
};

// Real screens of the running product rather than a reconstruction of it (see ShotScene).
const pastis: ChapterDef<Shot> = {
  id: 'pastis', object: 'cake', title: 'The lab knows what it is missing before the morning does', audience: 'pastry labs',
  blurb: 'Every production explodes down to the raw ingredients, so stock, purchases and orders answer one question: what has to happen today.',
  fact: 'In production at pastis.albemiglio.it', color: 'var(--c-pastis)', device: deviceOf('pastis'), steps: pastisShots, shots: true,
};

const med: ChapterDef<MedState> = {
  id: 'med', object: 'capsule', title: 'Timed practice for the admission test', audience: 'medical school candidates',
  blurb: 'A quiz platform for the Italian medical school entrance exam: timed questions, instant review with explanations, and a running score.',
  fact: 'Live at med.albemiglio.it', color: 'var(--c-med)', device: deviceOf('med'), steps: medSteps, Scene: MedScene,
};

export const chapters: AnyChapterDef[] = [ipcam, asd, pastis, med];
const ids = chapters.map((c) => c.id);

export function Work() {
  const ref = useRef<HTMLElement>(null);
  useSceneProgress(ref);
  const { activeId, register } = useActiveChapter(ids);
  useEffect(() => { sceneStore.set({ activeId }); }, [activeId]);
  useEffect(prefetchScenes, []);
  return (
    <section ref={ref} id="work" className="section" aria-label="Work">
      <div className="rail"><h2 className="section-title">Work</h2></div>
      {chapters.map((c) => (
        <Chapter key={c.id} def={c} active={activeId === c.id} register={register(c.id)} />
      ))}
    </section>
  );
}
