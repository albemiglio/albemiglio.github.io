import { content } from '../content';
import { Reveal } from '../ui/Reveal';

export function MoreWork() {
  return (
    <section id="portfolio" className="section">
      <Reveal>
        <div className="rail">
          <h2 className="section-title">More work</h2>
          <div className="cards">
            {content.moreWork.map((w) => (
              <a key={w.name} className="card" href={w.href} target="_blank" rel="noopener">
                <h3 className="card__name">{w.name}</h3>
                <p className="card__desc">{w.desc}</p>
                <p className="card__tags">{w.tags}</p>
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
