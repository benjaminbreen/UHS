# Universal History Simulator

A history game built by a historian using AI coding tools. You play as an ordinary person — a merchant, a peasant, a scholar — navigating the daily life of a specific time and place, rather than commanding armies or building empires.

This is an ongoing personal project, not a polished product. The code reflects that.

---

## What it does

- Procedurally generates world maps across 7 historical eras and 9 cultural zones, with historically-appropriate NPCs, items, diseases, and events for each
- 20 playable historical figures drawn from real sources (Enheduanna, Ea-nasir, Ibn Battuta, Ada Lovelace, etc.)
- AI-powered scenario generator (WorldWeaver): type a prompt, get a playable historical setting
- Disease system modeled on real epidemiological history, with transmission vectors and social consequences
- Interior maps for government buildings, markets, workshops, holy sites, and other settlement types
- Procedural audio via Web Audio API — no audio files, everything synthesized at runtime
- ~50 short narrative "perimeter events" for ruins exploration, designed to avoid easy moral resolution

## Stack

React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion, Three.js, Google Gemini API, Supabase, Web Audio API.

## Getting started

```bash
npm install
# add API_KEY=your_gemini_key to .env
npm run dev
```

Supabase is optional. LLM features (WorldWeaver, NPC dialogue) require a Gemini API key.

## What might be useful to others

The **narrative event design** is the part I'm most confident in. The events went through a significant rewrite after the originals turned out preachy and morally resolved — the [CLAUDE.md](./CLAUDE.md) documents the before/after. The core principle: present a specific human situation with real tradeoffs, no obvious right answer, and period-appropriate attitudes rather than modern ones ventriloquized through historical characters.

The **geography and era validation system** for the AI pipeline (`utils/generateMapAreaList.ts`, `services/worldWeaverService.ts`) shows one way to constrain LLM output against a real structured database rather than trusting it to generate valid values.

## Known issues

Map generation blocks the main thread. Several large components that should be split up. Some systems were built and never properly integrated into gameplay. The educational features (learning objectives, primary sources, assessment) exist but aren't well-surfaced.

## Contributing

Historical accuracy corrections, new perimeter events, and performance improvements are all welcome. Open an issue first — many things that look arbitrary have reasons, and some things that look like bugs are modeling historical constraints.

## About

Built by [Benjamin Breen](https://twitter.com/breenicus), historian at UC Santa Cruz. Research focus: early modern history, history of science, global trade. Not a software engineer — this was built iteratively with AI coding assistance as an experiment in whether a non-programmer could build the kind of history game they wanted to play.

MIT License.
