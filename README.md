```
 _   _ _   _ _____
| | | | | | /  ___|
| | | | |_| \ `--.
| | | |  _  |`--. \
| |_| | | | /\__/ /
 \___/\_| |_\____/

 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |U|N|I|V|E|R|S|A|L| |H|I|S|T|O|R|Y|
 |S|I|M|U|L|A|T|O|R|               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

An educational history game and experiment in pushing the limits of LLM's historical fiction ability that was built by a history professor using AI coding tools (mostly Claude Code). You play as a hstorical person, either someone you choose or a procedurally generated figure — a merchant, a peasant, a scholar, or a range of other professions — navigating the daily life of a specific time and place.

This is an ongoing personal project, not a polished product. The code reflects that.

---

## What it does

- Procedurally generates world maps across 7 historical eras and 9 cultural zones, with historically-appropriate NPCs, items, diseases, and events for each
- AI-powered scenario generator (WorldWeaver): type a prompt, get a playable historical setting
- Disease system modeled on real epidemiological history, with transmission vectors and social consequences
- Interior maps for government buildings, markets, workshops, holy sites, and other settlement types
- Lots of other half-finished but potentially promising features - this codebase was a test bed for learning how to vibe code, so there is a lot of sprawl and a lot of unfinished business, but also, I think, some interesting ideas and experiments too.

## Stack

React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion, Three.js, Google Gemini API, Supabase.

## Getting started

```bash
npm install
# add API_KEY=your_gemini_key to .env
npm run dev
```

Supabase is optional. LLM features (WorldWeaver, NPC dialogue) require a Gemini API key.

## What might be useful to others

The **narrative event design** and the core **LLM narrative engine** has the most refined thinking behind it. The events went through a significant rewrite after the originals turned out preachy and morally resolved — [CLAUDE.md](./CLAUDE.md) documents the before/after. The core principle: present a specific human situation with real tradeoffs, no obvious right answer, and period-appropriate attitudes rather than modern ones ventriloquized through historical characters.

The **geography and era validation system** for the AI pipeline (`utils/generateMapAreaList.ts`, `services/worldWeaverService.ts`) shows one way to constrain LLM output against a real structured database rather than trusting it to generate valid values.

## Known issues

Many systems were built and never properly integrated into gameplay. The educational features (learning objectives, primary sources, assessment) exist but aren't well-surfaced. Lots of technical debt and spaghetti code.

## Contributing

Open to ideas! Feel free to fork, also to contact me if you're interested in collaorating. 

## About

Built by [Benjamin Breen], historian at UC Santa Cruz. 

MIT License.
