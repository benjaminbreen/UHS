import { dueOf, elderOf, neighbours, notable, partnerWords, pickOf, pronounWords, seasonOf, temper, trade, within } from "./common";
import { coworkerOf, INDUSTRIAL, MUMBAI, worksOf } from "./plant";
import type { CharacterScope } from "../characters/context-types";
import type { Condition, PlotContext, PlotTemplate } from "./types";

/** Anyone on a wage, for strikes that called out everyone. */
const WAGED = new RegExp(`${INDUSTRIAL.source}|driver|printer|clerk|typist|shop-assistant|postman|telephone|office|secretary|electrician|plumber|construction|bricklayer|cleaner|waiter|kitchen|mechanic|labourer`);

/** Who runs the floor or the office: the side that wants everyone back at work. */
const BOSS = /manager|overseer|engineer|mill-owner|clerk|accountant|foreman/;

const BRITAIN = [-8, 49.5, 2, 59] as const;
const GENERAL_1926: CharacterScope = { years: [1926, 1927], bounds: BRITAIN };
const FLINT: CharacterScope = { years: [1937, 1938], bounds: [-87.5, 41.6, -82.3, 46] };
const BOMBAY: CharacterScope = { years: [1982, 1984], bounds: MUMBAI };
const MINERS: CharacterScope = { years: [1984, 1986], bounds: BRITAIN };
const GDANSK: CharacterScope = { years: [1980, 1981], bounds: [14, 53, 19.5, 55] };
const PARIS: CharacterScope = { years: [1968, 1969], bounds: [-5, 42.3, 8.3, 51.2] };
const CORDOBA: CharacterScope = { years: [1969, 1970], bounds: [-65.5, -32.5, -63.2, -30.5] };
const PLAZA: CharacterScope = { years: [1982, 1983], bounds: [-58.9, -35, -58, -34.3] };

/** Whether a strike was on here and now that would have called this player out. */
function striking(c: PlotContext) {
  const season = seasonOf(c);
  if (within(c, CORDOBA, PLAZA)) return trade(c, WAGED);
  if ((within(c, GENERAL_1926, PARIS) && season === "spring")) return trade(c, WAGED);
  if (within(c, FLINT) && season === "winter") return trade(c, INDUSTRIAL);
  if (within(c, GDANSK) && season === "summer") return trade(c, INDUSTRIAL);
  if (within(c, MINERS)) return trade(c, /coal-miner|^miner$/);
  if (within(c, BOMBAY)) return trade(c, /mill-worker|loom|garment|factory/);
  return false;
}

const castOf = (c: PlotContext) => {
  const friend = coworkerOf(c, "strike-friend");
  const bosses = friend ? neighbours(c).filter((a) => a.householdId !== friend.householdId && BOSS.test(a.origin?.livelihood ?? "")) : [];
  const patron = friend && (bosses.length ? pickOf(c, bosses, "strike-boss") : notable(c, (a) => a.householdId !== friend.householdId) ?? elderOf(c, friend));
  return friend && patron && { friend, patron };
};

const fired = (id: string): Condition => ({ type: "fired", id });

