import type { BeliefSystem, Realm } from "./types";
import type { PersonalBelief } from "./index";

/** What the death scene needs to know about a life. */
export type Life = {
  /** As the engine wrote it: "in battle", "by drowning", "of a fever". */
  cause: string;
  year: number;
  age: number;
  /** Children and household left to remember and feed the dead. */
  mourners: number;
  /** What people saw the player do, worst first; tone below zero is a wrong. */
  deeds: readonly { what: string; tone: number }[];
  observance: PersonalBelief["observance"];
};

export type Passage = {
  /** Under `public/backdrops/`. */
  plate: string;
  title: string;
  lines: string[];
};

const wrongs = (life: Life) => -life.deeds.reduce((n, d) => n + Math.min(0, d.tone), 0);
const worst = (life: Life) => ((life.deeds[0]?.tone ?? 0) < 0 ? life.deeds[0].what : "wronged people");
const kin = (n: number) => (n === 1 ? "One of your own is" : `${n} of your own are`);
// Summed gossip tone: a blow is -4, a theft -6, so this is more than one bad day.
const wicked = (life: Life) => wrongs(life) >= 12;
const devout = (life: Life) => life.observance === "devout";
const war = (life: Life) => /battle|war\b/.test(life.cause);
const violent = (life: Life) => /battle|war\b|fight|drown|fall|accident|train|burns/.test(life.cause);
const at = (plate: string, title: string, ...lines: string[]): Passage => ({ plate: `afterlife/${plate}.png`, title, lines });

type Judge = (life: Life, system: BeliefSystem) => Passage;

/** Each realm judges by what its own tradition cared about; `hope` is the
 * painting of the end its people hoped for, shown on the Beliefs tab. */
