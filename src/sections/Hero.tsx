import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { content } from '../content';
import { Button } from '../ui/Button';
import { useMotionPrefs } from '../MotionProvider';
import { useRectRegistration } from '../scene/useRectRegistration';
import { isNarrow, useSceneSelector } from '../scene/store';
import { HERO_SCREENS, cropStyle } from '../heroScreens';

// Fades out over `dur.slow` once the scene takes over, then unmounts — mirrors the chapters'
// `!sceneOpen` fallback (Chapter.tsx), but this one needs to stay on screen through its own fade
// instead of disappearing the instant the scene opens, since the sculpture blends in over the
// same box rather than snapping in.
function HeroFallback() {
  // On phones this is the hero: no 3D there (see isNarrow), so the still has to carry the same
  // message on its own — one real screen of one real product, cropped to the part that can be
  // read at this size. Its numbers come from the same list the turning panels are built from.
  const takeover = useSceneSelector((s) => s.sceneOpen && !isNarrow(s));
  const { dur } = useMotionPrefs();
  const [mounted, setMounted] = useState(!takeover);
  useEffect(() => {
    if (!takeover) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), dur.slow * 1000);
    return () => clearTimeout(t);
  }, [takeover, dur.slow]);
  if (!mounted) return null;
  const [screen] = HERO_SCREENS;
  return (
    <motion.div className="hero__still" animate={{ opacity: takeover ? 0 : 1 }} transition={{ duration: dur.slow }}>
      <img
        src={screen.src}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={screen.px[0]}
        height={screen.px[1]}
        style={cropStyle(screen)}
      />
    </motion.div>
  );
}

export function Hero() {
  const { name, title, sub, ctas } = content.hero;
  const sculptureRef = useRef<HTMLDivElement>(null);
  useRectRegistration('hero', 'object', sculptureRef);
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
        <div className="hero__sculpture" ref={sculptureRef} aria-hidden="true">
          <HeroFallback />
        </div>
      </div>
    </section>
  );
}
