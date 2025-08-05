

# Map Voyager: A Universal Historical Simulation Engine

## 1. Vision & Philosophy

Map Voyager is a sophisticated procedural generation engine designed to create rich, interactive, and historically-aware worlds. It moves beyond static map generation to simulate living environments populated by dynamic NPCs and wildlife, all governed by the context of a specific time and place.

Our core philosophy is to leverage technology not just for entertainment, but as a powerful tool for learning and creative expression. We believe that the most profound educational experiences are not about memorizing facts, but about engaging with systems, assessing complex situations, and making qualitative judgments.

To this end, Map Voyager is built on two foundational pillars:
1.  **Robust Proceduralism**: The entire world, from coastlines to the professions of its inhabitants, is generated deterministically. An NPC's appearance, role, and personality traits are all generated as a cohesive whole, creating a "visual baseline truth" for that character. This ensures a consistent, performant, and fully offline-capable core experience.
2.  **LLM as an Enhancement Layer**: Large Language Models (LLMs) are used as an optional, powerful layer to add depth and enable interactions that were previously impossible. This includes generating rich, poetic descriptions, creating unique items, and—most importantly—powering dynamic dialogues by taking the procedurally generated NPC profile as a prompt. This turns historical and social roleplaying into a core gameplay mechanic.

This engine is the foundation for creating games where players win not just by clicking the right button, but by writing a convincing argument, crafting a historically accurate remedy, or thinking critically within the context of the simulated world.

---
## 2. Recent Changes & Key Architectural Shifts

The engine has recently undergone a significant refactor to streamline gameplay, enhance visual fidelity, and improve code maintainability.

*   **Unified Character Profile System**: A comprehensive, data-driven `Appearance` object is now the single source of truth for every character's visual identity. A character's physical attributes (build, height, skin/hair color), clothing, and context are generated once and used consistently across all representations (map icons, combat sprites, portraits) and narrative descriptions. This eliminates all previous inconsistencies between a character's data and their appearance.

*   **Data-Driven, Historically-Aware Clothing**: The clothing system has been overhauled. A new, extensive data file (`constants/characterData/clothing.ts`) maps cultures, eras, and wealth levels to historically appropriate garments, materials, and color palettes. This system includes graceful fallbacks to ensure contextually relevant attire is always generated.

*   **Clothing as In-Game Items**: All procedurally generated clothing is now represented as actual `Item` objects in the game world. These items can be equipped, unequipped, found as loot, and traded, fully integrating character appearance with the inventory and economy systems.

*   **Massive Data Expansion for Cultural Accuracy**: The engine's data for procedural generation has been significantly expanded to make the generated worlds feel significantly more immersive and historically plausible. This includes dozens of new, historically and regionally specific name lists, religion data mapped to specific eras, and factional data that allows for the generation of relevant dominant and secondary powers.

*   **Terrain Structures & Economy Overhaul**: The simulation now features a `Terrain Structures` system, where buildings like Fortresses, Mills, and Mining Colonies are procedurally placed.
    *   **Structure-Driven Economy**: The economy is no longer abstract. Structures produce (`outputGoods`) and consume (`inputGoods`) specific resources, directly influencing local supply and demand as calculated by the `EconomyService`.
    *   **NPC Anchoring & Factional Allegiance**: NPCs are now anchored to relevant structures (e.g., soldiers at fortresses), and fortresses project a factional `allegianceGroup`, creating dynamic territories and a foundation for strategic conflict.

*   **Direct Interaction Model (Detail Map Deprecation):** The intermediate "detail map" view has been entirely removed. Players now interact directly with points of interest on the main map via contextual modals (`FarmModal`, `MarketplaceModal`, `CityModal`) or by entering buildings to transition into procedurally generated `InteriorMap` views.

*   **Centralized Game Logic with Hooks:** Core game loops for time progression, animal/NPC AI ticks, and ambiance updates have been refactored into the `useCoreLoops` custom hook, separating concerns and centralizing state management.

*   **Enhanced Standard Map Symbols:** Urban and POI tiles are now represented by rich, procedurally generated SVG symbols (`UrbanSymbol`, `PalaceSymbol`, etc.) that are aware of the game's era and culture, making the main map more visually informative and beautiful.

---
## 3. Technical Debt & Refactoring Guide

As a rapidly evolving prototype, the codebase contains areas of technical debt. This section provides guidance for ongoing cleanup and improvement.

