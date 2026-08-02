const out = document.querySelector('.term__body code');
const SEQ = [
  ['p', '$ whoami'],
  ['o', 'AI Engineer & Senior SWE'],
  ['p', '$ cat stack.json'],
  ['o', '["java", "python", "c", "rust",\n "javascript", "typescript"]'],
  ['p', '$ stats --all'],
  ['o', '~400 paying customers shipped\nLLM fine-tuning on Vertex AI\n6 languages in production'],
];
if (out) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const span = (cls, text) => {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  };
  if (reduce) {
    for (const [cls, text] of SEQ) { out.append(span(cls, text), '\n'); }
  } else {
    let li = 0;
    const nextLine = () => {
      if (li >= SEQ.length) return;
      const [cls, text] = SEQ[li++];
      const s = span(cls, '');
      out.append(s);
      let ci = 0;
      const tick = () => {
        s.textContent = text.slice(0, ci++);
        if (ci <= text.length) setTimeout(tick, cls === 'p' ? 38 : 12);
        else { out.append('\n'); setTimeout(nextLine, 260); }
      };
      tick();
    };
    nextLine();
  }
}

const yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!REDUCE) {
  // Scroll-reveal — elements rise and fade on first entry, then stay put.
  document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('reveal'));
  const revealIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('reveal--in');
      revealIO.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.setProperty('--reveal-delay', `${(i % 6) * 60}ms`);
    revealIO.observe(el);
  });

  // Customer count — counts up once the number is fully on screen.
  const countIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      const target = Number(el.dataset.count);
      const start = performance.now();
      const dur = 900;
      const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    }
  }, { threshold: 1 });
  document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));

  // Scroll progress across the bottom of the header, plus the active nav link.
  const bar = document.querySelector('.nav__progress');
  const links = [...document.querySelectorAll('.nav__links a')]
    .map(a => ({ a, sec: document.getElementById(a.getAttribute('href').slice(1)) }))
    .filter(l => l.sec);
  let queued = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    if (bar) bar.style.transform = `scaleX(${p})`;
    // Whichever section top the middle of the viewport has passed most recently
    // wins. Contact sits too near the end of the page to ever reach the middle,
    // so it takes over once we are at the bottom of the scroll.
    const mid = scrollY + innerHeight / 2;
    let active = p > 0.98 ? links.length - 1 : -1;
    if (active < 0) links.forEach((l, i) => { if (l.sec.offsetTop <= mid) active = i; });
    links.forEach((l, i) => l.a.classList.toggle('is-active', i === active));
    queued = false;
  };
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
  // Landing on a #fragment scrolls after this script runs, so settle it again.
  addEventListener('load', update);
}
