import { sangrand } from "../days/south-asia";

// English renderings of the linked passages, in reading order.
export type Passage = { title: string; source: string; lines: readonly (readonly [string, string])[] };

export const lesson: Passage = {
  title: "Matthew", source: "https://ebible.org/engwebp/MAT05.htm",
  lines: [
    ["5:3", "Blessed are the poor in spirit. The kingdom of heaven is theirs."],
    ["5:4", "Blessed are those who mourn. They will be comforted."],
    ["5:5", "Blessed are the gentle. They will inherit the earth."],
    ["5:6", "Blessed are those who hunger and thirst for righteousness. They will have their fill."],
    ["5:7", "Blessed are those who show mercy. They will receive mercy."],
    ["5:8", "Blessed are the pure in heart. They will see God."],
    ["5:9", "Blessed are those who make peace. They will be called children of God."],
  ],
};

export const psalm: Passage = {
  title: "Psalm", source: "https://ebible.org/engwebp/PSA121.htm",
  lines: [
    ["121:1", "I raise my eyes to the hills. Where will my help come from?"],
    ["121:2", "My help comes from the Lord, who made heaven and earth."],
    ["121:3–4", "He will not let your foot slip. Your keeper will not doze. See, Israel’s keeper neither dozes nor sleeps."],
    ["121:5–6", "The Lord keeps you. The Lord is shade at your right hand. The sun will not strike you by day, nor the moon by night."],
    ["121:7–8", "The Lord will keep you from all harm and guard your life. He will watch over your going out and your coming in, now and always."],
  ],
};

export const torah: Passage = {
  title: "Genesis", source: "https://mechon-mamre.org/p/pt/pt0101.htm",
  lines: [
    ["1:1", "In the beginning God made the heavens and the earth."],
    ["1:2", "The earth was waste and empty. Darkness lay over the deep, and a wind from God hovered over the waters."],
    ["1:3", "God said, “Let there be light,” and light came into being."],
    ["1:4", "God saw that the light was good, and set the light apart from the darkness."],
    ["1:5", "God named the light Day and the darkness Night. Evening came, then morning. One day."],
  ],
};

export const opening: Passage = {
  title: "Qur’an", source: "https://quran.com/al-fatihah",
  lines: [
    ["1:2", "Praise belongs to God, Lord of all worlds."],
    ["1:3–4", "The Compassionate, the Merciful, master of the Day of Judgment."],
    ["1:5", "You alone we worship. To you alone we turn for help."],
    ["1:6–7", "Lead us on the straight way, the way of those you have blessed, those who have neither incurred your anger nor gone astray."],
  ],
};

export const nembutsu: Passage = {
  title:"Nembutsu", source:"https://www.chion-in.or.jp/en/jodoshu/",
  lines:[["Invocation", "Namu Amida Butsu. I take refuge in Amida Buddha."]],
};

export const lotus: Passage = {
  title: "Lotus Sutra", source: "https://cbetaonline.dila.edu.tw/zh/T0262_005",
  lines: [
    ["ch. 16", "When living beings see an age come to its end in a great fire, this land of mine is at peace, always full of gods and people."],
    ["ch. 16", "Its gardens, groves, halls and towers are adorned with every kind of jewel. On jeweled trees the flowers and fruit are thick, and living beings wander there in delight."],
    ["ch. 16", "The gods beat their heavenly drums and play music without cease. A rain of mandarava flowers falls on the Buddha and the whole assembly."],
  ],
};

export const refuges: Passage = {
  title: "Three Refuges", source: "https://suttacentral.net/kp1/pli/ms",
  lines: [
    ["Khp 1", "I go to the Buddha for refuge. I go to the teaching for refuge. I go to the community for refuge."],
    ["Khp 1", "A second time I go to the Buddha for refuge. A second time I go to the teaching for refuge. A second time I go to the community for refuge."],
    ["Khp 1", "A third time I go to the Buddha for refuge. A third time I go to the teaching for refuge. A third time I go to the community for refuge."],
  ],
};