-   **Deprecation Cleanup:** The refactoring to a modular structure in `constants/`, `types/`, and `generation/` has left some old top-level files in place (`constants.ts`, `types.ts`, `generation/terrain/terrainAndBiomeGenerator.ts`). The next step is to perform a codebase-wide search for any remaining imports from these files, update them to point to their new, more specific locations, and then safely delete the deprecated files.
-   **Component Consolidation:** The `LensSelector.tsx` component is now defunct, with its functionality living in `LeftSidebar.tsx`. The file should be removed.
-   **Unify Data Sources:** There is some redundancy in data definitions. For example, biome colors are defined in both `constants/mapGeneration/biomes/colors.ts` and `utils/colorUtils.ts`. These should be unified into a single source of truth in the `constants` directory, and the utility functions should import from there.

---
## 4. File Hierarchy
```
/
├── ReadMe.md
├── characterroadmap.md
├── combatspriteroadmap.md
├── generativeitemicon.md
├── index.html
├── index.tsx
├── metadata.json
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── AmbianceDisplay.tsx
│   │   ├── AnimalInfoModal.tsx
│   │   ├── BeliefsPanel.tsx
│   │   ├── BottomPanel.tsx
│   │   ├── CharacterProfileModal.tsx
│   │   ├── CityBanner.tsx
│   │   ├── CityModal.tsx
│   │   ├── CoastlineOverlay.tsx
│   │   ├── CombatModal.tsx
│   │   ├── CraftingModal.tsx
│   │   ├── DevTooltip.tsx
│   │   ├── EncounterModal.tsx
│   │   ├── EquipmentPanel.tsx
│   │   ├── FarmBanner.tsx
│   │   ├── FarmPanel.tsx
│   │   ├── GamelogPanel.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── InventoryPanel.tsx
│   │   ├── ItemStatsPanel.tsx
│   │   ├── JournalPanel.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── LevelUpModal.tsx
│   │   ├── LootModal.tsx
│   │   ├── MapDetailsModal.tsx
│   │   ├── MapDisplay.tsx
│   │   ├── MapViewport.tsx
│   │   ├── MarketplaceBanner.tsx
│   │   ├── MarketplaceModal.tsx
│   │   ├── Minimap.tsx
│   │   ├── MiningModal.tsx
│   │   ├── ModalHub.tsx
│   │   ├── MyJournalPanel.tsx
│   │   ├── NarrationPanel.tsx
│   │   ├── NewItemModal.tsx
│   │   ├── NpcModal.tsx
│   │   ├── PlayerEntryPanel.tsx
│   │   ├── PointOfInterestModal.tsx
│   │   ├── RightSidebar.tsx
│   │   ├── SettlementInfoModal.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── SkillsModal.tsx
│   │   ├── TerrainStructureBanner.tsx
│   │   ├── TerrainStructureModal.tsx
│   │   ├── TileInfoModal.tsx
│   │   ├── TilePatterns.tsx
│   │   ├── TimeAwareBackground.tsx
│   │   ├── TopNavBar.tsx
│   │   ├── VictoryModal.tsx
│   │   ├── WikipediaArticle.tsx
│   │   ├── WorldMapModal.tsx
│   │   ├── interiorMap/
│   │   │   ├── FloorNavigator.tsx
│   │   │   ├── InteractionModal.tsx
│   │   │   ├── InteriorMapDisplay.tsx
│   │   │   ├── InteriorModal.tsx
│   │   │   ├── InteriorTooltip.tsx
│   │   │   ├── index.ts
│   │   │   └── symbols/
│   │   │       └── index.ts
│   │   ├── portraits/
│   │   │   ├── PortraitModal.tsx
│   │   │   ├── ProceduralPortrait.tsx
│   │   │   └── index.ts
│   │   └── symbols/
│   │       ├── AnimalCombatSprite.tsx
│   │       ├── BushSymbol.tsx
│   │       ├── CactusSymbol.tsx
│   │       ├── CliffSymbol.tsx
│   │       ├── CombatSprite.tsx
│   │       ├── CoralReefSymbol.tsx
│   │       ├── DeciduousTreeSymbol.tsx
│   │       ├── EstuarySymbol.tsx
│   │       ├── FarmSymbol.tsx
│   │       ├── FurnitureSymbol.tsx
│   │       ├── GenerativeItemIcon.tsx
│   │       ├── HillSymbol.tsx
│   │       ├── HolyPlaceSymbol.tsx
│   │       ├── MangroveSymbol.tsx
│   │       ├── MarketplaceSymbol.tsx
│   │       ├── NpcIcon.tsx
│   │       ├── PalaceSymbol.tsx
│   │       ├── PalmTreeSymbol.tsx
│   │       ├── PineTreeSymbol.tsx
│   │       ├── PlayerIcon.tsx
│   │       ├── RuinsSymbol.tsx
│   │       ├── SaltFlatsSymbol.tsx
│   │       ├── ShipIcon.tsx
│   │       ├── UrbanSymbol.tsx
│   │       ├── index.ts
│   │       └── buildings/
│   │           ├── AdobeBuilding3D.tsx
│   │           ├── AfricanRoundHut3D.tsx
│   │           ├── AztecDwelling3D.tsx
│   │           ├── BuddhistTemple3D.tsx
│   │           ├── EastAsianPagoda3D.tsx
│   │           ├── EuropeanCottage3D.tsx
│   │           ├── GeorgianRowhouse3D.tsx
│   │           ├── Igloo3D.tsx
│   │           ├── IndustrialBuilding3D.tsx
│   │           ├── IndustrialRowhouse3D.tsx
│   │           ├── Longhouse3D.tsx
│   │           ├── MedievalBuilding3D.tsx
│   │           ├── ModernSkyscraper3D.tsx
│   │           ├── NativeTeepee3D.tsx
│   │           ├── OttomanTownhouse3D.tsx
│   │           └── SouthAsianTemple3D.tsx
│   ├── constants/
│   │   ├── aiConfig.ts
│   │   ├── constants.ts
│   │   ├── index.ts
│   │   ├── structures.ts
│   │   ├── uiStrings.ts
│   │   ├── ambiance/
│   │   │   ├── biomeFragments.ts
│   │   │   ├── climateFragments.ts
│   │   │   ├── historicalEraFragments.ts
│   │   │   ├── index.ts
│   │   │   ├── interiorFragments.ts
│   │   │   ├── neighboringBiomeFragments.ts
│   │   │   ├── qualityFragments.ts
│   │   │   └── timeOfDayFragments.ts
│   │   ├── characterData/
│   │   │   ├── clothing.ts
│   │   │   ├── index.ts
│   │   │   ├── names.ts
│   │   │   ├── professions.ts
│   │   │   ├── religions.ts
│   │   │   └── startingPackages.ts
│   │   ├── gameBalance/
│   │   │   └── index.ts
│   │   ├── gameData/
│   │   │   ├── adjacencies.ts
│   │   │   ├── animals.ts
│   │   │   ├── beliefs.ts
│   │   │   ├── cities.ts
│   │   │   ├── containerLootTables.ts
│   │   │   ├── factions.ts
│   │   │   ├── geography.ts
│   │   │   ├── historyguide.ts
│   │   │   ├── index.ts
│   │   │   ├── itemDefinitions.ts
│   │   │   ├── itemLists.ts
│   │   │   ├── lootTables.ts
│   │   │   ├── metals.ts
│   │   │   ├── primarysources.ts
│   │   │   ├── proceduralCityData.ts
│   │   │   ├── skills.ts
│   │   │   ├── societalProfiles.ts
│   │   │   ├── speciesData.ts
│   │   │   ├── structureLootTables.ts
│   │   │   └── vegetationData.ts
│   │   ├── items/
│   │   │   ├── baseSprites.ts
│   │   │   └── materialPalettes.ts
│   │   └── mapGeneration/
│   │       ├── dimensions.ts
│   │       ├── generationParams.ts
│   │       ├── biomes/
│   │       │   ├── altitude.ts
│   │       │   ├── climate.ts
│   │       │   └── colors.ts
│   │       ├── features/
│   │       │   ├── harbors.ts
│   │       │   ├── rivers.ts
│   │       │   └── urban.ts
│   │       ├── qualities/
│   │       │   └── tileQualities.ts
│   │       └── rendering/
│   │           └── patterns.ts
│   ├── contexts/
│   │   ├── GameContext.tsx
│   │   ├── MapContext.tsx
│   │   ├── PlayerContext.tsx
│   │   └── UIContext.tsx
│   ├── generation/
│   │   ├── common/
│   │   │   └── npcUtils.ts
│   │   ├── interiorMap/
│   │   │   ├── index.ts
│   │   │   ├── interiorMapGenerator.ts
│   │   │   ├── furnishings/
│   │   │   │   └── furniturePlacer.ts
│   │   │   └── layouts/
│   │   │       └── roomLayoutGenerator.ts
│   │   ├── standardMap/
│   │   │   ├── standardMapGenerator.ts
│   │   │   ├── terrainAndBiomeGenerator.ts
│   │   │   ├── features/
│   │   │   │   ├── AnimalPaddockGenerator.ts
│   │   │   │   ├── EcologicalFeatureGenerator.ts
│   │   │   │   ├── FarmlandGenerator.ts
│   │   │   │   ├── HarborGenerator.ts
│   │   │   │   ├── HolyPlaceGenerator.ts
│   │   │   │   ├── PalaceGenerator.ts
│   │   │   │   ├── RiverGenerator.ts
│   │   │   │   ├── RuinGenerator.ts
│   │   │   │   ├── UrbanGenerator.ts
│   │   │   │   ├── animalGenerator.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── npcGenerator.ts
│   │   │   │   ├── roadAndPathGenerator.ts
│   │   │   │   ├── streamGenerator.ts
│   │   │   │   ├── structureGenerator.ts
│   │   │   │   └── vegetationGenerator.ts
│   │   │   └── qualities/
│   │   │       └── tileQualityCalculator.ts
│   │   └── terrain/
│   │       └── terrainAndBiomeGenerator.ts
│   ├── hooks/
│   │   ├── useCoreLoops.ts
│   │   ├── useGame.ts
│   │   ├── useGameState.ts
│   │   ├── useMapState.ts
│   │   ├── usePlayerState.ts
│   │   └── useUIState.ts
│   ├── services/
│   │   ├── ambianceGenerator.ts
│   │   ├── animalAIService.ts
│   │   ├── animalDescriptionGenerator.ts
│   │   ├── characterGenerator.ts
│   │   ├── cityDescriptionGenerator.ts
│   │   ├── cityNameGenerator.ts
│   │   ├── combatService.ts
│   │   ├── contentGenerator.ts
│   │   ├── craftingService.ts
│   │   ├── descriptionGenerator.ts
│   │   ├── ecologyService.ts
│   │   ├── economyService.ts
│   │   ├── encounterService.ts
│   │   ├── farmGenerator.ts
│   │   ├── itemDescriptionGenerator.ts
│   │   ├── llmService.ts
│   │   ├── logService.ts
│   │   ├── marketplaceDescriptionGenerator.ts
│   │   ├── npcAIService.ts
│   │   ├── npcDescriptionService.ts
│   │   ├── settlementService.ts
│   │   ├── skillService.ts
│   │   └── socialService.ts
│   ├── types/
│   │   ├── ambiance.ts
│   │   ├── animalTypes.ts
│   │   ├── characterData.ts
│   │   ├── combat.ts
│   │   ├── detailMapTypes.ts
│   │   ├── geography.ts
│   │   ├── index.ts
│   │   ├── interiorMapTypes.ts
│   │   ├── itemTypes.ts
│   │   ├── journal.ts
│   │   ├── knowledge.ts
│   │   ├── metals.ts
│   │   ├── npcTypes.ts
│   │   ├── playerCharacter.ts
│   │   ├── societal.ts
│   │   ├── skillTypes.ts
│   │   ├── structures.ts
│   │   ├── types.ts
│   │   ├── ui.ts
│   │   ├── vegetationTypes.ts
│   │   ├── biomes/
│   │   │   ├── base.ts
│   │   │   └── climate.ts
│   │   ├── core/
│   │   │   ├── geometry.ts
│   │   │   ├── map.ts
│   │   │   └── tile.ts
│   │   └── generation/
│   │       └── noise.ts
│   └── utils/
│       ├── colorUtils.ts
│       ├── dateUtils.ts
│       ├── fileUtils.ts
│       ├── geographyUtils.ts
│       ├── inventoryUtils.ts
│       ├── mapUtils.ts
│       └── noise.ts
└── gameTypes/
    └── index.ts
```

