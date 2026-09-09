import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react';
import { useMotionPrefs } from '../../MotionProvider';
import { fee as feeAmount, members, newMember, parentName } from './data';
import type { AsdState } from './steps';
import './asd.css';

export function AsdScene({ state }: { state: AsdState }) {
  const { dur, reduced } = useMotionPrefs();

  // F12a: one counter drives both fields — the name types out first, then the date of birth
  // picks up where it left off, so the two never race and there's nothing to chain/cancel.
  const [typed, setTyped] = useState(reduced ? newMember.name.length : 0);
  const [typedBirth, setTypedBirth] = useState(reduced ? newMember.birth.length : 0);
  useEffect(() => {
    if (state.typed === 0) { setTyped(0); setTypedBirth(0); return; }
    if (reduced) { setTyped(newMember.name.length); setTypedBirth(newMember.birth.length); return; }
    setTyped(0);
    setTypedBirth(0);
    const nameLen = newMember.name.length;
    const total = nameLen + newMember.birth.length;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(Math.min(i, nameLen));
      setTypedBirth(Math.min(Math.max(i - nameLen, 0), newMember.birth.length));
      if (i >= total) clearInterval(id);
    }, (dur.fast * 1000) / 2);
    return () => clearInterval(id);
  }, [state.typed, reduced, dur.fast]);

  const amount = useMotionValue(reduced && state.fee === 'paid' ? feeAmount : 0);
  const [displayAmount, setDisplayAmount] = useState(reduced && state.fee === 'paid' ? feeAmount : 0);
  useEffect(() => amount.on('change', (v) => setDisplayAmount(Math.round(v))), [amount]);
  useEffect(() => {
    if (state.fee !== 'paid') { amount.set(0); return; }
    if (reduced) { amount.set(feeAmount); return; }
    const controls = animate(amount, feeAmount, { duration: dur.slow });
    return () => controls.stop();
  }, [state.fee, reduced, dur.slow, amount]);

  return (
    <div className="asd">
      <div className="asd__sidebar" aria-hidden="true">
        <span className="asd__logo">A</span>
        <span className="asd__nav-dot asd__nav-dot--active" />
        <span className="asd__nav-dot" />
        <span className="asd__nav-dot" />
      </div>
      <div className="asd__content">
        {state.view === 'list' ? (
          <>
            <div className="asd__toolbar">
              <h4 className="asd__heading">Members</h4>
              <button type="button" className="asd__new-btn" data-highlight="">+ New member</button>
            </div>
            <ul className="asd__list">
              {members.map((m) => (
                <motion.li
                  key={m.id}
                  className="asd__row"
                  data-testid="member-row"
                  layoutId={m.name === parentName ? 'parent' : undefined}
                >
                  <span className="asd__row-name">{m.name}</span>
                  <span className="asd__row-year">{m.year}</span>
                  <span className="asd__pill">{m.fee} €</span>
                </motion.li>
              ))}
            </ul>
          </>
        ) : (
          <div className="asd__form-grid">
            <div className="asd__form-main">
              <h4 className="asd__heading">Sign-up</h4>
              <form className="asd__signup" aria-label="New member sign-up">
                <label className="asd__label">
                  Full name
                  <div role="textbox" aria-readonly="true" className="asd__field">
                    {newMember.name.slice(0, typed)}
                    <span className="asd__caret" aria-hidden="true" />
                  </div>
                </label>
                <label className="asd__label">
                  Date of birth
                  <div role="textbox" aria-readonly="true" className="asd__field">
                    {newMember.birth.slice(0, typedBirth)}
                    <span className="asd__caret" aria-hidden="true" />
                  </div>
                </label>
              </form>
              {/* F2/§9: the parent's row keeps the same layoutId="parent" from the list step
                  through here — this strip is the only place it lives while the form is up —
                  so that once `family` flips, the shared-layout transition has a real source to
                  animate from into the family card below (exactly one layoutId="parent" node
                  mounted at any time). */}
              {!state.family && (
                <div className="asd__members-strip" data-testid="members-strip">
                  <span className="asd__strip-label">Members</span>
                  <motion.div layoutId="parent" className="asd__strip-row" data-testid="parent-row">
                    <span className="asd__avatar" aria-hidden="true" />
                    {parentName}
                  </motion.div>
                </div>
              )}
              {state.family && (
                <div className="asd__family">
                  <div className="asd__family-row" data-testid="new-row">
                    <span className="asd__avatar" aria-hidden="true" />
                    {newMember.name}
                  </div>
                  <motion.div layoutId="parent" className="asd__family-card" data-testid="family-card">
                    <span className="asd__avatar" aria-hidden="true" />
                    {parentName} · parent
                  </motion.div>
                </div>
              )}
              <div className="asd__fee-row">
                <span className="asd__fee-badge" data-fee={state.fee} data-testid="fee-badge">{state.fee}</span>
                <span className="asd__amount" data-testid="amount">{displayAmount} €</span>
              </div>
            </div>
            <div className="asd__documents" data-testid="documents-col">
              <h5 className="asd__doc-heading">Documents</h5>
              <AnimatePresence>
                {state.receipt && (
                  <motion.div
                    key="doc"
                    className="asd__document"
                    data-testid="document"
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 24, opacity: 0 }}
                    transition={{ duration: dur.base }}
                  >
                    Receipt.pdf
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
