import { content } from '../content';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';

export function About() {
  const { prose, timeline, cv } = content.about;
  return (
    <section id="about" className="section">
      <Reveal>
        <div className="rail">
          <h2 className="section-title">About</h2>
          <p className="about__prose">{prose}</p>
          <ul className="timeline" id="experience" aria-label="Experience">
            {timeline.map((t) => (
              <li key={t.when + t.org}>
                <span className="timeline__when">{t.when}</span>
                <span><strong>{t.org}</strong> — {t.role}</span>
              </li>
            ))}
          </ul>
          <span id="skills" />
          <Button href={cv.href}>{cv.label}</Button>
        </div>
      </Reveal>
    </section>
  );
}