---
## 5. Core Features

-   **Multi-Scale World Generation**: The world is rendered at multiple, interconnected scales: Standard Maps (regional view) and Interior Maps (fully rendered building interiors).
-   **Dynamic Terrain Structures & Economy**: Structures like mills, mines, and fortresses are procedurally placed and drive a dynamic local economy by producing and consuming resources. They also serve as hubs for specific NPC professions and project factional allegiance.
-   **Unified, Data-Driven Character Profiles**: A comprehensive `Appearance` object serves as the definitive source for all character visual data (build, height, clothing, etc.), ensuring consistency across map icons, combat sprites, portraits, and descriptions.
-   **Time & Location Awareness**: The engine accepts a `date` and `location` to generate culturally and technologically appropriate environments, NPCs, and items.
-   **Interactive Systems**: Players explore and interact directly with points of interest via contextual modals (`FarmModal`, `MarketplaceModal`, etc.) or by entering buildings. Context-aware skills like `Observe` (LLM-powered) and `Forage` (procedural) allow for deep environmental interaction.

---
## 6. Future Roadmap

### Short-Term Feature Roadmap

These are improvements that can be implemented incrementally to enhance the existing systems.

1.  **Dynamic Map Features & Economy (1-2 turns):**
    *   **Structure States:** Implement `under_construction` and `ruined` states for `TerrainStructures`. Players could find ruined mills and be given quests to repair them by bringing resources (`WOOD`, `STONE`), changing their state to `active` and enabling their economic output.
    *   **Factional Control:** A structure's `allegianceGroup` should directly impact the local economy. A fortress belonging to the "British Empire" could increase demand for `TOOLS` and `TEXTILES`, while a "Spanish Empire" fortress might increase demand for `WINE` and `OLIVES`.
    *   **Dynamic Marketplace:** Introduce event-driven price changes. A "Blight" event could triple the price of `WHEAT`, while a "War" event could double the price of `IRON_INGOTS`. Add traveling NPC merchants who move goods between different map areas, creating arbitrage opportunities.

