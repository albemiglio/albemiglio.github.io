import { useEffect, useRef } from 'react';
import { Chapter, type AnyChapterDef, type ChapterDef } from './Chapter';
import { useActiveChapter } from '../flows/useActiveChapter';
import { ipcamShots } from '../flows/ipcam/shots';
import { pastisShots } from '../flows/pastis/shots';
import { medShots } from '../flows/med/shots';
import { asdShots } from '../flows/asd/shots';
import type { Shot } from '../flows/ShotScene';
import { CHAPTERS, type ChapterMeta } from '../chapters';
import { useSceneProgress } from '../scene/useSceneProgress';
import { sceneStore } from '../scene/store';
import './work.css';

// The scene places a 3D device per chapter from the registry; taking the DOM frame's kind from
// the same row is what stops the two from ever disagreeing (a phone screen once had a laptop
// frame mapped onto it, which filled the viewport with a stretched interface).
const deviceOf = (id: ChapterMeta['id']) => CHAPTERS.find((c) => c.id === id)!.device;

const ipcam: ChapterDef<Shot> = {
  id: 'ipcam',
  title: "Live video, without the vendor's cloud",
  audience: 'home cameras',
  blurb: 'Client and server rebuilt from a reverse-engineered P2P protocol: live view, recordings, two-way audio and camera control, self-hosted.',
  fact: 'Protocol published as measured · github.com/albemiglio/ipcam-protocol',
  color: 'var(--c-ipcam)',
  object: 'ipcam',
  device: deviceOf('ipcam'),
  steps: ipcamShots,
  shots: true,
};

const asd: ChapterDef<Shot> = {
  id: 'asd', object: 'card', title: 'A club that runs itself between two trainings', audience: 'sports clubs',
  blurb: 'Members, medical certificates, sign-ups the families fill in themselves, fees and the receipts the accountant asks for.',
  fact: '36 organisations live · asd.albemiglio.it', color: 'var(--c-asd)', device: deviceOf('asd'), steps: asdShots, shots: true,
};

// Real screens of the running product rather than a reconstruction of it (see ShotScene).
const pastis: ChapterDef<Shot> = {
  id: 'pastis', object: 'cake', title: 'The lab knows what it is missing before the morning does', audience: 'pastry labs',
  blurb: 'Every production explodes down to the raw ingredients, so stock, purchases and orders answer one question: what has to happen today.',
  fact: 'In production at pastis.albemiglio.it', color: 'var(--c-pastis)', device: deviceOf('pastis'), steps: pastisShots, shots: true,
};

const med: ChapterDef<Shot> = {
  id: 'med', object: 'capsule', title: 'The exam, with the clock running', audience: 'medical school candidates',
  blurb: 'Simulations built like the real admission test, corrected the moment you answer, with the score broken down by subject.',
  fact: 'Live at med.albemiglio.it', color: 'var(--c-med)', device: deviceOf('med'), steps: medShots, shots: true,
};

export const chapters: AnyChapterDef[] = [ipcam, asd, pastis, med];
const ids = chapters.map((c) => c.id);

export function Work() {
  const ref = useRef<HTMLElement>(null);
  useSceneProgress(ref);
  const { activeId, register } = useActiveChapter(ids);
  useEffect(() => { sceneStore.set({ activeId }); }, [activeId]);
  return (
    <section ref={ref} id="work" className="section" aria-label="Work">
      <div className="rail"><h2 className="section-title">Work</h2></div>
      {chapters.map((c) => (
        <Chapter key={c.id} def={c} active={activeId === c.id} register={register(c.id)} />
      ))}
    </section>
  );
}
