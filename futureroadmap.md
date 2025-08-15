
# Future Roadmap: Universal History Simulator

This document outlines the strategic roadmap for transforming Map Voyager into a comprehensive educational history simulator with integrated primary sources and AI-driven scenario generation.

---

## Current Priority: Primary Source System (In Development)

See `primarysourcesroadmap.md` for detailed implementation plan. The Primary Source System is the foundation for all educational features and must be completed before World Weaver development.

---

## 1. Immediate Fixes & Refinements (Short-Term)

This phase focuses on low-hanging fruit, bug fixes, and addressing existing technical debt to solidify the foundation of the engine.

### 1.1. Bug Fixes & Code Cleanup

*   **Animation Class Name Correction:** In `components/MapDisplay.tsx`, the `MemoizedCoralReefAnimation` component uses `className="animate-reefFishSwim"`. The Tailwind CSS configuration in `index.html` defines the animation key as `reef-fish-swim`. The class name should be updated to `className="animate-reef-fish-swim"` (using kebab-case) for the animation to apply correctly.
*  
    *   Delete `generation/terrain/terrainAndBiomeGenerator.ts`.
    *   Delete `constants/mapGeneration/rendering/patterns.ts` as its logic now resides in `components/TilePatterns.tsx`.
*   **Consolidate Data Sources:** Unify data definitions to create a single source of truth. For example, biome colors defined in `utils/colorUtils.ts` should be removed, and the file should be updated to import them directly from `constants/mapGeneration/biomes/colors.ts`.

### 1.2. UI/UX Enhancements

*   **Loading State Polish:** While the "Generating World..." screen is functional, it could be made more engaging. Display a series of flavor text messages during generation, such as "Raising mountains...", "Carving rivers...", "Populating cities...", to give the user a better sense of progress.
*   **Tooltip Interactivity:** Enhance the `DevTooltip`. Allow users to click on a biome name within the tooltip to open a modal with more detailed information or historical context (similar to the current `MapDetailsModal`, but for a single biome).
*   **Settings Persistence:** User selections in the `SettingsPanel` (e.g., LLM usage, Dev Tooltip visibility) should be saved to the browser's `localStorage` so they persist between sessions.

---

## 2. Deepening the Simulation (Mid-Term)

This phase focuses on making the generated world more dynamic, interactive, and alive, building directly upon the recently added `TerrainStructures` and NPC systems.

### 2.1. Dynamic World & Economy

*   **Structure States & Player Agency:**
    *   Implement `under_construction` and `ruined` states for `TerrainStructures`.
    *   Generate quests procedurally based on these states. A `ruined` mill could generate a quest for the player to deliver `WOOD` and `STONE` to a nearby `HAMLET` to initiate repairs. Completing the quest would change the mill's state to `active`, directly impacting the local economy by starting production of `FLOUR`.
*   **Dynamic Marketplace:**
    *   The inventory in the `MarketplaceModal` should be more dynamic. Instead of a static list, its contents should be primarily determined by the `outputGoods` of nearby `TerrainStructures`.
    *   Introduce world events that affect prices. A "Blight" event could triple the price of `WHEAT`, while a "War" event could double the price of `IRON_INGOTS`.
    *   Introduce traveling NPC merchants who move goods between different map areas, creating arbitrage opportunities for the player and making the economy feel more interconnected.

### 2.2. Living NPCs

*   **NPC Schedules:** Implement the NPC scheduling concept from `ReadMe.md`. A `lumberjack` NPC anchored to a `lumber_camp` should have a procedurally generated `homeLocation` in a nearby `HAMLET`. They should travel from their home to the camp in the morning and return at night, making the world feel inhabited.
*   **Culturally-Aware Structures:** The visual appearance of structures (e.g., in `TerrainStructureBanner.tsx`) should vary based on the `culturalZone`. A `fortress` in 'East Asia' should look different from one in 'Europe'. This can be achieved by creating different SVG symbol components for each cultural style.

### 2.3. World Weaver System (Next Major Feature)

The World Weaver is an LLM-powered system that generates historically accurate scenarios from natural language prompts. It builds directly on the Primary Source System to create rich, educational gameplay experiences.

#### Implementation Phases:

**Phase 1: Scenario Generation (Weeks 3-4 after Primary Sources)**
*   **Input Processing:** Natural language → structured JSON
*   **Scenario Components:**
    - Year, location, and map settings
    - Player character role and objectives
    - 2-3 Special NPCs with historical backgrounds
    - Quest items and victory conditions
    - Relevant primary sources to surface
