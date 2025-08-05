
# Roadmap: Combat Sprite Overhaul

## 1. Vision & Core Principles

The goal is to elevate the combat sprites from simple placeholders to detailed, data-driven representations of the characters that are visually consistent with their high-quality procedural portraits. The sprites will retain a charming pixel-art aesthetic but with a higher fidelity that allows for meaningful customization, animation, and immersion.

### Core Principles:

-   **Visual Consistency:** The combat sprite is a core part of the "visual baseline truth." It must accurately reflect the character's `Appearance` data, including gender, build, hair style/color, facial hair, clothing, and jewelry.
-   **High-Detail Pixel Art:** The aesthetic will evolve from "blocky" to a more refined, 16-bit RPG style. This involves using a finer pixel grid to allow for more realistic proportions, clearer features, and more detailed equipment.
-   **Dynamic & Expressive:** Sprites must be animated to make combat feel active and impactful. Animations should reflect the character's actions and state (attacking, defending, idle).

---

## Status Update

### **Phase 1: High-Detail Sprites & Core Animations - COMPLETE**
-   Overhauled the `CombatSprite` component to use a high-resolution grid (`viewBox="0 0 40 40"`), establishing a refined, 16-bit RPG aesthetic.
-   Implemented data-driven rendering for core physical traits: gender, build, height, hair color/style, and facial hair are now accurately represented.
-   Added custom rendering for different clothing and armor types (`robe`, `plate`, etc.).
-   Implemented a dynamic, multi-frame CSS attack animation (`sprite-arm-swing`) for a more impactful feel.

### **Phase 2: Advanced Animation States & Weapon/Shield Rendering - COMPLETE**
-   **High-Fidelity "Squat" Aesthetic:** Refactored the sprite's visual style to be more "squat" and better-defined, aligning with the classic pixel-art RPG feel while retaining high detail. Resolved all visual bugs from the previous iteration, including detached limbs and incorrect shading.
-   **Full Data Reflection:** The sprites are now a true reflection of the character's `Appearance` data. Hair and eye colors are pulled directly from character data. Specific `facialHairStyle` types (mustache, goatee) are now rendered. Sprites now have distinct body shapes for gender, and width/posture changes based on the `build` attribute. Visible aging (gray hair) and equipped jewelry (necklaces, earrings) are now rendered.
-   **Dynamic Equipment:** Characters now visibly wield their equipped `main_hand` weapon, with distinct pixel art for swords and axes. Equipped shields are rendered on the `off_hand`.
-   **Advanced Animations:** Combat is now much more dynamic with new animations for `defending` (raising a shield), `damaged` (flinching and knockback), and a refined `idle` "breathing" motion. The `attacking` animation now incorporates a weapon swing.
