export const content = {
  hero: {
    name: 'Alberto Migliorato',
    title: 'AI Engineer & Senior SWE',
    sub: 'From Java plugins and distributed systems to fine-tuning LLMs in production.',
    ctas: [
      { label: 'GitHub', href: 'https://github.com/albemiglio', primary: true },
      { label: 'LinkedIn', href: 'https://linkedin.com/in/albertomigliorato' },
      { label: 'Email', href: 'mailto:dev@albemiglio.it' },
    ],
  },
  moreWork: [
    { name: 'Verdica', href: 'https://github.com/verdicahq/verdica', desc: 'Team decisions as files in the repo, enforced on every pull request by a scope match and an LLM judge.', tags: 'Python · LLM · GitHub Action' },
    { name: 'Nyx', href: 'https://builtbybit.com/resources/18731', desc: 'Commercial Minecraft authentication plugin — about 400 customers, licence-protected.', tags: 'Java · commercial · security' },
    { name: 'keyward', href: 'https://github.com/albemiglio/keyward', desc: 'Claude Code plugin that intercepts API keys pasted into chat and re-submits a sanitized prompt.', tags: 'Python · AI tooling · security' },
    { name: 'ipcam-protocol', href: 'https://github.com/albemiglio/ipcam-protocol', desc: 'Self-hosted video for cheap P2P IP cameras, with the protocol as measured.', tags: 'Python · networking · reverse engineering' },
    { name: 'PowerLib', href: 'https://github.com/albemiglio/PowerLib', desc: 'One Adventure-based API across Bukkit, Spigot, Paper, BungeeCord and Velocity.', tags: 'Java · library' },
    { name: 'accounts', href: 'https://github.com/albemiglio/accounts', desc: 'Universal cross-plugin UUID migration for Minecraft.', tags: 'Java · data migration' },
    { name: 'WhatsRust', href: 'https://github.com/albemiglio/WhatsRust', desc: 'Lightweight Rust client-server messaging with reliable offline delivery.', tags: 'Rust · networking' },
  ],
  about: {
    prose: 'MSc student in Computer Engineering (AI & Data Analytics) at Politecnico di Torino. Recently AI Engineer at Nebuly, working on LLM training and inference at scale. Before AI, a senior Java developer: commercial Minecraft plugins with real customers, and founder of the Novaverse network.',
    timeline: [
      { when: 'Oct 2025 — Apr 2026', org: 'Nebuly AI', role: 'AI Engineer' },
      { when: 'Apr 2024 — Jun 2024', org: 'KPMG Italy', role: 'Data Engineering Intern' },
      { when: 'Oct 2023 — Feb 2025', org: 'Politecnico di Torino', role: 'Teaching Assistant' },
      { when: 'Jan 2022 — Present', org: 'Novaverse', role: 'Founding Partner & Head Developer' },
    ],
    cv: { label: 'Download the CV', href: '/cv.pdf' },
  },
  contact: {
    email: 'dev@albemiglio.it',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/albertomigliorato' },
      { label: 'GitHub', href: 'https://github.com/albemiglio' },
      { label: 'Telegram', href: 'https://t.me/albemiglio' },
    ],
    discord: 'albemiglio',
  },
} as const;
