import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { content } from '../content';
import { Button } from '../ui/Button';
import { useMotionPrefs } from '../MotionProvider';
import { useRectRegistration } from '../scene/useRectRegistration';
import { useSceneSelector } from '../scene/store';

// Fades out over `dur.slow` once the scene takes over, then unmounts — mirrors the chapters'
// `!sceneOpen` fallback (Chapter.tsx), but this one needs to stay on screen through its own fade
// instead of disappearing the instant the scene opens, since the sculpture blends in over the
// same box rather than snapping in.
function HeroFallback() {
  const sceneOpen = useSceneSelector((s) => s.sceneOpen);
  const { dur } = useMotionPrefs();
  const [mounted, setMounted] = useState(!sceneOpen);
  useEffect(() => {
    if (!sceneOpen) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), dur.slow * 1000);
    return () => clearTimeout(t);
  }, [sceneOpen, dur.slow]);
  if (!mounted) return null;
  return (
    <motion.picture animate={{ opacity: sceneOpen ? 0 : 1 }} transition={{ duration: dur.slow }}>
      <source srcSet="/fallback/hero.webp" type="image/webp" />
      <img
        src="/fallback/hero.png"
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={900}
        height={900}
      />
    </motion.picture>
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
