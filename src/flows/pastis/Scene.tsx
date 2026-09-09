import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPrefs } from '../../MotionProvider';
import { sceneStore } from '../../scene/store';
import { columns, flavours, order } from './data';
import type { PastisState } from './steps';
import './pastis.css';

// 'picked' isn't a board column on its own — the order stays put in Ready once picked up, and
// the receipt (below) is what actually changes.
const bucketOf = (column: PastisState['column']) => (column === 'picked' ? 'ready' : column);

export function PastisScene({ state }: { state: PastisState }) {
  const { dur, reduced } = useMotionPrefs();
  const bucket = bucketOf(state.column);
  const index = columns.findIndex((c) => c.id === bucket);

  const [tiers, setTiers] = useState<number>(reduced ? state.tiers : 1);
  useEffect(() => {
    if (!state.configuring) { setTiers(state.tiers); return; }
    // F4/P3-R18: reduced mode never runs this counter — the store already holds tiers:3 from
    // the step state Chapter.tsx published, which is what the 3D cake reads.
    if (reduced) { setTiers(state.tiers); return; }
    // F4/P3-R18: the 3D cake (src/scene/objects/Cake.tsx) reads stepState.pastis.tiers, not this
    // local counter — publish the displayed count on every tick so the sculpture follows it.
    // Spread from this Scene's own `state`, not from the store: Chapter's effect (the parent)
    // writes the full step state AFTER this child's effect ran, so reading the store here would
    // see the previous step and either no-op or race the parent's write.
    const publish = (n: number) => {
      sceneStore.set((s) => ({ stepState: { ...s.stepState, pastis: { ...state, tiers: n as PastisState['tiers'] } } }));
    };
    setTiers(1);
    publish(1);
    let n = 1;
    const id = setInterval(() => {
      n += 1;
      setTiers(n);
      publish(n);
      if (n >= state.tiers) clearInterval(id);
    }, dur.base * 1000);
    return () => clearInterval(id);
  }, [state.configuring, state.tiers, reduced, dur.base]);

  const [typed, setTyped] = useState(reduced ? state.lettering.length : 0);
  useEffect(() => {
    if (!state.configuring) { setTyped(state.lettering.length); return; }
    if (reduced) { setTyped(state.lettering.length); return; }
    setTyped(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= state.lettering.length) clearInterval(id);
    }, (dur.fast * 1000) / 2);
    return () => clearInterval(id);
  }, [state.configuring, state.lettering, reduced, dur.fast]);

  return (
    <div className="pastis">
      <div className="pastis__topbar">
        <span className="pastis__heading">Orders</span>
        <span className="pastis__order-id">{order.id}</span>
      </div>
      <div className="pastis__board">
        <motion.div className="pastis__columns" animate={{ x: `${(-index * 100) / 3}%` }} transition={{ duration: dur.base }}>
          {columns.map((c) => (
            <div key={c.id} className="pastis__column" data-testid={`column-${c.id}`}>
              <span className="pastis__column-label" data-status={c.id}>{c.label}</span>
              {bucket === c.id && (
                <motion.div layoutId="order" className="pastis__card" data-testid="order-card">
                  <span className="pastis__card-id">{order.id}</span>
                  <span className="pastis__card-name">{order.customer}</span>
                  {c.id === 'ready' && (
                    <span className="pastis__check" data-testid="check" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="12" height="12"><polyline points="3,8 7,12 13,4" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                    </span>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
      <AnimatePresence>
        {state.configuring && (
          <motion.div
            className="pastis__sheet"
            data-testid="configure-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: dur.base }}
          >
            <span className="pastis__sheet-handle" aria-hidden="true" />
            <h4 className="pastis__sheet-title">Configure cake</h4>
            <div className="pastis__field-row">
              <span className="pastis__field-label">Tiers</span>
              <div className="pastis__tiers">
                {[1, 2, 3].map((n) => (
                  <span key={n} aria-hidden="true" className="pastis__tier-dot" data-filled={n <= tiers} />
                ))}
                <span className="pastis__tiers-count" data-testid="tiers">{tiers}</span>
              </div>
            </div>
            <div className="pastis__field-row">
              <span className="pastis__field-label">Flavour</span>
              <div className="pastis__flavours">
                {flavours.map((f) => (
                  <button key={f} type="button" className="pastis__flavour" data-active={f === state.flavour} disabled>{f}</button>
                ))}
              </div>
            </div>
            <div className="pastis__field-row">
              <span className="pastis__field-label">On the cake</span>
              <div role="textbox" aria-readonly="true" className="pastis__lettering" data-testid="lettering">
                {state.lettering.slice(0, typed)}
                <span className="pastis__caret" aria-hidden="true" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {state.column === 'picked' && (
          <motion.div
            className="pastis__receipt"
            data-testid="receipt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.base }}
          >
            Receipt · {order.id} · picked up
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
