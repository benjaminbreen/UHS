import type { Livelihood } from "./context-types";

// Work that begins in the 2020s or is projected after 2026. Dates past the
// present are projection, not evidence: the start of work that exists now
// is documented; when it spreads or ends is a guess.

const AFRICA: Livelihood["bounds"] = [-18, -35, 52, 18];
const SOUTH_ASIA: Livelihood["bounds"] = [60, 5, 98, 37];
const EAST_ASIA: Livelihood["bounds"] = [98, 18, 146, 54];

export const futureLivelihoods: readonly Livelihood[] = [
  // M-Pesa launched in Kenya in 2007; agents with a phone and a float did the
  // cash-in and cash-out that banks would not.
  { id: "mobile-money-agent", label: "Mobile Money Agent", activity: "Minding the stall", tier: "modern", years: [2008, 2045],
    bounds: AFRICA, weight: 0.4, rank: "labouring", inventory: { water: 1, coin: 8, ledger: 1 },
    labels: [{ scope: { years: [2016, 2045], bounds: [2, 4, 15, 14] }, label: "POS Agent" }] },
  { id: "mobile-money-agent-south-asia", label: "Mobile Money Agent", activity: "Minding the stall", tier: "modern", years: [2012, 2040],
    bounds: SOUTH_ASIA, weight: 0.2, rank: "labouring", inventory: { water: 1, coin: 8, ledger: 1 } },
  // Swap stations for electric motorbikes: Gogoro in Taiwan from 2015, then
  // Kigali, Nairobi, Kampala and the Indian cities in the 2020s.
  { id: "battery-swap-attendant", label: "Battery Swap Attendant", activity: "Minding the stall", tier: "modern", years: [2022, 10001],
    bounds: [-18, -35, 146, 40],
    weight: 0.3, rank: "labouring", inventory: { water: 1, coin: 2, tool: 1 } },
  { id: "data-labeller", label: "Data Labeller", activity: "Keeping the record", tier: "modern", years: [2016, 2042],
    requires: ["computers"], weight: 0.3, rank: "labouring", inventory: { water: 1, coin: 1 } },
  { id: "game-world-builder", label: "Game World Builder", activity: "Keeping the record", tier: "modern", years: [2015, 10001],
    requires: ["computers"], ages: [13, 30], weight: 0.08, rank: "middling", inventory: { water: 1, coin: 2 } },
  // Chinese robot-training centres hire people to repeat chores in a capture
  // rig so the robots can learn them; documented in 2025-26.
  { id: "motion-demonstrator", label: "Motion Demonstrator", activity: "At the workbench", tier: "industrial", years: [2025, 2045],
    bounds: EAST_ASIA, requires: ["factories"], weight: 0.15, rank: "labouring", inventory: { water: 1, coin: 1 } },
  { id: "ai-checker", label: "AI Checker", activity: "Keeping the record", tier: "industrial", years: [2027, 10001],
    requires: ["office", "computers"], weight: 0.5, rank: "middling", inventory: { water: 1, coin: 3, briefcase: 1 } },
  { id: "remote-robot-operator", label: "Remote Robot Operator", activity: "Keeping the record", tier: "modern", years: [2026, 10001],
    requires: ["robots"], weight: 0.5, rank: "labouring", inventory: { water: 1, coin: 2 } },
  { id: "robot-mechanic", label: "Robot Mechanic", activity: "At the workbench", tier: "modern", years: [2026, 10001],
    requires: ["robots"], weight: 0.5, rank: "middling", inventory: { water: 1, coin: 3, tool: 1 } },
  { id: "robot-hire-agent", label: "Robot Hire Agent", activity: "Exchanging goods", tier: "village", years: [2026, 10001],
    requires: ["robots"], weight: 0.15, rank: "middling", inventory: { water: 1, coin: 10, ledger: 1 } },
  { id: "robot-fleet-owner", label: "Robot Fleet Owner", activity: "Minding the business", tier: "modern", years: [2026, 10001],
    requires: ["robots"], ages: [25, 80], weight: 0.05, rank: "gentry", inventory: { water: 1, coin: 40, briefcase: 1 } },
  // Contesting decisions made by software: benefits, insurance, visas.
  { id: "appeals-advocate", label: "Appeals Advocate", activity: "Keeping the record", tier: "industrial", years: [2032, 10001],
    requires: ["office"], weight: 0.2, rank: "middling", inventory: { water: 1, coin: 4, ledger: 1 } },
  // When a face and a voice can be faked, banks and courts want the person.
  { id: "identity-witness", label: "Identity Witness", activity: "Keeping the record", tier: "industrial", years: [2034, 10001],
    requires: ["office"], weight: 0.15, rank: "middling", inventory: { water: 1, coin: 3, ledger: 1 } },
  // Dating-app revenue fell for the first time in 2025.
  { id: "matchmaker", label: "Matchmaker", activity: "Minding the business", tier: "industrial", years: [2030, 10001],
    weight: 0.1, rank: "middling", inventory: { water: 1, coin: 5, ledger: 1 } },
  // Japan's rental-family agencies, grown into ordinary paid visiting.
  { id: "paid-companion", label: "Paid Companion", activity: "Household work", tier: "modern", years: [2030, 10001],
    weight: 0.2, rank: "labouring", inventory: { water: 1, coin: 2 } },
  { id: "end-of-life-companion", label: "End-of-Life Companion", activity: "Tending the sick", tier: "modern", years: [2028, 10001],
    weight: 0.08, rank: "middling", inventory: { water: 1, coin: 2 } },
  // AI tutors teach; the mentor keeps thirty children at it.
  { id: "learning-mentor", label: "Learning Centre Mentor", activity: "Keeping the record", tier: "town", years: [2035, 10001],
    requires: ["schools", "computers"], weight: 0.5, rank: "middling", inventory: { water: 1, coin: 2 } },
];
