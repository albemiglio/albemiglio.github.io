import { Chapter, type AnyChapterDef, type ChapterDef } from './Chapter';
import { useActiveChapter } from '../flows/useActiveChapter';
import { IpcamScene } from '../flows/ipcam/Scene';
import { ipcamSteps, type IpcamState } from '../flows/ipcam/steps';
import './work.css';

const ipcam: ChapterDef<IpcamState> = {
  id: 'ipcam',
  title: "Live video, without the vendor's cloud",
  audience: 'home cameras',
  blurb: 'Client and server rebuilt from a reverse-engineered P2P protocol: live view, recordings, two-way audio and camera control, self-hosted.',
  fact: 'Protocol published as measured · github.com/albemiglio/ipcam-protocol',
  color: 'var(--c-ipcam)',
  device: 'laptop',
  steps: ipcamSteps,
  Scene: IpcamScene,
};

export const chapters: AnyChapterDef[] = [ipcam];
const ids = chapters.map((c) => c.id);

export function Work() {
  const { activeId, register } = useActiveChapter(ids);
  return (
    <section id="work" className="section" aria-label="Work">
      <div className="rail"><h2 className="section-title">Work</h2></div>
      {chapters.map((c) => (
        <Chapter key={c.id} def={c} active={activeId === c.id} register={register(c.id)} />
      ))}
    </section>
  );
}
