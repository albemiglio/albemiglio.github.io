import { useEffect, useRef } from 'react';
import { Chapter, type AnyChapterDef, type ChapterDef } from './Chapter';
import { useActiveChapter } from '../flows/useActiveChapter';
import { IpcamScene } from '../flows/ipcam/Scene';
import { ipcamSteps, type IpcamState } from '../flows/ipcam/steps';
import { AsdScene } from '../flows/asd/Scene';
import { asdSteps, type AsdState } from '../flows/asd/steps';
import { PastisScene } from '../flows/pastis/Scene';
import { pastisSteps, type PastisState } from '../flows/pastis/steps';
import { MedScene } from '../flows/med/Scene';
import { medSteps, type MedState } from '../flows/med/steps';
import { useSceneProgress } from '../scene/useSceneProgress';
import { sceneStore } from '../scene/store';
import './work.css';

const ipcam: ChapterDef<IpcamState> = {
  id: 'ipcam',
  title: "Live video, without the vendor's cloud",
  audience: 'home cameras',
  blurb: 'Client and server rebuilt from a reverse-engineered P2P protocol: live view, recordings, two-way audio and camera control, self-hosted.',
  fact: 'Protocol published as measured · github.com/albemiglio/ipcam-protocol',
  color: 'var(--c-ipcam)',
  object: 'ipcam',
  device: 'laptop',
  steps: ipcamSteps,
  Scene: IpcamScene,
};

const asd: ChapterDef<AsdState> = {
  id: 'asd', object: 'card', title: 'Members, fees and receipts in one place', audience: 'sports clubs',
  blurb: 'Multi-tenant management for amateur sports clubs: sign-ups, family links, fee tracking and the receipts the accountant asks for.',
  fact: '36 organisations live · asd.albemiglio.it', color: 'var(--c-asd)', device: 'laptop', steps: asdSteps, Scene: AsdScene,
};

const pastis: ChapterDef<PastisState> = {
  id: 'pastis', object: 'cake', title: 'Custom cakes from order to pick-up', audience: 'pastry shops',
  blurb: 'Order management for a pastry lab: each cake configured tier by tier, moved across the board as it is produced, and marked ready for pick-up.',
  fact: 'In production at pastis.albemiglio.it', color: 'var(--c-pastis)', device: 'phone', steps: pastisSteps, Scene: PastisScene,
};

const med: ChapterDef<MedState> = {
  id: 'med', object: 'capsule', title: 'Timed practice for the admission test', audience: 'medical school candidates',
  blurb: 'A quiz platform for the Italian medical school entrance exam: timed questions, instant review with explanations, and a running score.',
  fact: 'Live at med.albemiglio.it', color: 'var(--c-med)', device: 'phone', steps: medSteps, Scene: MedScene,
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