export const aarti: Passage = {
  title: "Dhanasari, Guru Nanak", source: "https://www.srigranth.org/servlet/gurbani.gurbani?Action=Page&Param=13",
  lines: [
    ["ang 13", "The sky is the offering tray. The sun and moon are its lamps, and the stars are pearls scattered across it."],
    ["ang 13", "Sandalwood scents the air like incense. The wind waves the whisk. All the flowering woods are your flowers, O Light."],
    ["ang 13", "What a worship of lights this is, O destroyer of fear! The unstruck sound of the Word is the beating of the drums."],
  ],
};

function month(name: string, page: number, ...verses: string[]): Passage {
  return {title:`Barah Maha · ${name}`, source:`https://www.srigranth.org/servlet/gurbani.gurbani?Action=Page&Param=${page}`,
    lines:verses.map(text => [`ang ${page}`, text])};
}

const barahMaha = [
  month("Chet", 1108, "The woods are in flower at my door. If only my beloved would come home.",
    "How can a bride find peace when her beloved stays away? My body wastes away in separation.",
    "The cuckoo sings in the mango tree. How shall I bear the ache inside me?"),
  month("Vaisakh", 1108, "Lovely Vaisakh! The branches put on their finery.",
    "The bride watches at the door for the Lord. Have mercy and come.",
    "Come home, beloved, and ferry me across. Without you I am worth less than half a shell."),
  month("Jeth", 1108, "Lovely is the month of Jeth. How could I forget my love?",
    "The ground bakes like an oven. The bride makes her plea.",
    "She pleads and recounts your virtues. May my praise please you, Lord."),
  month("Harh", 1108, "Lovely is Harh. The sun burns in the sky.",
    "The earth suffers, parched in the heat of the fire.",
    "The fire draws out the sap. We perish in anguish, yet the sun never tires of its work."),
  month("Sawan", 1108, "Take heart in Sawan, my mind. The season has turned and heavy clouds spill rain.",
    "Body and mind delight in my beloved, but he has gone to a distant land.",
    "He does not come home. Longing consumes me. The flash of lightning frightens me."),
  month("Bhadon", 1108, "In Bhadon the young bride loses her way in doubt and lives to regret it.",
    "Pools and fields brim with water. The rains have come in all their colour.",
    "Rain falls in the black night. How can the young bride rest? Frogs and peacocks call."),
  month("Assu", 1108, "Come in Assu, beloved. Your bride is dying of grief.",
    "We meet when the Lord brings us together. Love of another has led me astray.",
    "Undone by falsehood, forsaken by my beloved, I see white plumes of grass in bloom."),
  month("Katak", 1109, "In Katak what comes to pass is what pleases the Lord.",
    "The lamp burns steadily, kindled by what is true.",
    "Love is its oil. Bride and beloved meet, and she blossoms with joy."),
  month("Maghar", 1109, "Lovely is Maghar. Singing the Lord’s virtues, I am gathered into his embrace.",
    "The virtuous bride speaks his praises. My beloved never changes.",
    "Steadfast, wise and knowing is the Maker. The whole world shifts and changes."),
  month("Poh", 1109, "In Poh frost falls. The sap dries in the trees and grasses.",
    "Why do you stay away? You live in my mind, in my body, on my lips.",
    "The life of the world runs through my mind and body. In the Guru’s word I delight in his love."),
  month("Magh", 1109, "In Magh I am washed clean. I have found the place of pilgrimage within.",
    "I meet my friend in stillness. Holding fast to his virtues, I enter his embrace.",
    "Listen, beautiful Lord. If it pleases you, I bathe in that pool."),
  month("Phagun", 1109, "In Phagun my heart rejoices. Love has taken root.",
    "Day and night are full of joy. I have let go of myself.",
    "When it pleased him, attachment fell away from my mind. In your kindness, come home."),
];

export function passageOn(passage: Passage, calendar: {day: number; from: number}) {
  if (passage !== aarti || calendar.day % sangrand.every !== sangrand.on) return passage;
  // Chet begins around mid-March in the game's compressed solar year.
  return barahMaha[Math.floor(((calendar.from - 73 + 365.25) % 365.25) * 12 / 365.25)];
}

export const ashemVohu: Passage = {
  title: "Ashem Vohu", source: "https://www.avesta.org/ka/ka_part1.htm",
  lines: [
    ["Yasna 27.14", "Of all good things, truth is best."],
    ["Yasna 27.14", "It is joy. Joy comes to the one who follows truth for the sake of truth itself."],
  ],
};