/** The union has called a strike, and the player has to choose a side of the gate. */
export const strike: PlotTemplate = {
  id: "strike",
  shape: "work",
  look: {
    emblem: "works",
    palette: { ink: "#140f10", fill: "#2e2426", edge: "#6e3a30", light: "#efe2da", accent: "#d84a3a" },
  },
  weight: (c) => (striking(c) && castOf(c) ? 1.2 * temper(c, "extraversion") : 0),
  cast: castOf,
  begin: (c, cast) => {
    const friend = cast.friend!, patron = cast.patron!;
    const works = worksOf(c);
    return {
      deadline: dueOf(c.clock).deadline,
      words: {
        friend: friend.name, patron: patron.name, works, Works: works.replace(/^./, (x) => x.toUpperCase()),
        ...pronounWords(friend), ...partnerWords(c).words,
      },
      refs: { friend: friend.id, patron: patron.id, ...partnerWords(c).refs },
    };
  },
  opening: [{ type: "approach", role: "friend", line: "call" }],
  developments: [
    {
      id: "gate",
      when: { type: "any", of: [{ type: "talked", role: "friend" }, { type: "working" }, { type: "since", hours: 1 }] },
      then: [{ type: "choose", line: "gate", focus: "friend", choices: [{ id: "picket" }, { id: "cross" }, { id: "away" }] }],
    },
    { id: "joined", when: fired("picket"), then: [{ type: "regard", role: "friend", delta: 1 }] },
    {
      id: "line",
      when: { type: "after", id: "picket", hours: 2 },
      then: [{ type: "choose", line: "confront", focus: "friend", choices: [{ id: "hold", check: { stat: "endurance", odds: 0.55 } }, { id: "back" }] }],
    },
    {
      id: "scab",
      when: fired("cross"),
      then: [{ type: "card", line: "scab", focus: "friend" }, { type: "regard", role: "friend", delta: -2 }, { type: "regard", role: "patron", delta: 1 }],
    },
  ],
  endings: [
    { id: "broken", when: fired("hold:failed") },
    { id: "held", when: fired("hold") },
    { id: "stood", when: fired("back") },
    { id: "crossed", when: fired("scab") },
    { id: "stayed", when: fired("away") },
    { id: "passed", when: { type: "all", of: [{ type: "due" }, { type: "not", of: fired("picket") }] } },
  ],
  wording: [
    {
      // The TUC called out over 1.5 million workers on 4 May 1926 to back the miners, and called it off after nine days; the miners stayed out until November.
      scope: GENERAL_1926,
      title: "The General Strike",
      lines: {
        intro: "The unions have called everyone out to back the miners, whose wages the owners want to cut. No trains, no buses, no newspapers. {friend} says it's the whole country this time.",
        threat: "The government has volunteers driving buses and unloading ships, students and gentlemen mostly, with police to protect them. Anyone who goes in to work is a blackleg, a strikebreaker, and nobody here forgets a blackleg.",
        call: "We're all out. Not a wheel turns until the miners get a fair deal. You're with us, aren't you?",
        gate: "There's a picket at the gate of {works} and another at the bus depot, where the volunteers are trying to get the buses out. {patron} says anyone who comes in keeps their job when this is over, and anyone who doesn't may not.",
        "away:label": "Stay home until it's over",
        confront: "A bus comes out of the depot with a student at the wheel and a policeman beside him. The pickets close up across the road.",
        "hold:label": "Stand in the road with the others",
        "hold:failed": "The police come in with truncheons. You're pushed into the gutter, and the bus goes through.",
        "back:label": "Step back onto the pavement",
        held: "The bus stops. The student gets out, red in the face, and walks back to the depot, and the street cheers. Nine days later the union leaders call it off, and the miners are left to fight on alone.",
        broken: "You go home with a cut over your eye. Nine days later the union leaders call it off, and the miners are left to fight on alone.",
        stood: "You watch the bus go through. Nine days later the union leaders call it off, and the miners are left to fight on alone.",
        scab: "{friend} sees you go through the gate and shouts \"blackleg\" after you. Half the street hears it.",
        crossed: "You worked through the strike. When it's over you still have your job, but some people won't drink with you any more.",
        stayed: "You stay home and keep your head down. When it's over, everyone has a story about the strike except you.",
      },
    },
    {
      // Autoworkers sat down inside GM's Fisher Body plants in Flint from 30 December 1936 until GM recognised the United Auto Workers on 11 February 1937.
      scope: FLINT,
      title: "The Sit-Down",
      lines: {
        aim: "Decide whether to sit down with the union.",
        intro: "In Flint the men have stopped the line at the Fisher Body plants and won't leave until General Motors recognises the union. Now the union men at {works} say it's their turn.",
        threat: "The company has a court order to clear the Flint plants, and the police have already tried tear gas on them. Anyone who sits down could be fired, or worse.",
        call: "They're sitting down in Flint and they're winning. Today we sit down here. Are you with us?",
        gate: "{friend} and the union men are going to stop the line at noon and stay inside. {patron} says the company will fire anyone who sits down, and is writing down names. The union wives are bringing food to the windows.",
        "picket:label": "Sit down with {friend}",
        "picket:then": "The line stops. {friend} shows you where to sleep: on the car seats waiting to go into the bodies.",
        "cross:label": "Stay at your machine",
        "away:label": "Walk out and go home",
        confront: "That night the police come to the gate with tear gas, and the company turns off the heat.",
        "hold:label": "Stay inside with the others",
        "hold:failed": "The gas comes in through the broken windows, and you stumble out into the snow with your eyes streaming.",
        "back:label": "Go out before they come in",
        held: "You stay inside, wrapped in car-seat padding against the cold. In February General Motors signs with the union. Nobody here has ever won anything like it.",
        broken: "You're outside when the news comes in February: General Motors has signed with the union. The men who stayed in get the credit.",
        stood: "You go home. In February General Motors signs with the union, and you join it like everyone else.",
        scab: "{friend} sees you still at your machine when the line goes quiet around you. {He} doesn't say anything. {He} doesn't have to.",
        crossed: "You kept working. When the union wins you're in it like everyone else, but the men who sat down remember who didn't.",
        stayed: "You stay home and wait to see who wins. The union does.",
      },
    },
    {
      // Led by Datta Samant, about 250,000 mill workers struck from January 1982; the strike was never called off, and most never got their jobs back.
      scope: BOMBAY,
      title: "The Mill Strike",
      lines: {
        intro: "Every mill in Girangaon is out. Datta Samant, the doctor who leads the union, says the workers will stay out until they get a proper wage. It has been months.",
        threat: "The owners are moving work to the powerlooms in Bhiwandi and hiring new men. Families are running out of money.",
        partner: "Your {partnerKin} {partner} has pawned the last of the gold.",
        call: "Doctor-saheb says hold on, so we hold on. Come to the gate. They're bringing in outsiders today.",
        gate: "The owners are bringing in new workers today under police guard. {friend} and the others are at the gate of {works} to stop them. {patron} says anyone who comes back now gets their job back, and anyone who doesn't, won't.",
        "picket:label": "Stand at the mill gate with {friend}",
        "cross:label": "Go back to work",
        "away:label": "Go home to the village until it's over",
        confront: "A lorry full of new workers comes up the lane with a police van behind it.",
        "hold:label": "Stand in front of the lorry with the others",
        "hold:failed": "The police push through and the lorry goes in. A constable takes your name.",
        "back:label": "Let them through",
        held: "The lorry turns round. It's a small win in a long strike. In the end the strike is never called off: it fades, and most of the mills never take the strikers back.",
        broken: "The new men go in. The strike goes on for months more, and in the end most of the mills never take the strikers back.",
        stood: "The new men go in. The strike is never called off; it fades, and most of the mills never take the strikers back.",
        scab: "{friend} sees you going in past the police. On the landing of your chawl, the tenement where you live, people stop talking when you pass.",
        crossed: "You have a wage again, and your name is on the mill's list. Not everyone on your landing will speak to you.",
        stayed: "You take the train south to the village. Plenty of people who went home that year never came back to the mills.",
      },
    },
    {
      // The NUM struck from March 1984 to March 1985 without a national ballot; most Nottinghamshire pits kept working.
      scope: MINERS,
      title: "The Miners' Strike",
      lines: {
        intro: "The pits are out against the closures, and it has been months. There was never a national ballot, so some pits are still working, and every day the pickets go to try to stop them.",
        threat: "There's no strike pay. Families are living on soup kitchens and food parcels, and the men who go back get a bonus and a police escort.",
        partner: "Your {partnerKin} {partner} is helping run the soup kitchen at the welfare hall.",
        call: "We're going to the gate at five, before the bus comes. If the scabs get in, the strike's finished.",
        gate: "{friend} and the others are going to picket the gate at {works}, where a bus brings in the men who've gone back. The Coal Board has written to every miner offering a bonus to anyone back before Christmas, and {patron} is making sure everyone has read it.",
        "picket:label": "Go to the gate with {friend}",
        "cross:label": "Go back to work",
        "away:label": "Help at the soup kitchen instead",
        confront: "The bus comes up the lane with wire mesh over its windows and lines of police in front of it.",
        "hold:label": "Push against the police line with the others",
        "hold:failed": "A snatch squad drags you out of the crowd. You spend the night in a cell, charged with breach of the peace.",
        "back:label": "Stand back and shout",
        held: "For a minute the line holds and the bus has to stop. Then it goes through. The strike ends in March without a deal, and the pits start closing anyway.",
        broken: "The magistrates bind you over to keep the peace. The strike ends in March without a deal, and the pits start closing anyway.",
        stood: "The bus goes through, as it does every day. The strike ends in March without a deal.",
        scab: "Someone has painted SCAB on your front wall. {friend} doesn't come round any more.",
        crossed: "You ride in on the bus behind the mesh. When the strike ends you still have a job, and some people in the village never speak to you again.",
        stayed: "You spend the day at the welfare hall peeling potatoes for the soup kitchen.",
      },
    },
    {
      // The Lenin Shipyard struck on 14 August 1980; the Gdańsk Agreement of 31 August allowed Solidarity, the first independent union in the Soviet bloc.
      scope: GDANSK,
      title: "The Shipyard Strike",
      lines: {
        intro: "The Lenin Shipyard in Gdańsk has stopped work and shut its gates. The strike committee has twenty-one demands, starting with a free trade union. Every workplace on the coast is joining.",
        threat: "In 1970 the army shot strikers on this coast. Nobody knows what Moscow will do this time.",
        call: "We're occupying {works}. We stay in until they sign. Are you coming?",
        gate: "{friend} and the others are staying inside {works} day and night. Families bring food to the gate, and priests say Mass there. {patron} brings word from the management: anyone who leaves now keeps their job, and the strike committee will be dealt with.",
        "picket:label": "Stay inside with {friend}",
        "picket:then": "{friend} finds you a place to sleep on the floor of the hall, under the list of demands.",
        "cross:label": "Leave, as {patron} says",
        "away:label": "Go home and wait",
        confront: "A rumour goes round that the militia are coming to clear the gates. People say to send the women and children home.",
        "hold:label": "Stay at the gate",
        "hold:failed": "You stay, but by midnight your nerve goes and you slip out through the fence.",
        "back:label": "Go home for the night",
        held: "The militia never come. On 31 August the government signs, and the union is legal. You were inside when it happened.",
        broken: "You were at home when they signed on 31 August. You join the new union along with ten million others.",
        stood: "You are at home when the news comes on 31 August: the government has signed, and there will be a free union.",
        scab: "{friend} sees you leave with the managers. Nobody inside looks at you.",
        crossed: "When Solidarity is legal nearly everyone joins, you included. People know who was inside and who wasn't.",
        stayed: "You stay home listening to Radio Free Europe. On 31 August the government signs.",
      },
    },
    {
      // In May 1968 some ten million French workers struck and occupied their workplaces; Renault-Billancourt rejected the Grenelle wage deal on 27 May.
      scope: PARIS,
      title: "May '68",
      lines: {
        intro: "The students have been fighting the police in the Latin Quarter for a week, and now the factories are out. Renault is occupied. The whole country has stopped.",
        threat: "No petrol, no post, no trains. De Gaulle has left Paris, and nobody knows what happens next.",
        call: "We're occupying {works}. Red flag on the gate and nobody leaves. Are you coming?",
        gate: "{friend} and the others are occupying {works}, sleeping on the floor and playing cards by the machines. {patron} says it's a holiday that will end with everyone on half pay.",
        "picket:label": "Join the occupation with {friend}",
        "picket:then": "{friend} deals you into the card game.",
        "cross:label": "Tell {patron} you want to work",
        "away:label": "Go home and wait it out",
        confront: "The union men come back from the talks at Grenelle with a deal: the lowest wages up by a third, and something for everyone else. They put it to the vote.",
        "hold:label": "Vote to stay out for more",
        "hold:failed": "You vote to stay out, but most hands go up for the deal.",
        "back:label": "Vote to take the deal",
        held: "{Works} votes no and stays out. In June the strike ends with bigger raises than anyone has had in years, and de Gaulle wins the election anyway.",
        broken: "The deal goes through. You're back at work in June with more money than before.",
        stood: "By mid-June everyone is back at work with more money than before, and de Gaulle wins the election by a landslide.",
        scab: "{friend} sees you talking to {patron} and spits on the ground.",
        crossed: "There's no work to be done while {works} is occupied. You go home with nothing to show for it, and people know whose side you took.",
        stayed: "You spend the strike at home with the radio. In June everyone goes back with a raise, you included.",
      },
    },
    {
      // On 29 May 1969 Córdoba's car and power workers struck and marched on the city centre with the students; the army retook the city the next day.
      scope: CORDOBA,
      title: "The Cordobazo",
      lines: {
        intro: "The car workers and the power workers have called a general strike against the military government. They're marching on the city centre today, and the students are with them.",
        threat: "This is a military government. Two weeks ago the police shot a student dead in Corrientes.",
        call: "We're marching on the centre at eleven. Everyone. Are you coming?",
        gate: "{friend} and the others are walking out of {works} to march. {patron} says anyone who leaves will lose the day's pay, and maybe more.",
        "picket:label": "March with {friend}",
        "cross:label": "Stay at work",
        "away:label": "Go home and stay off the streets",
        confront: "The police charge the march with horses and tear gas. A car worker, Máximo Mena, is shot dead. People are building barricades and setting cars alight.",
        "hold:label": "Stay at the barricades",
        "hold:failed": "Soldiers come into the city that evening. You're picked up in a sweep and held for two days.",
        "back:label": "Get home before the army comes",
        held: "For a day the workers and students hold the city centre. The army takes it back the next day. Within a year the general who runs the country is gone, and people say the Cordobazo did it.",
        broken: "They let you go without charge. Within a year the general who runs the country is gone, and people say the Cordobazo did it.",
        stood: "You get home before the army arrives. Within a year the general who runs the country is gone, and people say the Cordobazo did it.",
        scab: "{friend} sees you still at your bench when everyone else has gone, and doesn't look back.",
        crossed: "You worked while the city burned. When people talk about the Cordobazo, you keep quiet.",
        stayed: "You stay home with the shutters down, listening to the sirens.",
      },
    },
    {
      // On 30 March 1982 the CGT marched on the Plaza de Mayo for "peace, bread and work"; police arrested thousands, and three days later the junta invaded the Falklands.
      scope: PLAZA,
      title: "Peace, Bread and Work",
      lines: {
        intro: "The CGT, the main union federation, has called a strike and a march on the Plaza de Mayo against the junta. It's the first big protest since the generals took over.",
        threat: "People who protest under this government have disappeared. Everyone knows it, and they're going anyway.",
        call: "We're marching to the Plaza today. Peace, bread and work. Are you with us?",
        gate: "{friend} and the others are walking out of {works} to join the march. {patron} says anyone who goes will lose the day's pay, and that the police will be taking names.",
        "picket:label": "March with {friend}",
        "cross:label": "Stay at work",
        "away:label": "Go home and stay off the streets",
        confront: "On the Avenida de Mayo the police fire tear gas and charge. People are being thrown into police vans.",
        "hold:label": "Keep going towards the Plaza",
        "hold:failed": "You're pushed into a van and held overnight at the police station. They let you go in the morning.",
        "back:label": "Get out down a side street",
        held: "You get close enough to hear the chanting in the Plaza before the gas comes. Three days later the junta invades the Malvinas, the Falkland Islands, and the whole country is waving flags.",
        broken: "Three days later the junta invades the Malvinas, the Falkland Islands, and nobody talks about the march any more.",
        stood: "You get home with your eyes stinging. Three days later the junta invades the Malvinas, the Falkland Islands, and nobody talks about the march any more.",
        scab: "{friend} sees you still at work when everyone else has gone, and doesn't look back.",
        crossed: "You kept working. Three days later the junta invades the Malvinas, and nobody talks about the march any more.",
        stayed: "You stay home and listen to the news on the radio, which says almost nothing.",
      },
    },
    {
      title: "The Picket Line",
      lines: {
        aim: "Decide whether you're with the strike.",
        intro: "The union has called a strike at {works}. {friend} and the others are at the gate.",
        threat: "The owners say anyone who stays out may have no job to come back to. The strikers say anyone who goes in is a scab, a strikebreaker, and won't be forgotten.",
        partner: "Your {partnerKin} {partner} wants to know how long you can go without a wage.",
        "kin-partner": "Are you going in tomorrow or not? Everyone's asking.",
        "cast-friend": "Works beside you, and is on strike.",
        "cast-patron": "Has a say at {works}, and wants everyone back at work.",
        call: "We're all out. You're coming to the gate, aren't you?",
        gate: "{friend} and the others are picketing the gate of {works}. {patron} says anyone who comes in will keep their job, and anyone who doesn't may not.",
        "picket:label": "Join the picket with {friend}",
        "picket:then": "{friend} makes room for you in the line.",
        "cross:label": "Go in to work",
        "away:label": "Stay home until it's settled",
        confront: "The owners are bringing in strikebreakers, with police to get them through.",
        "hold:label": "Stand in the way with the others",
        "hold:failed": "The police push through. You're shoved aside, and the strikebreakers go in.",
        "back:label": "Let them through",
        held: "The strikebreakers turn back. The strike goes on, and nobody knows yet who will give in first.",
        broken: "The strikebreakers get in. You go home bruised, and the strike goes on.",
        stood: "You let them through. The strike goes on.",
        scab: "{friend} sees you going in through the gate and shouts something after you that the whole street hears.",
        crossed: "You kept working. Whatever happens with the strike, some people won't forget it.",
        stayed: "You stay home and wait for it to be settled.",
        passed: "The day ends, and the strike goes on.",
      },
    },
  ],
};