2.  **Increased Realism & Historical Accuracy (1-2 turns):**
    *   **NPC Schedules:** Give NPCs anchored to structures a simple daily schedule. A `lumberjack` NPC should travel from a nearby `HAMLET` to their `lumber_camp` in the morning and return at night. A `miner` should be found at the `mining_colony` during the day.
    *   **Culturally-Aware Structures:** Make the visual appearance of structures (e.g., in `TerrainStructureBanner.tsx`) vary based on the `culturalZone`. A `fortress` in 'East Asia' should resemble a pagoda-style castle, while one in 'MENA' should be an adobe or stone fort.
    *   **Historically-Aware Marketplace Inventory:** The `MarketplaceModal` inventory should be filtered based on the `era` and `culturalZone`. `POTATOES` should not be available in 'Europe' before the Columbian Exchange (c. 1500s).

### Intermediate Roadmap: The Parameterized World Engine

This stage serves as a crucial bridge between the short-term goals and the long-term vision. It involves creating a deeply customizable, data-driven generation engine that can be controlled both by a user interface and, eventually, by an LLM.

1.  **The "Societal Profiles" System:**
    *   **Goal:** Create a centralized data structure (`constants/gameData/societalProfiles.ts`) that defines the technological, economic, and cultural parameters of a society for a given `CulturalZone` and `HistoricalEra`.
    *   **Parameters:** This profile will include booleans (`isAgricultural`, `isPastoral`), lists of allowed features (`allowedStructures`, `allowedMineTypes`), and culturally-specific naming conventions (`fortressNames`, `holyPlaceNames`).
    *   **Economic Tie-Ins:** Holy sites will be defined with lists of goods they consume (e.g., `INCENSE`, `CANDLES`) and produce (e.g., `RELIGIOUS_TEXT`), tying them directly into the simulation.