*   **Integration:** Hooks into existing map generation and NPC systems

**Phase 2: Dynamic Event System (Month 2)**
*   **Event Types:** Initial, triggered, random, completion
*   **Event Generation:** Based on game state, primary sources, player actions
*   **Event Effects:** Spawn NPCs/items, change factions, modify objectives

**Phase 3: Assessment Engine (Month 3)**
*   **Historical Accuracy Scoring:** Evaluate player actions against sources
*   **Qualitative Feedback:** Explain anachronisms, highlight insights
*   **Educational Modes:** Guided scenarios, required readings, accuracy constraints

#### Scenario JSON Template:
```json
{
  "scenario": {
    "year": 1780,
    "location": "Hudson Valley, New York",
    "mapSettings": {
      "center": {"x": 45, "y": 30},
      "factions": ["British Empire", "Continental Army"]
    }
  },
  "playerCharacter": {
    "role": "Continental spy",
    "startingLocation": "Patriot camp",
    "primaryObjective": "Steal British troop movements"
  },
  "specialNPCs": [
    {
      "name": "Benedict Arnold",
      "historicalContext": "[excerpt from primary source]",
      "personality": "bitter, suspicious"
    }
  ],
  "questItems": [
    {
      "id": "british-dispatches",
      "location": "British officers' tent"
    }
  ],
  "victoryConditions": {
    "primary": "Return dispatches to Continental camp",
    "optional": ["Avoid detection"]
  },
  "relevantSources": ["washington-letters", "arnold-papers"]
}
```

#### Game Modes (Implemented via World Weaver):

1.  **🧭 Exploration Mode:**
    *   **Objective:** Chart the unknown and document the world.
    *   **Scoring:** Points are awarded for discovering new map tiles, visiting every POI, and for the depth and historical curiosity of conversations with NPCs (assessed by the LLM).

2.  **💰 Commercial Mode:**
    *   **Objective:** Amass wealth and build a trade empire.
    *   **Scoring:** Points for total currency, value of inventory, acquiring 'Rare' or 'Unique' items, and successful arbitrage between markets.

3.  **🩹 Healing Mode:**
    *   **Objective:** Serve as a physician or folk healer.
    *   **Mechanics:** Utilizes new "Diagnose" and "Heal" actions. Quests involve treating sick NPCs or even animals. The `Assessment Engine` scores the historical plausibility of diagnoses and remedies (e.g., using humoral theory in a medieval context).

4.  **🗣️ Debate Mode:**
    *   **Objective:** Spread your influence and beliefs.
    *   **Mechanics:** Use the "Persuade" action to convert NPCs, city leaders, and religious figures to your `faction` and `belief system`. Success is determined by a combination of your character's `Persuasion` stat and the quality of your arguments (assessed by the LLM).

5.  **🔬 Inquiry Mode:**
    *   **Objective:** Be a natural philosopher, historian, or ethnographer.
    *   **Mechanics:** Use the "Study" action to trigger an LLM-powered mini-game of inquiry about an NPC, animal, item, or terrain feature. Use the "Sample" action to collect items. Quests involve bringing samples and findings back to a designated "university" (a customizable `government_district` tile). The `Assessment Engine` scores the quality of your written observations.

6.  **🏕️ Survival Mode:**
    *   **Objective:** Survive as long as possible.
    *   **Mechanics:** Points are simply a count of days survived. Death is the end condition. This mode emphasizes foraging, crafting, and avoiding combat.

7.  **🚶 Mundane Mode ("Boring Mode"):**
    *   **Objective:** Live a realistic life according to your procedurally generated profession and social class.
    *   **Mechanics:** The `Assessment Engine` periodically scores your actions against the expected behavior of your role. A "Blacksmith" gets points for smithing and trading, a "Farmer" for tending fields. Deviating too far from your social role may lead to negative consequences or a low score.


---

## 3. The Universal History Simulator (Long-Term Vision)

This phase realizes the ultimate vision: a deeply educational history simulator where primary sources, procedural generation, and AI create endless historically-grounded scenarios.

### 3.1. The Parameterized World Engine

The goal is to create a fully data-driven generation engine where the "rules" of a society are defined in a single, queryable object.

