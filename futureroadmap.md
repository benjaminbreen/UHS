
# Future Roadmap: Map Voyager Engine

This document outlines a strategic roadmap for the continued development of the Map Voyager engine. The plan is divided into three phases, starting with immediate quality-of-life improvements and culminating in the long-term vision of a universal, educational history simulator.

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

### 2.3. Staged Implementation: Game Modes (Bridge to the World Weaver)

This phase introduces "Game Modes," a system that provides structured objectives and varied playstyles. It serves as a crucial bridge between the dynamic simulation and the long-term vision of the "World Weaver" by creating the core mechanics (Quest Engine, Assessment Engine) that the World Weaver will eventually orchestrate with greater nuance.

#### Core Components:

1.  **The Quest Engine (Procedural + LLM):**
    *   **Procedural Core:** The engine will generate basic, systemic quests based on the current world state (e.g., "A `ruined` mill needs `STONE`," "The `fortress` is low on `FOOD`," "An NPC wants a rare `ITEM` from a nearby biome").
    *   **LLM Enhancement:** A Gemini API call will take these procedural skeletons and enrich them with narrative flavor, historical context, and character-specific dialogue, making them feel unique and integrated into the scenario.

2.  **The Assessment Engine (LLM-Scored):**
    *   **Function:** This Gemini-powered service will evaluate and score player actions based on the active Game Mode. It moves beyond simple win/loss states to provide qualitative feedback.
    *   **Example:** For an "Inquiry" quest, the engine would score a player's journal entry on its historical plausibility, depth of observation, and creativity, teaching players *how to think* within a given context rather than just completing a task.

3.  **Dynamic "Sources" Tab:**
    *   **UI:** A new "Sources" tab will be added to the Left Sidebar.
    *   **Content:** This tab will dynamically display excerpts from relevant primary historical sources based on the player's current `gameMode`, `culturalZone`, and `historicalEra`. For example, selecting "Healing" mode in 14th century Europe would populate this tab with texts on the Black Death or humoral theory.

4.  **Mode-Specific Actions & UI:**
    *   Game Modes will unlock unique UI elements and actions, creating distinct gameplay loops. For example:
        *   **Healing Mode:** Enables "Diagnose" and "Treat" actions in a new `HealingModal`, a parallel to the `CombatModal`.
        *   **Debate Mode:** Adds a "Persuade" button to the `EncounterModal`.
        *   **Inquiry Mode:** Adds "Study" (opening a `StudyModal` for LLM interaction) and "Sample" actions.

#### Game Modes to Implement:

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

## 3. The Universal History Simulator (Long-Term)

This phase realizes the ultimate vision of the project: creating a deeply educational and endlessly replayable history simulator powered by a combination of robust proceduralism and advanced AI. This builds on the "Parameterized World Engine" and "World Weaver" concepts.

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

### 3.2. The "World Weaver" (LLM-Driven Scenarios)

This is the ambitious system that allows players to generate entire scenarios from natural language prompts, with content grounded in real historical sources.

*   **Phase 1: Primary Source Integration:**
    *   **Goal:** Build the knowledge base for the AI.
    *   **Tasks:** Create a database (e.g., a simple JSON file or a Supabase instance) containing metadata for dozens of primary historical sources: `title`, `author`, `year`, `tags` (`Greek`, `Egypt`, `300 BCE`, `commerce`), and a concise `summary`. This directly addresses a core concept in the `ReadMe.md`.
*   **Phase 2: "World Weaver" Scenario Generation:**
    *   **Goal:** Generate a unique, historically-grounded scenario from a player's prompt.
    *   **Tasks:**
        1.  Implement an LLM function that takes a user prompt (e.g., "A Greek merchant exploring Egypt in 300 BCE").
        2.  The LLM first parses the prompt into game parameters (`date`, `location`, `player_goal`).
        3.  It then queries the primary source database for relevant documents based on the parameters.
        4.  Finally, it generates a 150-word scenario summary and creates 2-3 **"Special NPCs"** whose backstories, personalities, and goals are directly based on the *summaries* of the retrieved primary sources.
    *   **Educational Impact:** The player isn't just in a generic "ancient" setting; they are in a specific historical context, interacting with characters whose lives are inspired by real historical texts.
*   **Phase 3: The Assessment Engine:**
    *   **Goal:** Create a gameplay loop where the player's primary skill is creative, historically-aware thinking.
    *   **Tasks:**
        1.  Create an LLM "Assessment Engine" function. It takes two inputs: the player's submitted work (e.g., a journal entry, a trade proposal) and a dynamically generated rubric.
        2.  The rubric is generated based on the quest's objectives and the `SocietalProfile` of the current map. *Example Rubric for a remedy in 1640s Europe: `{"Adherence to Humoral Theory": "50%", "Plausibility of Ingredients": "30%", "Clarity of Writing": "20%"}`.*
        3.  The LLM returns a score and qualitative feedback (e.g., "Your remedy is well-written, but mentioning bacteria is anachronistic. A physician of this era would attribute the illness to an imbalance of phlegm.").
    *   **Educational Impact:** This is the ultimate educational feature. It moves beyond rote memorization of facts and teaches players **how to think within a historical context**, making it a truly unique learning tool.
