import { content } from '../content';
import { Button } from '../ui/Button';

export function Contact() {
  const { email, links, discord } = content.contact;
  return (
    <section id="contact" className="section">
      <div className="rail">
        <h2 className="section-title">Contact</h2>
        <a className="contact__primary" href={`mailto:${email}`}>{email}</a>
        <div className="contact__rest">
          {links.map((l) => (
            <Button key={l.label} href={l.href} external>{l.label}</Button>
          ))}
          <span className="btn">Discord: {discord}</span>
        </div>
      </div>
    </section>
  );
}
