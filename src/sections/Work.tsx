import { useRef } from 'react';
import { Chapter, type AnyChapterDef, type ChapterDef } from './Chapter';
import { useActiveChapter } from '../flows/useActiveChapter';
import { ipcamShots } from '../flows/ipcam/shots';
import { medShots } from '../flows/med/shots';
import { asdShots } from '../flows/asd/shots';
import type { Shot } from '../flows/ShotScene';
import { CHAPTERS, type ChapterMeta } from '../chapters';
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
  device: deviceOf('ipcam'),
  steps: ipcamShots,
  shots: true,
};

const asd: ChapterDef<Shot> = {
  id: 'asd', title: 'A club that runs itself between two trainings', audience: 'sports clubs',
  blurb: 'Members, fees, deadlines, sponsors, kit and documents in one place, with the sign-ups families fill in themselves and the match posts for the socials.',
  fact: '36 organisations live · asd.albemiglio.it', color: 'var(--c-asd)', device: deviceOf('asd'), steps: asdShots, shots: true,
};

const med: ChapterDef<Shot> = {
  id: 'med', title: 'The exam, with the clock running', audience: 'medical school candidates',
  blurb: 'Simulations built like the real admission test, corrected the moment you answer, with the score broken down by subject.',
  fact: 'Live at med.albemiglio.it', color: 'var(--c-med)', device: deviceOf('med'), steps: medShots, shots: true,
};

export const chapters: AnyChapterDef[] = [ipcam, asd, med];
const ids = chapters.map((c) => c.id);

export function Work() {
  const ref = useRef<HTMLElement>(null);
  const { activeId, register } = useActiveChapter(ids);
  return (
    <section ref={ref} id="work" className="section" aria-label="Work">
      <div className="rail"><h2 className="section-title">Work</h2></div>
      {chapters.map((c) => (
        <Chapter key={c.id} def={c} active={activeId === c.id} register={register(c.id)} />
      ))}
    </section>
  );
}
