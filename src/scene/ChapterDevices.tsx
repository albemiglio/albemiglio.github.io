import { CHAPTERS } from '../chapters';
import { Device } from './devices/Device';

// One 3D device per chapter, placed on the chapter's own DOM frame. The chapters used to carry a
// second 3D thing each — a cake, a card, a capsule — but those were metaphors standing next to
// captures of the actual products, and they had stopped meaning anything: once the steps began
// publishing screenshots instead of product state, every step handed the object the same pose.
export function ChapterDevices() {
  return (
    <>
      {CHAPTERS.map((c) => <Device key={c.id} id={c.id} kind={c.device} />)}
    </>
  );
}
