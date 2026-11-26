import type { Recipe } from "./recipes";

// The days of the work in characters/future-work.ts. Most of it is projected.
export const futureRecipes: Recipe[] = [
  {
    ids: ["ai-checker"],
    rises: 8, paid: "wage", boss: "supervisor", skill: "speech", wiki: ["Human-in-the-loop"],
    day: { title: "A day checking the machine's work", steps: [
      { name: "queue", task: "Pick up the cases the software flagged", at: "workplace", scene: "craft", hours: 1 },
      { name: "check", task: "Check what the software decided, case by case", at: "workplace", scene: "craft", card: "checker-queue", hours: 6 },
      { name: "sign", task: "Sign off the cases you passed", at: "workplace", scene: "talk", card: "office-boss", hours: 1 },
    ] },
  },
  {
    ids: ["appeals-advocate"],
    rises: 8, paid: "fee", skill: "speech", wiki: ["Administrative law"],
    day: { title: "An appeal", steps: [
      { name: "hear", task: "Hear out a client the software turned down", at: "client", client: true, scene: "talk", card: "appeal-client", hours: 2 },
      { name: "draft", task: "Write the appeal", at: "home", scene: "craft", hours: 4 },
      { name: "argue", task: "Put the case to a human reviewer", at: "workplace", scene: "talk", card: "appeal-hearing", hours: 2 },
    ] },
  },
  {
    ids: ["identity-witness"],
    rises: 8, paid: "wage", boss: "supervisor", skill: "speech", wiki: ["Notary public", "Deepfake"],
    day: { title: "A day at the witness desk", steps: [
      { name: "open", task: "Open the witness desk", at: "workplace", scene: "craft", hours: 1 },
      { name: "witness", task: "See people in person and vouch that they are who they say", at: "workplace", scene: "talk", card: "witness-desk", hours: 6 },
      { name: "log", task: "Log the day's attestations", at: "workplace", scene: "craft", hours: 1 },
    ] },
  },
  {
    ids: ["remote-robot-operator"],
    rises: 6, paid: "wage", boss: "supervisor", skill: "wayfaring", wiki: ["Teleoperation"],
    day: { title: "A shift on the robot desk", steps: [
      { name: "login", task: "Log in and take over a bank of robots", at: "workplace", scene: "craft", hours: 1 },
      { name: "watch", task: "Take the controls when one gets stuck", at: "workplace", scene: "craft", card: "robot-stuck", hours: 6 },
      { name: "hand", task: "Hand the bank over to the next shift", at: "workplace", scene: "talk", hours: 1 },
    ] },
  },
  {
    ids: ["robot-mechanic"],
    rises: 7, paid: "fee", skill: "crafting", wiki: ["Robotics"], bench: ["workbench"],
    day: { title: "A robot in for repair", steps: [
      { name: "fetch", task: "Collect a robot that has broken down", at: "client", client: true, scene: "haul", hours: 1 },
      { name: "mend", task: "Find the fault and fix it", at: "home", scene: "craft", card: "robot-fault", hours: 5 },
      { name: "return", task: "Take it back and show the owner", at: "client", client: true, scene: "talk", hours: 1 },
    ] },
  },
  {
    ids: ["robot-hire-agent"],
    rises: 8, paid: "takings", skill: "trade", wiki: ["Robot as a service"],
    day: { title: "Robots out on hire", steps: [
      { name: "deliver", task: "Deliver a hired robot", at: "client", client: true, scene: "haul", hours: 2 },
      { name: "lease", task: "Set up the hire with the household", at: "client", client: true, scene: "talk", card: "robot-lease", hours: 2 },
      { name: "collect", task: "Bring back the robots whose hire is up", at: "yard", scene: "haul", hours: 3 },
    ] },
  },
  {
    ids: ["robot-fleet-owner"],
    rises: 8, paid: "takings", skill: "trade", wiki: ["Fleet management"],
    day: { title: "Minding the fleet", steps: [
      { name: "numbers", task: "Go over what each robot earned overnight", at: "home", scene: "craft", hours: 2 },
      { name: "depot", task: "Walk the depot with your mechanics", at: "yard", scene: "talk", hours: 3 },
      { name: "deal", task: "Haggle over the next batch of robots", at: "market", scene: "market", hours: 2 },
    ] },
  },
  {
    ids: ["paid-companion"],
    rises: 9, paid: "fee", skill: "speech", wiki: ["Rental family service"],
    day: { title: "A day of visits", steps: [
      { name: "visit", task: "Spend the morning with a client", at: "client", client: true, scene: "talk", card: "companion-visit", hours: 3 },
      { name: "errands", task: "Run their errands with them", at: "market", scene: "market", hours: 2 },
      { name: "sit", task: "Sit with another client through the afternoon", at: "client", client: true, scene: "talk", hours: 2 },
    ] },
  },
  {
    ids: ["end-of-life-companion"],
    rises: 8, paid: "fee", skill: "speech", wiki: ["Death doula"],
    day: { title: "A vigil", steps: [
      { name: "sit", task: "Sit with someone who is dying", at: "sick", scene: "talk", card: "vigil", hours: 5 },
      { name: "family", task: "Talk with the family", at: "client", client: true, scene: "talk", hours: 2 },
      { name: "write", task: "Write up the day for the hospice", at: "home", scene: "craft", hours: 1 },
    ] },
  },
  {
    ids: ["matchmaker"],
    rises: 9, paid: "fee", skill: "speech", wiki: ["Matchmaking"],
    day: { title: "A day of matches", steps: [
      { name: "meet", task: "Interview a new client", at: "client", client: true, scene: "talk", card: "match-client", hours: 3 },
      { name: "search", task: "Go through the people on your books", at: "home", scene: "craft", hours: 3 },
      { name: "introduce", task: "Introduce two of them over coffee", at: "market", scene: "talk", hours: 2 },
    ] },
  },
  {
    ids: ["learning-mentor"],
    rises: 7, paid: "wage", skill: "speech", wiki: ["Intelligent tutoring system"],
    day: { title: "A day at the learning centre", steps: [
      { name: "greet", task: "Greet the children and set each one going", at: "workplace", scene: "talk", hours: 1 },
      { name: "floor", task: "Keep thirty children working with their tutors", at: "workplace", scene: "talk", card: "mentor-floor", hours: 5 },
      { name: "parents", task: "See the parents at the gate", at: "workplace", scene: "talk", hours: 1 },
    ] },
  },
  {
    ids: ["data-labeller"],
    rises: 8, paid: "wage", skill: "crafting", wiki: ["Labeled data"],
    day: { title: "A day at the queue", steps: [
      { name: "login", task: "Log in to the labelling queue", at: "home", scene: "craft", hours: 1 },
      { name: "label", task: "Tag pictures, transcripts and answers for the models", at: "home", scene: "craft", card: "label-queue", hours: 6 },
      { name: "submit", task: "Submit the batch and see what it paid", at: "home", scene: "craft", hours: 1 },
    ] },
  },
  {
    ids: ["motion-demonstrator"],
    rises: 7, paid: "wage", boss: "supervisor", skill: "crafting", wiki: ["Robot learning"],
    day: { title: "A day in the capture rig", steps: [
      { name: "rig", task: "Put on the capture rig", at: "workplace", scene: "craft", hours: 1 },
      { name: "repeat", task: "Fold the same towel, again and again", at: "workplace", scene: "craft", card: "motion-rig", hours: 6 },
      { name: "review", task: "Go over the takes with the trainer", at: "workplace", scene: "talk", hours: 1 },
    ] },
  },
  {
    ids: ["mobile-money-agent", "mobile-money-agent-south-asia"],
    rises: 7, paid: "takings", skill: "trade", wiki: ["Mobile money"],
    day: { title: "A day at the kiosk", steps: [
      { name: "open", task: "Open the kiosk and count your float", at: "market", scene: "market", hours: 1 },
      { name: "serve", task: "Cash people in and out", at: "market", scene: "market", card: "float-short", hours: 6 },
      { name: "bank", task: "Take cash to the bank to top up the float", at: "market", scene: "walk", hours: 1 },
    ] },
  },
  {
    ids: ["battery-swap-attendant"],
    rises: 6, paid: "wage", boss: "supervisor", skill: "trade", wiki: ["Battery swapping"],
    day: { title: "A shift at the swap station", steps: [
      { name: "check", task: "Check every slot is charging", at: "market", scene: "craft", hours: 1 },
      { name: "swap", task: "Swap batteries for the riders", at: "market", scene: "market", card: "swap-dud", hours: 6 },
      { name: "restock", task: "Load the spent packs for the depot", at: "market", scene: "haul", hours: 1 },
    ] },
  },
  {
    ids: ["game-world-builder"],
    rises: 10, paid: "takings", skill: "crafting", wiki: ["User-generated content"],
    day: { title: "Building a world", steps: [
      { name: "build", task: "Build on your game world", at: "home", scene: "craft", hours: 5 },
      { name: "test", task: "Play it through with friends", at: "home", scene: "talk", hours: 2 },
      { name: "post", task: "Post the update and read what players say", at: "home", scene: "craft", hours: 1 },
    ] },
  },
];
