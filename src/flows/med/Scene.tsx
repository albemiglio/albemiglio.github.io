import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react';
import { useMotionPrefs } from '../../MotionProvider';
import { maxScore, questions } from './data';
import type { MedState } from './steps';
import './med.css';

const START_SECONDS = 30;

export function MedScene({ state }: { state: MedState }) {
  const { dur, reduced } = useMotionPrefs();
  const q = questions[state.question - 1];
  // Score is its own panel (P3-R9): not the review options with a number on top. The three
  // review-adjacent steps only ever land on one combination each, so the fields alone tell them
  // apart: 'answer' still has the timer running, 'review' has the review flag, and 'score' is
  // what's left once an option is picked and both of those are false.
  const showScore = state.selected !== null && !state.review && !state.timer;

  // P3-R5: a real countdown (setInterval, 1000ms) that only runs while `state.timer` is true
  // (question/answer) and resets to 30 only when a fresh question starts — `state.timer` turning
  // true, or `state.question` changing while it's already true. Deliberately NOT keyed on
  // `state.selected`/`inQuestion`, so the question -> answer transition (timer stays true, same
  // question) doesn't tear down and rebuild the interval and lose tick alignment. When `timer`
  // turns false the interval is cleared and the last displayed value is left frozen (it's hidden
  // from view anyway — the timer chip only renders while `state.timer` is true). Scene only ever
  // receives `state`; it has no way to advance the flow, so "does nothing else" at zero is
  // automatic — the interval clears itself instead of ticking past 0 (F3).
  const [seconds, setSeconds] = useState(START_SECONDS);
  useEffect(() => {
    if (!state.timer) return;
    setSeconds(START_SECONDS);
    if (reduced) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        const next = Math.max(s - 1, 0);
        if (next === 0) clearInterval(id);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.timer, state.question, reduced]);

  const scoreMv = useMotionValue(reduced && showScore ? state.score : 0);
  const [displayScore, setDisplayScore] = useState(reduced && showScore ? state.score : 0);
  useEffect(() => scoreMv.on('change', (v) => setDisplayScore(Math.round(v))), [scoreMv]);
  useEffect(() => {
    if (!showScore) { scoreMv.set(0); return; }
    if (reduced) { scoreMv.set(state.score); return; }
    const controls = animate(scoreMv, state.score, { duration: dur.slow });
    return () => controls.stop();
  }, [showScore, state.score, reduced, dur.slow, scoreMv]);

  const progress = state.score / maxScore;

  return (
    <div className="med">
      <AnimatePresence mode="popLayout" initial={false}>
        {showScore ? (
          <motion.div
            key="score"
            className="med__panel med__score-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: dur.base }}
          >
            <span className="med__score-label">Your score</span>
            <span className="med__score-value">
              <span data-testid="score">{displayScore}</span>
              <span className="med__score-max">/{maxScore}</span>
            </span>
            <div className="med__progress-track">
              <div
                className="med__progress-bar"
                data-testid="progress"
                style={{ '--progress': progress, transform: `scaleX(${progress})` } as CSSProperties}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`q${state.question}`}
            className="med__panel med__quiz-panel"
            layout
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: dur.base }}
          >
            <div className="med__topbar">
              <span className="med__question-count">Question {state.question} of {questions.length}</span>
              {state.timer && (
                <span className="med__timer-box">
                  <span className="med__timer" data-testid="timer" data-low={seconds <= 10 ? '' : undefined}>{seconds}</span>
                  <span className="med__timer-unit" aria-hidden="true">sec</span>
                </span>
              )}
            </div>
            <h5 className="med__prompt" data-testid="question-title">{q.prompt}</h5>
            <motion.ul className="med__options" layout>
              {q.options.map((o) => {
                const isSelected = o.letter === state.selected;
                const result = state.review ? (o.letter === q.correct ? 'right' : isSelected ? 'wrong' : undefined) : undefined;
                return (
                  <li key={o.letter}>
                    <button
                      type="button"
                      className="med__option"
                      data-testid={`option-${o.letter}`}
                      data-selected={isSelected ? true : undefined}
                      data-result={result}
                      disabled
                    >
                      <span className="med__option-letter">{o.letter}</span>
                      <span className="med__option-text">{o.text}</span>
                      {result === 'right' && <span className="med__option-tag">Correct</span>}
                      {result === 'wrong' && <span className="med__option-tag">Your answer</span>}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
            <AnimatePresence>
              {state.review && (
                <motion.div
                  className="med__explanation"
                  data-testid="explanation"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: dur.base }}
                >
                  {q.explanation}
                </motion.div>
              )}
            </AnimatePresence>
            {state.timer && seconds === 0 && (
              <div className="med__times-up" data-testid="times-up">Time's up</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
