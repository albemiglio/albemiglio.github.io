import './sections/sections.css';
import './flows/flows.css';
import { Hero } from './sections/Hero';
import { Work } from './sections/Work';
import { MoreWork } from './sections/MoreWork';
import { About } from './sections/About';
import { Contact } from './sections/Contact';
import { SceneMount } from './scene/SceneMount';

export function App() {
  return (
    <>
      <SceneMount />
      <main>
        <Hero />
        <Work />
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
