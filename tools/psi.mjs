// Lighthouse on a CI runner is uncalibrated (a fixed 4x CPU slowdown on a slow host); the
// spec's Performance >= 90 is measured on the published page through PageSpeed Insights, whose
// lab environment is calibrated. Run after the Pages deploy; retries cover propagation.
const URL_ = process.env.PSI_URL ?? 'https://albemiglio.it/';
// The anonymous quota is shared and often exhausted: pass a key from a Google Cloud project with
// the PageSpeed Insights API enabled (repo secret PSI_API_KEY).
const KEY = process.env.PSI_API_KEY ? `&key=${process.env.PSI_API_KEY}` : '';
const MIN = { performance: 0.9, accessibility: 0.95 };
const api = (strategy) => `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(URL_)}&strategy=${strategy}&category=performance&category=accessibility${KEY}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(strategy) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(api(strategy));
    const body = await res.json();
    if (res.ok && body.lighthouseResult) return body.lighthouseResult;
    console.log(`${strategy}: attempt ${attempt} failed (${res.status}) ${body.error?.message ?? ''}`);
    await sleep(60_000);
  }
  throw new Error(`${strategy}: PageSpeed Insights unavailable`);
}

let failed = false;
for (const strategy of ['mobile', 'desktop']) {
  const lr = await run(strategy);
  const c = lr.categories, a = lr.audits;
  const perf = c.performance.score, a11y = c.accessibility.score;
  console.log(`${strategy}: performance ${perf} · accessibility ${a11y} · LCP ${a['largest-contentful-paint'].displayValue} · FCP ${a['first-contentful-paint'].displayValue} · TBT ${a['total-blocking-time'].displayValue} · CLS ${a['cumulative-layout-shift'].displayValue}`);
  if (strategy === 'mobile' && (perf < MIN.performance || a11y < MIN.accessibility)) failed = true;
}
if (failed) { console.error(`mobile scores below the gate (performance ${MIN.performance}, accessibility ${MIN.accessibility})`); process.exit(1); }
