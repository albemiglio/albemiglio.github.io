import { useEffect, useRef } from 'react';
import { Chapter, type AnyChapterDef, type ChapterDef } from './Chapter';
import { useActiveChapter } from '../flows/useActiveChapter';
import { IpcamScene } from '../flows/ipcam/Scene';
import { ipcamSteps, type IpcamState } from '../flows/ipcam/steps';
import { AsdScene } from '../flows/asd/Scene';
import { asdSteps, type AsdState } from '../flows/asd/steps';
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

export const chapters: AnyChapterDef[] = [ipcam, asd];
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
