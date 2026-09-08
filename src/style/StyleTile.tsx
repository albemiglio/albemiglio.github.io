import { useState } from 'react';
import { Button } from '../ui/Button';
import { StepBar } from '../flows/StepBar';

const colors = [
  ['Background', '#0B0D10'], ['Surface', '#12151B'], ['Text', '#E7E9EE'], ['Muted', '#9AA0AB'], ['Accent', '#E8E0D0'],
  ['ipcam', '#F0B24A'], ['REC', '#FF5C5C'], ['asd', '#6CCB8A'], ['pastis', '#F3A9B9'], ['med', '#5BC8C4'],
];
const steps = [
  { id: 'grid', label: 'Cameras', ms: 1200 }, { id: 'live', label: 'Live', ms: 1600 }, { id: 'ptz', label: 'Pan / tilt', ms: 1800 },
  { id: 'rec', label: 'REC', ms: 1400 }, { id: 'talk', label: 'Talk', ms: 1400 },
];

export function StyleTile() {
  const [index, setIndex] = useState(2);
  return (
    <div className="tile">
      <section>
        <h2>Colour</h2>
        <div className="swatches">
          {colors.map(([name, hex]) => (
            <div key={name} className="swatch" style={{ background: hex, color: hex === '#0B0D10' || hex === '#12151B' ? '#E7E9EE' : '#0B0D10' }}>
              {name}<br />{hex}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Type</h2>
        <p className="type-hero">Alberto Migliorato</p>
        <p className="type-chapter">Live video, without the vendor's cloud</p>
        <p className="type-body">Self-hosted video for cheap P2P IP cameras: live, recordings, two-way audio and camera control, with the protocol as measured.</p>
        <p className="type-mono">2026-09-08 14:32:07 · 36 organisations live · €150.00</p>
      </section>
      <section>
        <h2>Controls</h2>
        <p style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Button href="#" variant="primary">GitHub</Button>
          <Button href="#">LinkedIn</Button>
        </p>
        <StepBar steps={steps} index={index} playing color="#F0B24A" onSelect={setIndex} />
      </section>
      <section className="render">
        <div>
          <h2>Object · ipcam</h2>
          <p className="type-body">Rendered by Blender in the chapter's key light. The same file is the reduced-motion fallback.</p>
        </div>
        <img src="/fallback/ipcam.png" alt="Dome IP camera rendered in amber light" />
      </section>
    </div>
  );
}