const realms: Record<Realm, { hope: string; judge: Judge }> = {
  latin: {
    hope: "latin/heaven",
    judge(life) {
      const w = worst(life);
      if (wicked(life) && !devout(life))
        return at("latin/hell", "Hell", `You ${w}, and never made it right.`, "The preachers had said where that led.");
      // Purgatory became doctrine in the late twelfth century.
      if (life.year >= 1170 && (wrongs(life) > 0 || !devout(life)))
        return at(
          "latin/purgatory",
          "Purgatory",
          wrongs(life) ? `Not damned, but not clean. There was the time you ${w}.` : "Not damned, but not yet clean, like nearly everyone.",
          "The Church taught that the soul is purged in fire before heaven, and that the prayers of the living shorten the time.",
        );
      if (wicked(life))
        return at("latin/hell", "Hell", `You ${w}, and never made it right.`, "The preachers had said where that led.");
      return at("latin/heaven", "Heaven", "You kept the faith, and no one could name a wrong you did.", "The priests taught that such a soul goes up to God.");
    },
  },
  orthodox: {
    hope: "orthodox/paradise",
    judge(life) {
      if (wicked(life) && !devout(life))
        return at(
          "orthodox/hell",
          "Hades",
          `You ${worst(life)}. At the toll-houses of the air the demons had it written down, and the angels could not pay it off.`,
          "The Church taught that such souls wait in torment for the Last Judgement.",
        );
      return at(
        "orthodox/paradise",
        "Paradise",
        "Your soul passes the toll-houses of the air, where demons charge it with its sins, and comes to rest to wait for the Judgement.",
        life.mourners ? "Your family will have prayers said for you on the third, ninth and fortieth days." : "The Church prays for the dead who have no one else.",
      );
    },
  },
  protestant: {
    hope: "protestant/heaven",
    judge(life) {
      if (wicked(life) && !devout(life))
        return at("protestant/hell", "Hell", `You ${worst(life)}, and never repented of it.`, "The preachers said there was no middle state: heaven or hell, settled the moment you died.");
      return at(
        "protestant/heaven",
        "Heaven",
        "Saved by faith, not by works, the preachers said. The Celestial City lies across the river.",
        "There is no purgatory, and no need of prayers for you now.",
      );
    },
  },
  islam: {
    hope: "islam/garden",
    judge(life) {
      if (wicked(life))
        return at(
          "islam/fire",
          "The Fire",
          `You ${worst(life)}. On the Day of Judgement your deeds are weighed, and the bridge over the Fire is as thin as a hair.`,
          "Many scholars taught that God's mercy may still bring a believer out of the Fire in the end.",
        );
      return at(
        "islam/garden",
        "The Garden",
        "Two angels, Munkar and Nakir, question you in the grave, and you answer them.",
        "On the Day of Judgement the faithful cross the bridge into the Garden, where rivers of water, milk and honey run.",
      );
    },
  },
  jewish: {
    hope: "jewish/eden",
    judge(life) {
      if (wicked(life))
        return at(
          "jewish/gehinnom",
          "Gehinnom",
          `You ${worst(life)}. The soul of the wicked is punished in Gehinnom.`,
          "Rabbi Akiva taught that the judgement of the wicked there lasts twelve months.",
        );
      return at("jewish/eden", "Gan Eden", "You lie in the earth until the dead are raised.", "Then the righteous wake to the world to come.");
    },
  },
  dust: {
    hope: "dust/house",
    judge(life, system) {
      const first =
        system.id === "israelite-judahite"
          ? "Everyone goes down to Sheol, good and bad alike: a place of shade, silence and sleep."
          : "Everyone comes here, kings and slaves, good and bad. The dead eat dust and clay and are dressed like birds, in feathers.";
      return at(
        "dust/house",
        system.id === "israelite-judahite" ? "Sheol" : "The House of Dust",
        first,
        life.mourners
          ? "Your family will pour water and leave bread at the grave. It is all the dead have to drink."
          : "No one is left to pour water for you. The dead without kin go thirsty and wander.",
      );
    },
  },
  zoroastrian: {
    hope: "zoroastrian/song",
    judge(life) {
      if (wicked(life))
        return at(
          "zoroastrian/lies",
          "The House of Lies",
          "On the fourth dawn you come to the Chinvat Bridge. Your own deeds meet you as a hideous hag, and the bridge narrows to a blade.",
          `You ${worst(life)}. You fall into the House of Lies, though even that ends when the world is made new.`,
        );
      return at(
        "zoroastrian/song",
        "The House of Song",
        "On the fourth dawn you come to the Chinvat Bridge. Your own deeds meet you as a beautiful young woman, and the bridge is wide.",
        "Beyond it is the House of Song, where you wait for the world to be made new.",
      );
    },
  },
  egypt: {
    hope: "egypt/reeds",
    judge(life) {
      if (wrongs(life) >= 10)
        return at(
          "egypt/devoured",
          "The Hall of the Two Truths",
          "Your heart was weighed against the feather of Maat, and it sank.",
          `You ${worst(life)}. Ammit the Devourer eats such hearts, and there is no second life after that.`,
        );
      return at(
        "egypt/reeds",
        "The Field of Reeds",
        "Your heart was weighed against the feather of Maat, and they balanced.",
        "In the Field of Reeds the barley stands taller than a man and the harvest never fails.",
      );
    },
  },
  greek: {
    hope: "greek/elysium",
    judge(life) {
      if (wicked(life))
        return at(
          "greek/tartarus",
          "Tartarus",
          `You ${worst(life)}.`,
          "The judges of the dead send the worst down to Tartarus, as far below the earth as the sky is above it.",
        );
      if (devout(life) && !wrongs(life))
        return at(
          "greek/elysium",
          "The Elysian Fields",
          "Pious, and initiated into the mysteries, you are let into the Elysian Fields at the edge of the world.",
          "There is no snow there, no storm and no hard work.",
        );
      return at(
        "greek/asphodel",
        "The Asphodel Meadows",
        life.mourners ? "Charon ferries you over the Styx for the coin your family left in your mouth." : "No one put a coin in your mouth, so you wait on the bank of the Styx.",
        "Most of the dead drift across the asphodel meadows as shades, remembering little.",
      );
    },
  },
  norse: {
    hope: "norse/valhalla",
    judge(life) {
      if (war(life) || /fight/.test(life.cause))
        return at("norse/valhalla", "Valhalla", "You died fighting, and the Valkyries chose you for Odin's hall.", "The slain fight every day and feast every night, waiting for Ragnarök.");
      return at("norse/hel", "Hel", "You did not die fighting, so you go down to Hel.", "The road takes nine nights, over the bridge Gjallarbrú, to a cold hall in the north.");
    },
  },
  celtic: {
    hope: "celtic/isles",
    judge: () =>
      at(
        "celtic/isles",
        "The Otherworld",
        "The druids taught that the soul does not die but passes on.",
        "Later stories told of islands across the western sea where no one grows old.",
      ),
  },
  mexica: {
    hope: "mexica/sun",
    judge(life) {
      if (war(life) || /sacrific/.test(life.cause))
        return at(
          "mexica/sun",
          "The House of the Sun",
          "You died in war, so you go east to escort the sun from its rising to noon.",
          "After four years, the Mexica said, the warrior dead come back as hummingbirds and butterflies.",
        );
      if (/childbirth|childbed/.test(life.cause))
        return at(
          "mexica/sun",
          "The House of the Sun",
          "A woman who died giving birth was honoured as a warrior who fell taking a captive.",
          "You join the cihuateteo, who carry the sun from noon down to its setting.",
        );
      if (/drown|water|lightning|river|sea\b/.test(life.cause))
        return at(
          "mexica/tlalocan",
          "Tlalocan",
          "Those Tlaloc takes by water belong to him.",
          "His garden is green all year, with no hunger in it. You are buried, not burned, so he can find you.",
        );
      return at(
        "mexica/mictlan",
        "Mictlan",
        "Most of the dead, good or bad, go down to Mictlan. What you did in life does not decide it; how you died does.",
        "The road takes four years, through nine levels, and a dog carries you over the last river.",
      );
    },
  },
  maya: {
    hope: "maya/flower-mountain",
    judge(life) {
      if (devout(life) && !wicked(life))
        return at(
          "maya/flower-mountain",
          "Flower Mountain",
          "You climb Flower Mountain, the paradise of the honoured dead, full of flowers and quetzal birds.",
          "Your family will keep your bones near the house, and you will watch over them.",
        );
      return at(
        "maya/xibalba",
        "Xibalba",
        "The road goes down to Xibalba, the place of fear, ruled by the lords of death.",
        "The Hero Twins once beat them at the ballgame there, and rose as the sun and the moon.",
      );
    },
  },
  andean: {
    hope: "andean/hanan-pacha",
    judge(life) {
      if (wicked(life))
        return at(
          "andean/uku-pacha",
          "Uku Pacha",
          `You ${worst(life)}.`,
          "Spanish chroniclers wrote that the wicked went down to Uku Pacha to be cold and hungry, though that may be their own hell talking.",
        );
      if (life.mourners)
        return at(
          "andean/uku-pacha",
          "Among the mallqui",
          "Your body is dried and wrapped in fine cloth and kept with the ayllu's ancestors.",
          "On feast days your family will bring you out, give you chicha to drink and ask your advice.",
        );
      return at("andean/hanan-pacha", "Hanan Pacha", "Your soul goes up to Hanan Pacha, the world above, with the Sun.", "No family is left to keep your body, so it is the sky that keeps you.");
    },
  },
  hindu: {
    hope: "hindu/moksha",
    judge(life, system) {
      if (wicked(life))
        return at(
          "hindu/naraka",
          "Yama's court",
          "Yama's messengers bring you before him, and Chitragupta reads out your account.",
          `You ${worst(life)}. The hells come first; then you are born again, lower, to work off what is left.`,
        );
      if (system.id === "vedic-early" || (devout(life) && !wrongs(life) && life.age < 70))
        return at(
          "hindu/svarga",
          system.id === "vedic-early" ? "The world of the fathers" : "Svarga",
          system.id === "vedic-early" ? "The pious go to Yama's world, where the fathers drink soma again." : "Your merit carries you to svarga, the heaven of the gods, for as long as it lasts.",
          system.id === "vedic-early" ? "Your sons will feed you there with offerings of rice." : "When it is spent you will be born again.",
        );
      if (devout(life) && !wrongs(life))
        return at("hindu/moksha", "Moksha", "You are released. No more births: the self rests in what it always was.", "It is the end every teacher pointed to, and few reach it.");
      return at(
        "rebirth/wheel",
        "Rebirth",
        "Your deeds go with you into the next life.",
        life.mourners
          ? "Your son lights the pyre, and the rites over twelve days give you a body to travel in."
          : "No one is left to make the offerings of rice, so you wander as a ghost for a while first.",
      );
    },
  },
  buddhist: {
    hope: "buddhist/deva",
    judge(life, system) {
      if (wicked(life))
        return at("buddhist/naraka", "Naraka", `You ${worst(life)}.`, "That karma ripens in the hells, for a very long time, though not for ever.");
      if (devout(life) && !wrongs(life) && life.age >= 70)
        return at("buddhist/nirvana", "Nirvana", "The fire goes out. No more craving, and no more birth.", "Few reach it. You did.");
      if (devout(life) && wrongs(life) < 4)
        return at("buddhist/deva", "A heaven of the gods", "Your merit carries you to a heaven of the gods.", "It is pleasant, and it ends: even gods die and are born again.");
      return at(
        "rebirth/wheel",
        "Rebirth",
        "Your mind carries its karma into a new birth.",
        system.id === "tibetan-buddhism"
          ? "For forty-nine days the lamas read to you in the bardo, the gap between lives."
          : life.mourners
            ? "Your family will make merit in your name and give it to you."
            : "No one is left to make merit for you.",
      );
    },
  },
  "pure-land": {
    hope: "pure-land/sukhavati",
    judge: (life) =>
      at(
        "pure-land/sukhavati",
        "The Pure Land",
        "Calling on Amida's name, you are born again in the Pure Land in the west, where enlightenment is easy.",
        wicked(life)
          ? `You ${worst(life)}. Shinran taught that if even a good person is reborn there, a bad one surely is: the vow is for you most of all.`
          : "Amida comes down on a cloud to meet you.",
      ),
  },
  jain: {
    hope: "jain/siddhashila",
    judge(life) {
      if (wicked(life))
        return at("hindu/naraka", "The hells", `You ${worst(life)}.`, "Violence binds karma to the soul most of all, and it is worked off in the hells.");
      if (devout(life))
        return at(
          "hindu/svarga",
          "The heavens",
          "No one reaches liberation in this age, the Jains say; that ended with the disciples of Mahavira.",
          "But your discipline earns you a birth among the gods.",
        );
      return at("rebirth/wheel", "Rebirth", "Karma clings to the soul like dust to oil.", "You are born again, carrying it.");
    },
  },
  sikh: {
    hope: "hindu/moksha",
    judge(life) {
      if (devout(life) && !wicked(life))
        return at("hindu/moksha", "Mukti", "By the Guru's grace you merge with the Creator, as a drop returns to the ocean.", "There is no more coming and going.");
      return at(
        "rebirth/wheel",
        "Rebirth",
        wicked(life) ? `You ${worst(life)}.` : "You did not keep the Name in mind.",
        "Without grace, the soul goes round the wheel of births again.",
      );
    },
  },
  chinese: {
    hope: "chinese/ancestral",
    judge(life) {
      // The Ten Kings of the underworld are a Tang-era idea.
      if (wicked(life) && life.year >= 700)
        return at(
          "chinese/courts",
          "The courts of the underworld",
          `You ${worst(life)}. The Ten Kings read your record court by court, and each wrong has its punishment.`,
          "At the end you drink the soup of forgetting and are born again.",
        );
      if (!life.mourners || wicked(life))
        return at(
          "chinese/hungry-ghost",
          "A hungry ghost",
          life.mourners ? `You ${worst(life)}, and your family does not set out food for you.` : "No one is left to feed you.",
          "The dead without offerings become hungry ghosts, fed only by strangers in the seventh month.",
        );
      return at(
        "chinese/ancestral",
        "The ancestral shrine",
        "Your tablet goes on the family altar.",
        "On feast days your children will burn incense and set out food, and you watch over them.",
      );
    },
  },
  japanese: {
    hope: "japanese/mountain",
    judge(life, system) {
      if (system.id === "kofun-nara-japan" || !life.mourners)
        return at(
          "japanese/yomi",
          "Yomi",
          "The dead go down the slope to Yomi, a dark and polluted land.",
          "When Izanagi went to fetch his wife back from it, he found her rotting, and blocked the pass with a boulder.",
        );
      return at(
        "japanese/mountain",
        "The ancestors' mountain",
        "After thirty-three years of rites, the dead lose their names and join the ancestral kami on the mountain above the village.",
        "In spring they come down to the fields as the god of the rice.",
      );
    },
  },
  steppe: {
    hope: "steppe/tengri",
    judge(life) {
      if (wicked(life))
        return at("steppe/lower", "Erlik's realm", `You ${worst(life)}.`, "Erlik, lord of the world below, takes those the sky does not want.");
      return at("steppe/tengri", "The Eternal Blue Sky", "Your soul rises to the Eternal Blue Sky.", "Your horse is buried with you, to carry you there.");
    },
  },
  african: {
    hope: "african/honoured",
    judge(life) {
      if (life.mourners && !wicked(life))
        return at(
          "african/honoured",
          "Among the ancestors",
          `${kin(life.mourners)} left to call your name, pour beer and set food out for you.`,
          "You join the ancestors, who watch over the homestead and are asked for help.",
        );
      return at(
        "african/forgotten",
        "Wandering",
        ...(life.mourners
          ? [`You ${worst(life)}. No one wanted to call you back.`, "Without rites the dead cannot settle among the ancestors."]
          : ["No one is left to call your name or feed you.", "Without them the dead cannot settle among the ancestors."]),
      );
    },
  },
  country: {
    hope: "country/return",
    judge: () =>
      at(
        "country/return",
        "Back to country",
        "You go back into country: the waterholes, the rock and the stories that made you.",
        "Your name will not be spoken for a long time, out of respect.",
      ),
  },
  ocean: {
    hope: "ocean/leaping-place",
    judge: () =>
      at(
        "ocean/leaping-place",
        "The leaping place",
        "Your spirit goes to the leaping place at the end of the land and drops into the sea.",
        "From there it travels the ocean road home, to the islands of the ancestors.",
      ),
  },
  path: {
    hope: "americas/path-of-souls",
    judge: (life) =>
      at(
        "americas/path-of-souls",
        "The Path of Souls",
        "Your soul walks the bright road across the night sky to the land of the dead.",
        wicked(life)
          ? `You ${worst(life)}. Some said a guardian on the road tests each soul, and the unworthy fall from it.`
          : "Many peoples called the road the Milky Way.",
      ),
  },
  forest: {
    hope: "americas/night-forest",
    judge: (_life, system) =>
      /taino|caribbean/.test(system.id)
        ? at(
            "americas/night-forest",
            "Coaybay",
            "You go to Coaybay, the house of the dead. By day the dead hide; at night they come out to eat guava.",
            "You can tell them from the living, people said, because they have no navel.",
          )
        : at("americas/night-forest", "The forest of the dead", "Your soul goes into the forest.", "The shamans can still meet you there, in dreams."),
  },
  pueblo: {
    hope: "pueblo/emergence",
    judge: () =>
      at(
        "pueblo/emergence",
        "The place of emergence",
        "You go back down to the world below, the one the people climbed up from.",
        "The dead come back as clouds, and bring rain.",
      ),
  },
  arctic: {
    hope: "arctic/aurora",
    judge: (life) =>
      at(
        "arctic/aurora",
        violent(life) ? "The land in the sky" : "Under the sea",
        violent(life)
          ? "You died by violence, so you go up to the sky, where the dead play ball with a walrus skull: the northern lights."
          : "Most of the dead go down under the sea, near Sedna's house. The northern lights are the lucky ones, at play.",
        life.mourners ? "Your name will go to the next child born in the camp, and something of you with it." : "Someone will give your name to a child, in time.",
      ),
  },
  earth: {
    hope: "earth/hearth",
    judge: (life) =>
      at(
        "earth/hearth",
        "Back to the land",
        "You go back to the land your people came from.",
        life.mourners ? "They lay you in the ground with red ochre and what you will need, and speak to you in dreams." : "There is no one left to bury you properly.",
      ),
  },
  slavic: {
    hope: "slavic/vyraj",
    judge(life) {
      if (wicked(life) || /drown/.test(life.cause) || !life.mourners)
        return at(
          "slavic/nav",
          "Nav",
          wicked(life) ? `You ${worst(life)}.` : /drown/.test(life.cause) ? "You drowned, and the drowned do not rest." : "No one is left to feed you at the feasts of the dead.",
          "The restless dead stay in Nav, under the roots of the great oak, and come back to trouble the living.",
        );
      return at(
        "slavic/vyraj",
        "Vyraj",
        "Your soul flies as a bird across the sea to Vyraj, where the birds go in winter.",
        "On the autumn feast of the dead your family will set a place for you and leave the door open.",
      );
    },
  },
  uralic: {
    hope: "uralic/downriver",
    judge: (life) =>
      at(
        "uralic/downriver",
        "Downriver",
        "The dead go down the river, north, to a land at its mouth where everything is the other way round: their night is our day.",
        life.mourners ? "Your family will make a small doll for your soul and feed it for a time." : "No one makes a doll for your soul, so it goes on alone.",
      ),
  },
  tungusic: {
    hope: "tungusic/clan-tree",
    judge: (life) =>
      at(
        "tungusic/clan-tree",
        "The clan tree",
        "Your soul goes back to the clan tree, where the unborn wait as birds on its branches.",
        wicked(life)
          ? `You ${worst(life)}. The shaman will have to guide your soul down to the lower world, or it will stay and trouble the living.`
          : "In time it will come down again into a child of your clan.",
      ),
  },
  bon: {
    hope: "bon/sky-cord",
    judge: (life) =>
      at(
        "bon/sky-cord",
        "The sky cord",
        "The first kings climbed back to the sky on a cord of light and left no bodies behind. Then the cord was cut.",
        life.mourners ? "Since then the dead stay below. Your family will have the priests guide you and feed you at the tomb." : "Since then the dead stay below, and no one is left to have the rites done for you.",
      ),
  },
  kongo: {
    hope: "kongo/mpemba",
    judge(life) {
      if (!life.mourners || wicked(life))
        return at(
          "african/forgotten",
          "At the Kalunga line",
          wicked(life) ? `You ${worst(life)}.` : "No one is left to do the rites.",
          "Without them the dead are stranded at the water between the worlds.",
        );
      return at(
        "kongo/mpemba",
        "Mpemba",
        "You cross the Kalunga line, the water between the worlds, into Mpemba, the white land of the dead.",
        "There the dead are white as clay, and the living can call on you at the grave.",
      );
    },
  },
  yoruba: {
    hope: "yoruba/orun-rere",
    judge(life) {
      if (wicked(life))
        return at(
          "yoruba/orun-apadi",
          "Orun apadi",
          `Your ori goes before Olodumare to account for the life it chose before birth. You ${worst(life)}.`,
          "The wicked go to orun apadi, the heaven of potsherds: hot, dry and broken.",
        );
      return at(
        "yoruba/orun-rere",
        "Orun rere",
        "Your ori goes before Olodumare to account for the life it chose before birth.",
        "The good go to orun rere, the good heaven, and may come back to the family in a new child.",
      );
    },
  },
  akan: {
    hope: "akan/asamando",
    judge(life) {
      if (wicked(life) || violent(life) || !life.mourners)
        return at(
          "african/forgotten",
          "Turned back",
          wicked(life) ? `You ${worst(life)}.` : violent(life) ? "Yours was a bad death, sudden and violent." : "No one is left to pour libations for you.",
          "Such souls are turned back at the river before Asamando, and wander.",
        );
      return at(
        "akan/asamando",
        "Asamando",
        "Your okra goes back to Onyame, and you cross the river to Asamando, the town of the dead beneath the earth.",
        "There the dead live as they lived here, chief and commoner, and wait for the libations of their kin.",
      );
    },
  },
  malagasy: {
    hope: "malagasy/tomb",
    judge(life) {
      if (!life.mourners)
        return at(
          "african/forgotten",
          "Outside the tomb",
          "There is no family left to lay you in the family tomb.",
          "To be buried apart from your ancestors is the worst thing that can happen to a person.",
        );
      return at(
        "malagasy/tomb",
        "Among the razana",
        "You are laid in the family tomb, among the razana, the ancestors of the lineage.",
        "Every few years your family will take you out, wrap you in a new silk lamba and dance with you before laying you back.",
      );
    },
  },
  northwest: {
    hope: "northwest/village",
    judge: () =>
      at(
        "northwest/village",
        "The village of the dead",
        "Your soul goes across the water to the village of the dead, a mirror of this one.",
        "In time it comes back, born into your own lineage; the elders will look for signs of you in a baby.",
      ),
  },
  mountain: {
    hope: "mountain/ancestors",
    judge: (_life, system) =>
      at(
        "mountain/ancestors",
        "The mountain of the ancestors",
        "You go into the mountain the springs and the maize come from.",
        system.id === "zapotec-montealbán"
          ? "The Zapotec said the dead rise as clouds: the Cloud People, who bring rain to their descendants."
          : "The dead live inside the mountain and send rain to their families.",
      ),
  },
  california: {
    hope: "california/western-gate",
    judge: (life) =>
      at(
        "california/western-gate",
        "The western gate",
        "Your soul leaves the land at the western point and crosses the sea to the land of the dead.",
        life.mourners ? "Your family burns your things so that you have them there." : "No one burns your things for you, so you go with nothing.",
      ),
  },
  barrow: {
    hope: "barrow/passage-tomb",
    judge: (life) =>
      at(
        "barrow/passage-tomb",
        "The great tomb",
        "You are laid in the great tomb with the bones of everyone who came before.",
        life.mourners ? "At midwinter sunrise the light reaches into the chamber, and your people come to the tomb." : "At midwinter sunrise the light reaches into the chamber.",
      ),
  },
};

/** The painting of the end a tradition hoped for. */
export const hopeFor = (system: BeliefSystem) => `afterlife/${realms[system.realm].hope}.png`;

/** Where this person's own tradition held that they went. */
export function passage(life: Life, system: BeliefSystem): Passage {
  // Doubt is common enough from the eighteenth century to stand for itself.
  if (life.observance === "indifferent" && life.year >= 1750)
    return {
      plate: "stars/field-b.png",
      title: "Nothing after",
      lines: [
        "You never believed there was anything after this.",
        life.mourners ? `${kin(life.mourners)} left to remember you.` : "No one is left to remember you.",
      ],
    };
  return realms[system.realm].judge(life, system);
}