*   **"Societal Profiles" System:**
    *   **Goal:** Make `constants/gameData/societalProfiles.ts` the "brain" of the generator. This file will define the technological, economic, and cultural parameters of a society for a given `CulturalZone` and `HistoricalEra`.
    *   **Parameters:** It should include booleans (`isAgricultural`, `hasIronWorking`), lists (`allowedStructures`, `allowedCrops`), and naming conventions (`fortressNames`, `holyPlaceNames`).
*   **Historically-Aware Generation Logic:**
    *   **Goal:** Refactor all feature generators (`structureGenerator`, `npcGenerator`, `itemGenerator`) to first consult the relevant `SocietalProfile` for the map's context.
    *   **Educational Impact:** This prevents anachronisms and cultural impossibilities. A map for a non-agricultural society will not spawn farms. A pre-metal age society will only have access to `FLINT` or `OCHRE` quarries, not `IRON` mines. This implicitly teaches players about the interconnectedness of technology, economy, and culture.
*   **UI for Counterfactual History:**
    *   **Goal:** Empower the user to experiment with history through a high-level interface.
    *   **Implementation:** The "Configure New Map" panel will be enhanced with controls that override the historical defaults from the `SocietalProfile`. For example:
        *   A "Technology" section with toggles for `Iron Working`, `Gunpowder`, `Steam Power`, etc.
    *   **Educational Impact:** This turns the engine into a powerful tool for exploring counterfactual history. A player could ask, "What would the Roman Empire have looked like with gunpowder?" and generate a world to explore that scenario.

### 3.2. Complete Educational Platform

The convergence of all systems creates a comprehensive learning environment:

#### Integrated Systems:
*   **Primary Sources:** 800+ historical texts providing authentic context
*   **World Weaver:** Natural language scenario generation
*   **Assessment Engine:** Qualitative evaluation of historical thinking
*   **Dynamic Events:** Responsive narrative based on sources and actions

#### Educational Features:
*   **Curriculum Integration:**
    - Aligned with AP World History, IB History standards
    - Custom lesson plans for specific topics
    - Progress tracking and reporting
    
*   **Multiplayer Scenarios:**
    - Collaborative historical problem-solving
    - Competing factions in historical conflicts
    - Teacher-moderated classroom sessions

*   **Content Creator Tools:**
    - Teachers can create custom scenarios
    - Share scenario templates with community
    - Import curriculum-specific source collections

#### Monetization Model:
*   **Free Tier:** Core game with 200 public domain sources
*   **Premium ($5/month):** All 800 sources, custom uploads, advanced scenarios
*   **Educational ($50/month per classroom):** Full features plus management tools
*   **Enterprise (Custom pricing):** School district licensing, custom content

### 3.3. Technical Evolution

#### Performance at Scale:
*   **Progressive Web App:** Works offline with cached sources
*   **Cloud Saves:** Sync progress across devices
*   **Multiplayer Infrastructure:** WebRTC for peer-to-peer sessions

#### AI Integration:
*   **Local LLM Option:** Run smaller models client-side for privacy
*   **Custom Fine-Tuning:** Train on specific historical periods
*   **Multi-Modal:** Image recognition for historical artifacts

#### Platform Expansion:
*   **Mobile Apps:** Native iOS/Android for better performance
*   **VR/AR Support:** Immersive historical experiences
*   **API Platform:** Let others build on our historical data

## Implementation Timeline

### Year 1: Foundation
- **Months 1-2:** Primary Source System (Phase 1-2)
- **Months 3-4:** World Weaver Scenario Generation
- **Months 5-6:** Primary Source System (Phase 3) + Basic Assessment
- **Months 7-8:** Dynamic Event System
- **Months 9-10:** Polish, Testing, Beta Launch
- **Months 11-12:** Freemium Model Launch

### Year 2: Growth
- **Q1:** Educational partnerships, curriculum alignment
- **Q2:** Multiplayer features, collaborative scenarios
- **Q3:** Mobile apps, offline mode
- **Q4:** Enterprise features, school district tools

### Year 3: Platform
- **Q1:** Content creator marketplace
- **Q2:** VR/AR prototypes
- **Q3:** API platform launch
- **Q4:** International expansion, localization

## Success Metrics

### Technical:
- Page load time < 3 seconds
- Source fetch time < 1 second
- 99.9% uptime
- Support for 10,000 concurrent users

### Educational:
- 50% of users read at least 5 sources per session
- 30% improvement in historical knowledge tests
- 80% teacher satisfaction rating
- 10,000 students using in classrooms

### Business:
- 100,000 free users in Year 1
- 5% conversion to premium
- 100 educational licenses
- Break-even by Month 18
