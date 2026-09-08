import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ease, spring } from '../../motion';
import { useMotionPrefs } from '../../MotionProvider';
import { cameras, clipLabel, liveCamera } from './data';
import type { IpcamState } from './steps';
import './ipcam.css';

const BUFFER_MS = 500;
const SHIFT_PX = 18;

export function IpcamScene({ state }: { state: IpcamState }) {
  const { dur } = useMotionPrefs();
  const [buffered, setBuffered] = useState(false);

  useEffect(() => {
    if (state.view !== 'live') { setBuffered(false); return; }
    const t = setTimeout(() => setBuffered(true), BUFFER_MS);
    return () => clearTimeout(t);
  }, [state.view]);

  return (
    <div className="ipcam">
      {state.view === 'grid' ? (
        <div className="ipcam__grid">
          {cameras.map((c) => (
            <motion.div key={c.id} className="ipcam__cam" aria-hidden="true" data-testid="cam-tile" layoutId={c.id === liveCamera.id ? 'cam' : undefined}>
              <span className="ipcam__cam-name">{c.name}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div className="ipcam__player" layoutId="cam" data-testid="player" transition={spring}>
          <AnimatePresence>
            {!buffered && (
              <motion.div key="buf" className="ipcam__buffering" data-testid="buffering" exit={{ opacity: 0 }} transition={{ duration: dur.fast }}>
                <span /><span /><span />
              </motion.div>
            )}
          </AnimatePresence>
          {buffered && (
            <>
              <motion.div
                className="ipcam__frame"
                data-testid="frame"
                data-offset={`${-state.pan},${-state.tilt}`}
                animate={{ x: -state.pan * SHIFT_PX, y: -state.tilt * SHIFT_PX }}
                transition={{ duration: dur.slow, ease: [...ease] }}
              />
              <span className="ipcam__stamp">{liveCamera.name} · 14:32:07</span>
              <AnimatePresence>
                {state.rec && (
                  <motion.span key="rec" className="ipcam__rec" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1.15, 1], opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.base }}>
                    REC
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      )}
      {state.view === 'live' && (
        <div className="ipcam__controls">
          <div className="ipcam__joy" data-testid="joystick" data-pan={state.pan} data-tilt={state.tilt} aria-hidden="true">
            <motion.span className="ipcam__knob" animate={{ x: state.pan * 10, y: state.tilt * 10 }} transition={{ duration: dur.base, ease: [...ease] }} />
          </div>
          <div className="ipcam__clips">
            <AnimatePresence>
              {Array.from({ length: state.clips }, (_, i) => (
                <motion.span key={i} className="ipcam__clip" data-testid="clip" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.base, ease: [...ease] }}>
                  {clipLabel}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className={`ipcam__talk${state.talk ? ' ipcam__talk--on' : ''}`} aria-hidden="true">
            {state.talk ? <span className="ipcam__wave" data-testid="waveform"><span /><span /><span /><span /></span> : <span>🎙</span>}
          </div>
        </div>
      )}
    </div>
  );
}
