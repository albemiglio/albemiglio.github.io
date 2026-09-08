import './sections/sections.css';
import { Hero } from './sections/Hero';
import { MoreWork } from './sections/MoreWork';
import { About } from './sections/About';
import { Contact } from './sections/Contact';

export function App() {
  return (
    <>
      <main>
        <Hero />
        <MoreWork />
        <About />
        <Contact />
      </main>
      <footer className="footer">
        <div className="rail">© {new Date().getFullYear()} Alberto Migliorato</div>
      </footer>
    </>
  );
}