2.  **Historically-Aware Generation Logic:**
    *   **Goal:** Refactor all major feature generators (`structureGenerator`, `farmlandGenerator`, `urbanGenerator`, etc.) to first consult the relevant `SocietalProfile` for the map's context.
    *   **Outcome:** This will prevent anachronisms and cultural impossibilities. A map for a non-agricultural society will not spawn farms. A pre-metal age society will only have access to `FLINT` or `OCHRE` quarries, not `IRON` mines. A non-pastoral society will not generate animal paddocks.

3.  **UI-Driven World Customization:**
    *   **Goal:** Empower the user to guide the world generation process through a high-level interface.
    *   **Implementation:** The "Configure New Map" panel will be enhanced with new controls:
        *   An **"Economic Activity"** slider: Ranging from "None" (an uninhabited world) to "Very High" (a dense, urbanized world).
        *   Toggles for **"Is Agricultural?"** and **"Is Pastoral?"**: These will allow the user to override the historical defaults from the `SocietalProfile`.

4.  **Foundation for the World Weaver:**
    *   This parameterized system is the direct precursor to the "World Weaver." The `SocietalProfile` JSON object is the exact data structure that the future LLM will be prompted to generate based on a user's natural language input. By building and testing this system with a UI first, we ensure the underlying game logic is robust, performant, and ready to be driven by an AI.

