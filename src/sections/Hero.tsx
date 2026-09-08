import { content } from '../content';
import { Button } from '../ui/Button';

export function Hero() {
  const { name, title, sub, ctas } = content.hero;
  return (
    <section id="hero" className="hero">
      <div className="rail">
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
    </section>
  );
}
