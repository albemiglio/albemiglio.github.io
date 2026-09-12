import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { content } from '../content';
import { Button } from '../ui/Button';
import { HERO_SCREENS, cropAspect, cropStyle, type HeroScreen } from '../heroScreens';

// The ring rests, then turns: a constant spin catches every panel mid-turn, where its text is
// skewed. TURN matches the transition on .hero__ring.
const HOLD = 4200;
const TURN = 1200;
const RADIUS = 0.33; // ring radius, in half-widths of the box
// Sized by area, not longest side: otherwise a wide crop and a tall one read as different screens.
// The two figures are measured against the panel as it actually stands on the page, not derived:
// the 3D version scaled the ring for a camera at one distance and then looked at it from another,
// and the ring that shipped — the one these reproduce — is the smaller of the two.
const AREA = 1.17; // in half-widths squared
const MAX_W = 1.62;
const YAW = 8.6; // degrees of turn per unit of pointer x
const PITCH = 5.7; // degrees of lean per unit of pointer y (inverted: up leans back)
const TILT = -4.6; // the ring is seen slightly from above, so it reads as a ring and not a line
const NARROW_MAX = 900; // below this the box has no room for a ring — see sections.css

/** Half-widths of the box into container units, so every distance scales with the box. */
const hw = (n: number) => `${Math.round(n * 5000) / 100}cqw`;

function panelBox(screen: HeroScreen) {
  const aspect = cropAspect(screen);
  const w = Math.min(MAX_W, Math.sqrt(AREA * aspect));
  return { width: hw(w), height: hw(w / aspect) };
}

function HeroRing({ front }: { front: number }) {
  const stage = useRef<HTMLDivElement>(null);

  // The pointer tilt lives in two custom properties: the transition on .hero__tilt does the
  // easing, so there is no animation loop here at all.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      el.style.setProperty('--tilt-x', `${TILT - y * PITCH}deg`);
      el.style.setProperty('--tilt-y', `${x * YAW}deg`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const n = HERO_SCREENS.length;
  const step = 360 / n;
  // `front` only ever grows, so the ring keeps turning the same way instead of unwinding.
  const shown = ((front % n) + n) % n;
  return (
    <div className="hero__ring-stage" ref={stage} aria-hidden="true">
      <div className="hero__tilt">
        <div className="hero__ring" style={{ transform: `rotateY(${-front * step}deg)` }}>
          {HERO_SCREENS.map((screen, i) => (
            <div
              key={screen.src}
              className="hero__panel"
              style={{
                ...panelBox(screen),
                transform: `rotateY(${i * step}deg) translateZ(${hw(RADIUS)})`,
                // Only the front panel is lit: the other two are edge-on or facing away, and
                // their transition is what makes the turn a cross-fade.
                opacity: i === shown ? 1 : 0,
              }}
            >
              <img
                src={screen.src}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
                decoding="async"
                width={screen.px[0]}
                height={screen.px[1]}
                style={cropStyle(screen)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** On phones this is the hero, and it is also what reduced motion gets: one real screen. */
function HeroStill() {
  const [screen] = HERO_SCREENS;
  return (
    <div className="hero__still">
      <img
        src={screen.src}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={screen.px[0]}
        height={screen.px[1]}
        style={cropStyle(screen) as CSSProperties}
      />
    </div>
  );
}

/**
 * Which panel is square to the viewer, and which one the caption is allowed to name. They are
 * the same number a turn apart: the ring leaves as soon as the timer fires, and for those 1.2s
 * the panel on screen is still the old one — naming the new one early reads as a mislabel.
 */
function useFrontPanel() {
  const [front, setFront] = useState(0);
  const [named, setNamed] = useState(0);
  useEffect(() => {
    if (front === named) return;
    const t = setTimeout(() => setNamed(front), TURN);
    return () => clearTimeout(t);
  }, [front, named]);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia(`(max-width: ${NARROW_MAX - 1}px)`);
    let timer = 0;
    const arm = () => {
      clearInterval(timer);
      if (reduced.matches || narrow.matches) return;
      timer = window.setInterval(() => setFront((f) => f + 1), HOLD + TURN);
    };
    arm();
    reduced.addEventListener('change', arm);
    narrow.addEventListener('change', arm);
    return () => {
      clearInterval(timer);
      reduced.removeEventListener('change', arm);
      narrow.removeEventListener('change', arm);
    };
  }, []);
  return { front, named };
}

export function Hero() {
  const { name, title, sub, ctas } = content.hero;
  const { front, named } = useFrontPanel();
  // Named, or the hero is three anonymous fragments of interface beside a name.
  const shown = HERO_SCREENS[named % HERO_SCREENS.length] ?? HERO_SCREENS[0];
  return (
    <section id="hero" className="hero">
      <div className="rail hero__grid">
        <div className="hero__text">
          <h1 className="hero__name">{name}</h1>
          <p className="hero__title">{title}</p>
          <p className="hero__sub">{sub}</p>
          <div className="hero__cta">
            {ctas.map((c) => (
              <Button key={c.label} href={c.href} variant={'primary' in c && c.primary ? 'primary' : 'ghost'} external={!c.href.startsWith('mailto:')}>
                {c.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="hero__stage">
          <div className="hero__sculpture" aria-hidden="true">
            <HeroRing front={front} />
            <HeroStill />
          </div>
          <p className="hero__caption">{shown.label}</p>
        </div>
      </div>
    </section>
  );
}