### Long-Term Feature Roadmap: The "World Weaver" System

This is the ambitious vision to create a truly universal history simulator driven by natural language.

*   **Phase 1: Scenario Initialization & Primary Source Database**
    *   **Goal:** Allow a user to define a scenario via a prompt and build the knowledge base for the AI.
    *   **Tasks:**
        1.  Create the "Prompt Parser" service. It will take a user's prompt (e.g., "A Greek merchant exploring Egypt in 300 BCE") and use an LLM to output a structured JSON seed (`date`, `location`, `mode`, `player_goal`).
        2.  Build the **Primary Source Database**. Following the conversation's logic, store only metadata (title, summary, tags, URL) in Supabase. Host the actual PDF/text files statically in the Vercel project's `/public` directory. Write a script to batch-process an initial set of 50 sources.

*   **Phase 2: World Weaver & Special NPC Generation**
    *   **Goal:** Generate a unique, historically-grounded scenario based on the player's prompt.
    *   **Tasks:**
        1.  Implement the **"World Weaver"** LLM function. It receives the JSON seed from Phase 1.
        2.  The World Weaver will query the Supabase primary source metadata for relevant documents based on the seed's tags (e.g., 'Greek', 'Egypt', '300 BCE', 'commerce').
        3.  It will then generate a 150-word scenario summary and create 2-3 **"Special NPCs"**. The prompt will instruct the LLM to base each NPC's backstory, personality, and goals directly on the *summary* of one of the retrieved primary sources.

*   **Phase 3: Procedural Quest Engine & LLM Customization**
    *   **Goal:** Create a flexible system for generating dynamic, historically-plausible quests.
    *   **Tasks:**
        1.  Define a library of procedural quest templates in `constants/` (e.g., `ESCORT`, `GATHER`, `INVESTIGATE`, `MEDIATE`). Each template will have placeholder fields like `{{NPC_NAME}}`, `{{LOCATION}}`, `{{ITEM}}`.
        2.  Create an LLM "Quest Customizer" function. It will take a procedural template and the scenario context from the World Weaver (summary, special NPCs).
        3.  The LLM's task is to fill in the template's placeholders with historically and narratively appropriate details, adding flavor text and moral ambiguity. *Example: A generic `GATHER` quest becomes "Gather rare papyrus from the dangerous marshes south of Alexandria for the scholar Ptolemy."*

*   **Phase 4: Gameplay Loop Integration**
    *   **Goal:** Make quests discoverable and playable within the game world.
    *   **Tasks:**
        1.  Integrate quest availability into UI modals. An NPC in an `EncounterModal` might offer a quest. A notice board in a `CityModal` could list available tasks.
        2.  Make `GOVERNMENT_DISTRICT` tiles functional. They will become hubs for political, bureaucratic, and legal quests (e.g., "Deliver this decree to the governor," "Testify in a trade dispute").
        3.  Link quest objectives to interactable `TerrainStructures`. *Example: A quest to "Investigate low output at the local mill" would require the player to travel to the procedurally placed `mill` structure.*

*   **Phase 5: The Assessment Engine**
    *   **Goal:** Implement the final core mechanic where player creativity and historical understanding are evaluated.
    *   **Tasks:**
        1.  Create the **"Assessment Engine"** LLM function. It will take two main inputs: the player's submitted work (e.g., a journal entry about a discovered culture) and a dynamically generated rubric (e.g., `{"Clarity": "20%", "Historical Plausibility": "50%", "Creativity": "30%"}`).
        2.  The rubric will be generated based on the quest's objectives and the `mode` of play (e.g., "Discovery" mode will heavily weight "Novelty of Observation").
        3.  The Assessment Engine will return a score and qualitative feedback (e.g., "Your entry is well-written, but mentioning potatoes in ancient Rome is anachronistic."). This feedback loop makes historically-aware roleplaying the central, measurable skill of the game.