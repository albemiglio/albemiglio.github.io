import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  // (question/answer) and restarts to 30 on each fresh entry into the *question* step itself —
  // not on every tick where timer stays true, so it keeps counting down through 'answer' instead
  // of jumping back to 30. Scene only ever receives `state`; it has no way to advance the flow,
  // so "does nothing else" at zero is automatic.
  const inQuestion = state.timer && state.selected === null;
  const wasInQuestion = useRef(false);
  const [seconds, setSeconds] = useState(START_SECONDS);
  useEffect(() => {
    if (!state.timer) { setSeconds(START_SECONDS); wasInQuestion.current = false; return; }
    if (inQuestion && !wasInQuestion.current) setSeconds(START_SECONDS);
    wasInQuestion.current = inQuestion;
    if (reduced) return;
    const id = setInterval(() => setSeconds((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [state.timer, inQuestion, reduced]);

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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
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
