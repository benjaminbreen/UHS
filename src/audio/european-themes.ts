import type { LayeredTheme } from "./layered-themes";

const chords: Record<string, [string, string, string]> = {
  G: ["G2", "D3", "G3 D4 G4 B4"],
  D: ["D2", "A2", "D3 A3 D4 F#4"],
  Em: ["E2", "B2", "E3 B3 E4 G4"],
  C: ["C3", "G2", "C3 G3 C4 E4"],
  Bm: ["B2", "F#2", "B2 F#3 B3 D4"],
  Am: ["A2", "E2", "A2 E3 A3 C4"],
};
const verse = "G D Em C G C D G";
const bridge = "C D Bm Em C Am D D";
const changes = `G C D G ${verse} ${verse} ${bridge} ${verse} ${verse} ${bridge} ${verse} G D Am G`.split(" ");

const tuneA = [
  "D5:.75 B4:.25 G4:.5 B4:.5 D5:1 G5:1",
  "F#5:.5 E5:.5 D5:.5 E5:.5 F#5:1 A5:1",
  "G5:.75 F#5:.25 E5:.5 D5:.5 B4:1 E5:1",
  "C5:.5 D5:.5 E5:.5 G5:.5 E5:2",
  "D5:.75 B4:.25 G4:.5 B4:.5 D5:1 G5:.5 A5:.5",
  "B5:.5 A5:.5 G5:.5 E5:.5 G5:1 E5:1",
].join(" ");
const verseOpen = `${tuneA} D5:.5 E5:.5 F#5:.5 G5:.5 A5:1 F#5:1 G5:3 -:1`;
const verseClose = `${tuneA} E5:.5 F#5:.5 G5:.5 A5:.5 B5:1 A5:.5 F#5:.5 G5:2 -:2`;
const tuneB = [
  "E5:1 G5:.5 E5:.5 C5:1 E5:1",
  "F#5:1 A5:.5 F#5:.5 D5:1 F#5:1",
  "B5:.75 A5:.25 F#5:.5 D5:.5 B4:1 D5:1",
  "E5:2 G5:1 B5:1",
  "C6:.75 B5:.25 A5:.5 G5:.5 E5:1 G5:1",
  "A5:.5 G5:.5 E5:.5 C5:.5 E5:1 A5:1",
  "F#5:.5 G5:.5 A5:.5 B5:.5 A5:1 F#5:.5 E5:.5",
  "D5:2 -:1 D5:.5 E5:.5",
].join(" ");

const seq = (table: Record<string, string>, chords: string) =>
  chords
    .split(" ")
    .map((c) => table[c])
    .join(" ");

// Chartres stone bridge: 76 bars, 4/4 at 96 BPM (3:10).
const bridgeIntro = "Dm9 G/D Cadd9 Asus4-A7",
  bridgeA1 = "Dm9 G/B Cadd9 Fmaj7 Gm7 Dm/F Em7b5 Asus4-A7",
  bridgeA2 = "Dm9 G/B Cadd9 Am7 BbMaj7 Gm7 Csus4 C",
  bridgeA2Climax = "Dm9 G/B Cadd9 Am7 BbMaj7 Cadd9 Dadd9 Dadd9",
  orchardB1 = "F C/E Dm7 Am/C BbMaj7 F/A Gm7 C",
  orchardB2 = "F C/E Dm7 Am/C BbMaj7 F/A Gm7-C F",
  roseC = "Gm9 EbMaj7 Fadd9 Dm7 EbMaj7 Bb/D Cm7 Fadd9 Gm9 EbMaj7 Em7b5 Asus4-A7",
  bridgeCoda = "Dm9 G/B Cadd9 Fmaj7 BbMaj7 Gm7 Asus4-A7 Dm9 Dm9 G/D";

const bridgeHarp: Record<string, string> = {
  Dm9: "D3:.5 A3:.5 E4:.5 F4:.5 A4:.5 F4:.5 E4:.5 A3:.5",
  "G/D": "D3:.5 B3:.5 D4:.5 G4:.5 B4:.5 G4:.5 D4:.5 B3:.5",
  "G/B": "B2:.5 G3:.5 B3:.5 D4:.5 G4:.5 D4:.5 B3:.5 G3:.5",
  Cadd9: "C3:.5 G3:.5 D4:.5 E4:.5 G4:.5 E4:.5 D4:.5 G3:.5",
  Fmaj7: "F3:.5 C4:.5 E4:.5 A4:.5 C5:.5 A4:.5 E4:.5 C4:.5",
  Gm7: "G2:.5 D3:.5 F3:.5 Bb3:.5 D4:.5 Bb3:.5 F3:.5 D3:.5",
  "Dm/F": "F3:.5 A3:.5 D4:.5 F4:.5 A4:.5 F4:.5 D4:.5 A3:.5",
  Em7b5: "E3:.5 G3:.5 Bb3:.5 D4:.5 G4:.5 D4:.5 Bb3:.5 G3:.5",
  "Asus4-A7": "A2:.5 E3:.5 A3:.5 D4:.5 A2:.5 E3:.5 G3:.5 C#4:.5",
  Am7: "A2:.5 E3:.5 G3:.5 C4:.5 E4:.5 C4:.5 G3:.5 E3:.5",
  BbMaj7: "Bb2:.5 F3:.5 A3:.5 D4:.5 F4:.5 D4:.5 A3:.5 F3:.5",
  Csus4: "C3:.5 G3:.5 C4:.5 F4:.5 G4:.5 F4:.5 C4:.5 G3:.5",
  C: "C3:.5 G3:.5 C4:.5 E4:.5 G4:.5 E4:.5 C4:.5 G3:.5",
  Gm9: "G2:.5 D3:.5 A3:.5 Bb3:.5 D4:.5 Bb3:.5 A3:.5 D3:.5",
  EbMaj7: "Eb3:.5 Bb3:.5 D4:.5 G4:.5 Bb4:.5 G4:.5 D4:.5 Bb3:.5",
  Fadd9: "F3:.5 C4:.5 G4:.5 A4:.5 C5:.5 A4:.5 G4:.5 C4:.5",
  Dm7: "D3:.5 A3:.5 C4:.5 F4:.5 A4:.5 F4:.5 C4:.5 A3:.5",
  "Bb/D": "D3:.5 F3:.5 Bb3:.5 D4:.5 F4:.5 D4:.5 Bb3:.5 F3:.5",
  Cm7: "C3:.5 G3:.5 Bb3:.5 Eb4:.5 G4:.5 Eb4:.5 Bb3:.5 G3:.5",
  Dadd9: "D3:.5 A3:.5 E4:.5 F#4:.5 A4:.5 F#4:.5 E4:.5 A3:.5",
};

const orchardGuitar: Record<string, string> = {
  F: "F2:.5 C4:.5 A3:.5 F4:.5 C3:.5 C4:.5 A3:.5 F4:.5",
  "C/E": "E2:.5 C4:.5 G3:.5 E4:.5 G2:.5 C4:.5 G3:.5 E4:.5",
  Dm7: "D3:.5 C4:.5 A3:.5 F4:.5 A2:.5 C4:.5 A3:.5 F4:.5",
  "Am/C": "C3:.5 C4:.5 A3:.5 E4:.5 E3:.5 C4:.5 A3:.5 E4:.5",
  BbMaj7: "Bb2:.5 D4:.5 A3:.5 F4:.5 F3:.5 D4:.5 A3:.5 F4:.5",
  "F/A": "A2:.5 C4:.5 F3:.5 F4:.5 C3:.5 C4:.5 F3:.5 F4:.5",
  Gm7: "G2:.5 D4:.5 Bb3:.5 F4:.5 D3:.5 D4:.5 Bb3:.5 F4:.5",
  C: "C3:.5 C4:.5 G3:.5 E4:.5 G2:.5 C4:.5 G3:.5 E4:.5",
  "Gm7-C": "G2:.5 Bb3:.5 D4:.5 F4:.5 C3:.5 G3:.5 C4:.5 E4:.5",
};

const bridgeLute: Record<string, string> = {
  Dm9: "-:.5 A3:.5 F4:.5 A3:.5 -:.5 E4:.5 F4:.5 A3:.5",
  "G/B": "-:.5 G3:.5 D4:.5 B3:.5 -:.5 D4:.5 G4:.5 B3:.5",
  Cadd9: "-:.5 G3:.5 E4:.5 D4:.5 -:.5 C4:.5 E4:.5 G3:.5",
  Fmaj7: "-:.5 C4:.5 A4:.5 E4:.5 -:.5 C4:.5 F4:.5 A3:.5",
  Gm7: "-:.5 Bb3:.5 F4:.5 D4:.5 -:.5 Bb3:.5 D4:.5 F3:.5",
  "Dm/F": "-:.5 A3:.5 F4:.5 D4:.5 -:.5 A3:.5 D4:.5 F3:.5",
  Em7b5: "-:.5 Bb3:.5 G4:.5 D4:.5 -:.5 Bb3:.5 D4:.5 G3:.5",
  "Asus4-A7": "-:.5 A3:.5 D4:.5 A3:.5 -:.5 G3:.5 C#4:.5 E4:.5",
  Am7: "-:.5 C4:.5 G4:.5 E4:.5 -:.5 C4:.5 E4:.5 G3:.5",
  BbMaj7: "-:.5 A3:.5 F4:.5 D4:.5 -:.5 A3:.5 D4:.5 F3:.5",
  Csus4: "-:.5 C4:.5 G4:.5 F4:.5 -:.5 C4:.5 F4:.5 G3:.5",
  C: "-:.5 C4:.5 G4:.5 E4:.5 -:.5 C4:.5 E4:.5 G3:.5",
  F: "-:.5 A3:.5 F4:.5 C4:.5 -:.5 A3:.5 C4:.5 F4:.5",
  "C/E": "-:.5 G3:.5 E4:.5 C4:.5 -:.5 G3:.5 C4:.5 E4:.5",
  Dm7: "-:.5 A3:.5 F4:.5 C4:.5 -:.5 A3:.5 C4:.5 F4:.5",
  "Am/C": "-:.5 A3:.5 E4:.5 C4:.5 -:.5 A3:.5 C4:.5 E4:.5",
  "F/A": "-:.5 A3:.5 F4:.5 C4:.5 -:.5 F3:.5 C4:.5 F4:.5",
  "Gm7-C": "-:.5 Bb3:.5 F4:.5 D4:.5 -:.5 G3:.5 E4:.5 C4:.5",
  Dadd9: "-:.5 A3:.5 F#4:.5 E4:.5 -:.5 A3:.5 D4:.5 F#4:.5",
};

const bridgeHold: Record<string, string> = {
  Dm9: "F3+A3+C4+E4:4",
  "G/D": "G3+B3+D4:4",
  "G/B": "G3+B3+D4:4",
  Cadd9: "E3+G3+C4+D4:4",
  Fmaj7: "F3+A3+C4+E4:4",
  Gm7: "G3+Bb3+D4+F4:4",
  "Dm/F": "F3+A3+D4:4",
  Em7b5: "E3+G3+Bb3+D4:4",
  "Asus4-A7": "E3+A3+D4:2 E3+G3+C#4:2",
  Am7: "E3+G3+C4:4",
  BbMaj7: "F3+A3+D4:4",
  Csus4: "G3+C4+F4:4",
  C: "G3+C4+E4:4",
  F: "F3+A3+C4:4",
  "C/E": "G3+C4+E4:4",
  Dm7: "F3+A3+C4:4",
  "Am/C": "E3+A3+C4:4",
  "F/A": "F3+A3+C4:4",
  "Gm7-C": "G3+Bb3+D4:2 G3+C4+E4:2",
  Gm9: "G3+Bb3+D4+A4:4",
  EbMaj7: "G3+Bb3+D4:4",
  Fadd9: "F3+A3+C4+G4:4",
  "Bb/D": "F3+Bb3+D4:4",
  Cm7: "G3+Bb3+Eb4:4",
  Dadd9: "F#3+A3+D4+E4:4",
};

const bridgeChoir: Record<string, string> = {
  Dm9: "A3+D4+E4:4",
  "G/D": "B3+D4+G4:4",
  "G/B": "B3+D4+G4:4",
  Cadd9: "G3+C4+D4:4",
  Fmaj7: "A3+C4+E4:4",
  Gm7: "Bb3+D4+F4:4",
  "Dm/F": "A3+D4+F4:4",
  Em7b5: "G3+Bb3+D4:4",
  "Asus4-A7": "A3+D4+E4:2 A3+C#4+E4:2",
  Am7: "A3+C4+E4:4",
  BbMaj7: "A3+D4+F4:4",
  Gm9: "Bb3+D4+A4:4",
  EbMaj7: "Bb3+D4+G4:4",
  Fadd9: "A3+C4+G4:4",
  Dm7: "A3+C4+F4:4",
  "Bb/D": "Bb3+D4+F4:4",
  Cm7: "Bb3+Eb4+G4:4",
  Dadd9: "A3+D4+F#4:4",
};

const bridgeLow: Record<string, string> = {
  Dm9: "D2:2.5 D2:.5 A2:1",
  "G/D": "D2:3 G2:1",
  "G/B": "B1:2.5 B1:.5 G2:1",
  Cadd9: "C2:2.5 C2:.5 G2:1",
  Fmaj7: "F2:2.5 F2:.5 C2:1",
  Gm7: "G2:2.5 G2:.5 D2:1",
  "Dm/F": "F2:2.5 F2:.5 A2:1",
  Em7b5: "E2:2.5 E2:.5 Bb1:1",
  "Asus4-A7": "A1:2 E2:1 A2:1",
  Am7: "A1:2.5 A1:.5 E2:1",
  BbMaj7: "Bb1:2.5 Bb1:.5 F2:1",
  Csus4: "C2:2.5 C2:.5 G2:1",
  C: "C2:2.5 C2:.5 G2:1",
  F: "F2:1.5 F2:.5 C2:2",
  "C/E": "E2:1.5 E2:.5 G2:2",
  Dm7: "D2:1.5 D2:.5 A2:2",
  "Am/C": "C2:1.5 C2:.5 E2:2",
  "F/A": "A1:1.5 A1:.5 C2:2",
  "Gm7-C": "G2:2 C2:2",
  Gm9: "G2:2.5 G2:.5 D2:1",
  EbMaj7: "Eb2:2.5 Eb2:.5 Bb1:1",
  Fadd9: "F2:2.5 F2:.5 C2:1",
  "Bb/D": "D2:2.5 D2:.5 Bb1:1",
  Cm7: "C2:2.5 C2:.5 G2:1",
  Dadd9: "D2:2.5 D2:.5 A2:1",
};

const bridgeTuneA1 =
  "A4:.5:.85 D5:.5:.9 E5:1.5:1.05 F5:.5:.95 E5:1:.9 " +
  "D5:1.5:1 B4:.5:.9 G4:1:.85 B4:1:.95 " +
  "C5:1.5:1 D5:.5:.95 E5:1:1.05 G5:1:1.1 " +
  "A5:2:1.15 G5:1:1 E5:1:.9 " +
  "F5:1.5:1 G5:.5:.95 F5:1:.9 D5:1:.85 " +
  "E5:1.5:.95 D5:.5:.9 C5:1:.85 A4:1:.8 " +
  "Bb4:1.5:.95 A4:.5:.85 G4:1:.8 Bb4:1:.9 " +
  "A4:2.5:.95 -:1.5";

const bridgeTuneA2 =
  "A4:.5:.85 D5:.5:.9 E5:1.5:1.05 F5:.5:.95 E5:1:.9 " +
  "D5:1.5:1 B4:.5:.9 D5:1:.95 G5:1:1.05 " +
  "E5:1.5:1.05 D5:.5:.95 C5:1:.9 G5:1:1.05 " +
  "A5:1.5:1.1 G5:.5:1 E5:2:.9 " +
  "F5:1.5:1 E5:.5:.95 D5:1:.9 F5:1:.95 " +
  "G5:1.5:1.05 F5:.5:.95 D5:1:.9 Bb4:1:.85 " +
  "C5:1:.9 D5:1:.95 F5:1:1 G5:1:1.05 " +
  "G5:2:1.05 E5:1:.95 G5:1:1";

const bridgeTuneA2Climax =
  "A4:.5:.9 D5:.5:.95 E5:1.5:1.1 F5:.5:1 E5:1:.95 " +
  "D5:1.5:1.05 B4:.5:.95 D5:1:1 G5:1:1.1 " +
  "E5:1.5:1.1 D5:.5:1 C5:1:.95 G5:1:1.1 " +
  "A5:1.5:1.15 G5:.5:1.05 E5:2:.95 " +
  "F5:1.5:1.1 G5:.5:1.05 A5:1:1.15 F5:1:1 " +
  "G5:1.5:1.1 A5:.5:1.15 C6:1:1.2 G5:1:1.05 " +
  "A5:2:1.2 F#5:1:1.05 E5:1:.95 " +
  "F#5:2:1.05 -:2";

const bridgeCelloA2 =
  "F3:2:.85 A3:2:.9 G3:2:.9 D4:2:.95 G3:2:.9 E4:2:.95 C4:2:.95 A3:1:.85 G3:1:.85 " +
  "A3:2:.9 F3:2:.85 Bb3:2:.95 G3:2:.85 F3:2:.9 G3:2:.95 G3:2:.95 C4:1.5:1 -:.5";

const orchardClarinetB1 =
  "A4:1:.95 C5:.5:.9 D5:.5:.95 F5:1:1.05 E5:.5:.95 D5:.5:.9 " +
  "C5:1.5:1 G4:.5:.85 C5:1:.9 E5:1:.95 " +
  "F5:1:1 E5:.5:.95 D5:.5:.9 C5:1:.9 A4:1:.85 " +
  "C5:2:.95 E5:1:.95 C5:1:.85 " +
  "D5:1:.95 F5:.5:.95 G5:.5:1 A5:1:1.05 G5:.5:.95 F5:.5:.9 " +
  "F5:1.5:1 C5:.5:.9 A4:1:.85 C5:1:.9 " +
  "D5:1:.95 C5:.5:.9 Bb4:.5:.85 A4:1:.85 G4:1:.8 " +
  "C5:2.5:.95 -:1.5";

const orchardFluteB2 =
  "A5:1:1 C6:.5:1.05 A5:.5:.95 F5:1:.9 G5:.5:.9 A5:.5:.95 " +
  "G5:1.5:1 E5:.5:.9 C5:1:.85 E5:1:.9 " +
  "F5:1:.95 G5:.5:.95 A5:.5:1.05 G5:1:.95 F5:1:.9 " +
  "E5:2:.95 C5:1:.85 E5:1:.9 " +
  "D5:1:.95 F5:.5:.95 G5:.5:1 A5:1:1.05 G5:.5:.95 F5:.5:.9 " +
  "A5:1.5:1.05 G5:.5:.95 F5:1:.9 C5:1:.85 " +
  "D5:1:.95 F5:1:1 E5:1:.95 G5:1:1.05 " +
  "F5:3:1 -:1";

const orchardClarinetB2 =
  "F4:1:.85 A4:.5:.9 F4:.5:.85 C4:1:.8 E4:.5:.85 F4:.5:.9 " +
  "E4:1.5:.9 C4:.5:.85 G3:1:.8 C4:1:.85 " +
  "D4:1:.85 E4:.5:.85 F4:.5:.9 E4:1:.85 D4:1:.85 " +
  "C4:2:.9 A3:1:.8 C4:1:.85 " +
  "Bb3:1:.85 D4:.5:.85 E4:.5:.9 F4:1:.95 E4:.5:.85 D4:.5:.85 " +
  "F4:1.5:.95 E4:.5:.9 C4:1:.85 A3:1:.8 " +
  "Bb3:1:.85 D4:1:.9 C4:1:.9 E4:1:.95 " +
  "C4:3:.9 -:1";

const roseHorn =
  "D4:1:.9 G4:1.5:1.05 A4:.5:1 Bb4:1:1.1 " +
  "A4:1.5:1 G4:.5:.95 F4:1:.9 D4:1:.85 " +
  "C4:1:.9 F4:1.5:1 G4:.5:.95 A4:1:1.05 " +
  "A4:2:1 F4:1:.9 D4:1:.85 " +
  "G4:1.5:1 Bb4:.5:1 D5:1:1.1 C5:1:1 " +
  "Bb4:1.5:1 A4:.5:.95 F4:1:.9 Bb4:1:1 " +
  "G4:1.5:.95 Bb4:.5:1 C5:1:1.05 D5:1:1.1 " +
  "C5:2.5:1.05 -:1.5 " +
  "D5:1.5:1.1 C5:.5:1 Bb4:1:.95 A4:1:.9 " +
  "G4:1.5:1 Bb4:.5:1.05 D5:2:1.15 " +
  "D5:1.5:1.05 C5:.5:.95 Bb4:1:.9 G4:1:.85 " +
  "A4:2.5:1.05 -:1.5";

const roseFlute =
  "G5:1.5:.9 Bb5:.5:.95 D6:1:1 C6:1:.95 " +
  "Bb5:1.5:.95 A5:.5:.9 F5:2:.85 " +
  "G5:1.5:.9 Bb5:.5:.95 C6:1:1 D6:1:1.05 " +
  "C6:2:1 A5:1:.9 G5:1:.85 " +
  "D6:1.5:1.05 C6:.5:.95 Bb5:1:.9 A5:1:.85 " +
  "G5:1.5:.95 Bb5:.5:1 D6:2:1.1 " +
  "Bb5:2:.95 G5:2:.85 " +
  "A5:2.5:.95 -:1.5";

const bridgeHornClimax =
  "D4:2:.9 F4:2:.95 G4:2:1 D4:2:.9 E4:2:.95 G4:2:1 F4:2:1 C4:2:.9 " +
  "D4:2:.95 Bb3:2:.85 A3:2:.85 D4:2:.95 G4:2:.95 E4:2:.9 E4:2.5:.95 -:1.5 " +
  "D4:2:.95 F4:2:1 G4:2:1.05 B4:2:1.05 G4:2:1 E4:2:.95 E4:2:.95 C4:2:.9 " +
  "D4:2:1 F4:2:1.05 E4:2:1.05 G4:2:1.1 F#4:2:1.1 A4:2:1.1 A4:2:1 -:2";

const bridgeCodaClarinet =
  "A4:.5:.85 D5:.5:.9 E5:1.5:1 F5:.5:.95 E5:1:.9 " +
  "D5:1.5:.95 B4:.5:.85 G4:2:.8 " +
  "C5:1.5:.9 D5:.5:.9 E5:2:.95 " +
  "E5:1.5:.9 C5:.5:.85 A4:2:.8 " +
  "D5:1.5:.95 C5:.5:.9 A4:2:.85 " +
  "Bb4:1.5:.9 A4:.5:.85 G4:2:.8 " +
  "A4:2:.9 G4:1:.85 E4:1:.8 " +
  "D4:3:.85 -:1";

// The Atlantic horizon: 88 bars, 4/4 at 108 BPM (3:16).
const atlIntro = "Bbadd9 F/A Gm9 EbMaj7 Bbadd9 F/A EbMaj7 Fsus4",
  atlA1 = "Bbadd9 F/A Gm9 Dm/F EbMaj7 Bb/D Cm9 Fsus4-F",
  atlA2 = "Bbadd9 F/A Gm9 Dm/F EbMaj7 Fsus4-F Bbadd9 Bbadd9",
  atlB1 = "EbMaj7 Fadd9 Gm9 Dm/F EbMaj7 Bb/D Cm7 Fsus4-F",
  atlB2 = "EbMaj7 Fadd9 Gm9 Bb/F EbMaj7 Fadd9 Gm9 Gm9",
  atlC = "Gm EbMaj7 Cm7 Dsus4-D7 Gm EbMaj7 AbMaj7 Bb/D Cm9 AbMaj7 Fm7 Gsus4-G AbMaj7 Bb F/G G7",
  atlA1C = "Cadd9 G/B Am9 Em/G Fmaj7 C/E Dm9 Gsus4-G",
  atlA2C = "Cadd9 G/B Am9 Em/G Fmaj7 Gsus4-G Cadd9 Cadd9",
  atlCoda1 = "Fmaj7 C/E Dm9 Gsus4-G Am9 Em/G Fmaj7 Gsus4-G",
  atlCoda2 = "Cadd9 G/B Am9 Fmaj7 Cadd9 G/B";

const atlHarp: Record<string, string> = {
  Bbadd9: "Bb2:.5 F3:.5 C4:.5 D4:.5 F4:.5 D4:.5 C4:.5 F3:.5",
  "F/A": "A2:.5 F3:.5 A3:.5 C4:.5 F4:.5 C4:.5 A3:.5 F3:.5",
  Gm9: "G2:.5 D3:.5 A3:.5 Bb3:.5 D4:.5 Bb3:.5 A3:.5 D3:.5",
  "Dm/F": "F3:.5 A3:.5 D4:.5 F4:.5 A4:.5 F4:.5 D4:.5 A3:.5",
  EbMaj7: "Eb3:.5 Bb3:.5 D4:.5 G4:.5 Bb4:.5 G4:.5 D4:.5 Bb3:.5",
  "Bb/D": "D3:.5 F3:.5 Bb3:.5 D4:.5 F4:.5 D4:.5 Bb3:.5 F3:.5",
  Cm9: "C3:.5 G3:.5 D4:.5 Eb4:.5 G4:.5 Eb4:.5 D4:.5 G3:.5",
  Cm7: "C3:.5 G3:.5 Bb3:.5 Eb4:.5 G4:.5 Eb4:.5 Bb3:.5 G3:.5",
  Fsus4: "F3:.5 C4:.5 F4:.5 Bb4:.5 C5:.5 Bb4:.5 F4:.5 C4:.5",
  "Fsus4-F": "F3:.5 C4:.5 F4:.5 Bb4:.5 F3:.5 C4:.5 F4:.5 A4:.5",
  Fadd9: "F3:.5 C4:.5 G4:.5 A4:.5 C5:.5 A4:.5 G4:.5 C4:.5",
  "Bb/F": "F3:.5 Bb3:.5 D4:.5 F4:.5 Bb4:.5 F4:.5 D4:.5 Bb3:.5",
  Gm: "G2:.5 D3:.5 G3:.5 Bb3:.5 D4:.5 Bb3:.5 G3:.5 D3:.5",
  "Dsus4-D7": "D3:.5 A3:.5 D4:.5 G4:.5 D3:.5 A3:.5 C4:.5 F#4:.5",
  AbMaj7: "Ab2:.5 Eb3:.5 G3:.5 C4:.5 Eb4:.5 C4:.5 G3:.5 Eb3:.5",
  Fm7: "F3:.5 C4:.5 Eb4:.5 Ab4:.5 C5:.5 Ab4:.5 Eb4:.5 C4:.5",
  Bb: "Bb2:.5 F3:.5 Bb3:.5 D4:.5 F4:.5 D4:.5 Bb3:.5 F3:.5",
  "Gsus4-G": "G2:.5 D3:.5 G3:.5 C4:.5 G2:.5 D3:.5 G3:.5 B3:.5",
  "F/G": "G2:.5 C3:.5 F3:.5 A3:.5 C4:.5 A3:.5 F3:.5 C3:.5",
  G7: "G2:.5 D3:.5 F3:.5 B3:.5 D4:.5 B3:.5 F3:.5 D3:.5",
  Cadd9: "C3:.5 G3:.5 D4:.5 E4:.5 G4:.5 E4:.5 D4:.5 G3:.5",
  "G/B": "B2:.5 G3:.5 B3:.5 D4:.5 G4:.5 D4:.5 B3:.5 G3:.5",
  Am9: "A2:.5 E3:.5 B3:.5 C4:.5 E4:.5 C4:.5 B3:.5 E3:.5",
  "Em/G": "G2:.5 E3:.5 G3:.5 B3:.5 E4:.5 B3:.5 G3:.5 E3:.5",
  Fmaj7: "F3:.5 C4:.5 E4:.5 A4:.5 C5:.5 A4:.5 E4:.5 C4:.5",
  "C/E": "E3:.5 G3:.5 C4:.5 E4:.5 G4:.5 E4:.5 C4:.5 G3:.5",
  Dm9: "D3:.5 A3:.5 E4:.5 F4:.5 A4:.5 F4:.5 E4:.5 A3:.5",
};

const atlPianoPulse: Record<string, string> = {
  Bbadd9: "Bb2+F3:.5 C4:.5 D4:.5 F3:.5 Bb2+F3:.5 C4:.5 D4:.5 F4:.5",
  "F/A": "A2+F3:.5 C4:.5 F4:.5 C4:.5 A2+F3:.5 C4:.5 F4:.5 C4:.5",
  Gm9: "G2+D3:.5 A3:.5 Bb3:.5 D4:.5 G2+D3:.5 A3:.5 Bb3:.5 D4:.5",
  "Dm/F": "F2+D3:.5 A3:.5 D4:.5 A3:.5 F2+D3:.5 A3:.5 D4:.5 A3:.5",
  EbMaj7: "Eb2+Bb2:.5 G3:.5 Bb3:.5 D4:.5 Eb2+Bb2:.5 G3:.5 Bb3:.5 D4:.5",
  "Bb/D": "D2+Bb2:.5 F3:.5 Bb3:.5 D4:.5 D2+Bb2:.5 F3:.5 Bb3:.5 D4:.5",
  Cm9: "C2+G2:.5 D3:.5 Eb3:.5 G3:.5 C2+G2:.5 D3:.5 Eb3:.5 G3:.5",
  Cm7: "C2+G2:.5 Bb2:.5 Eb3:.5 G3:.5 C2+G2:.5 Bb2:.5 Eb3:.5 G3:.5",
  Fsus4: "F2+C3:.5 F3:.5 Bb3:.5 C4:.5 F2+C3:.5 F3:.5 Bb3:.5 C4:.5",
  "Fsus4-F": "F2+C3:.5 F3:.5 Bb3:.5 C4:.5 F2+C3:.5 F3:.5 A3:.5 C4:.5",
  Fadd9: "F2+C3:.5 G3:.5 A3:.5 C4:.5 F2+C3:.5 G3:.5 A3:.5 C4:.5",
  "Bb/F": "F2+Bb2:.5 D3:.5 F3:.5 Bb3:.5 F2+Bb2:.5 D3:.5 F3:.5 Bb3:.5",
  Gm: "G2+D3:.5 G3:.5 Bb3:.5 D4:.5 G2+D3:.5 G3:.5 Bb3:.5 D4:.5",
  "Dsus4-D7": "D2+A2:.5 D3:.5 G3:.5 A3:.5 D2+A2:.5 C3:.5 F#3:.5 A3:.5",
  AbMaj7: "Ab2+Eb3:.5 G3:.5 C4:.5 Eb4:.5 Ab2+Eb3:.5 G3:.5 C4:.5 Eb4:.5",
  Fm7: "F2+C3:.5 Eb3:.5 Ab3:.5 C4:.5 F2+C3:.5 Eb3:.5 Ab3:.5 C4:.5",
  Bb: "Bb2+F3:.5 Bb3:.5 D4:.5 F4:.5 Bb2+F3:.5 Bb3:.5 D4:.5 F4:.5",
  "Gsus4-G": "G2+D3:.5 G3:.5 C4:.5 D4:.5 G2+D3:.5 G3:.5 B3:.5 D4:.5",
  "F/G": "G2+C3:.5 F3:.5 A3:.5 C4:.5 G2+C3:.5 F3:.5 A3:.5 C4:.5",
  G7: "G2+D3:.5 F3:.5 B3:.5 D4:.5 G2+D3:.5 F3:.5 B3:.5 D4:.5",
  Cadd9: "C3+G3:.5 D4:.5 E4:.5 G4:.5 C3+G3:.5 D4:.5 E4:.5 G4:.5",
  "G/B": "B2+G3:.5 B3:.5 D4:.5 G4:.5 B2+G3:.5 B3:.5 D4:.5 G4:.5",
  Am9: "A2+E3:.5 B3:.5 C4:.5 E4:.5 A2+E3:.5 B3:.5 C4:.5 E4:.5",
  "Em/G": "G2+E3:.5 G3:.5 B3:.5 E4:.5 G2+E3:.5 G3:.5 B3:.5 E4:.5",
  Fmaj7: "F2+C3:.5 E3:.5 A3:.5 C4:.5 F2+C3:.5 E3:.5 A3:.5 C4:.5",
  "C/E": "E2+C3:.5 G3:.5 C4:.5 E4:.5 E2+C3:.5 G3:.5 C4:.5 E4:.5",
  Dm9: "D2+A2:.5 E3:.5 F3:.5 A3:.5 D2+A2:.5 E3:.5 F3:.5 A3:.5",
};

const atlHold: Record<string, string> = {
  Bbadd9: "D3+F3+Bb3+C4:4",
  "F/A": "F3+A3+C4:4",
  Gm9: "G3+Bb3+D4+A4:4",
  "Dm/F": "F3+A3+D4:4",
  EbMaj7: "G3+Bb3+D4:4",
  "Bb/D": "F3+Bb3+D4:4",
  Cm9: "Eb3+G3+Bb3+D4:4",
  Cm7: "Eb3+G3+Bb3:4",
  Fsus4: "F3+Bb3+C4:4",
  "Fsus4-F": "F3+Bb3+C4:2 F3+A3+C4:2",
  Fadd9: "F3+A3+C4+G4:4",
  "Bb/F": "F3+Bb3+D4:4",
  Gm: "G3+Bb3+D4:4",
  "Dsus4-D7": "A3+D4+G4:2 A3+C4+F#4:2",
  AbMaj7: "Ab3+C4+Eb4+G4:4",
  Fm7: "F3+Ab3+C4+Eb4:4",
  Bb: "F3+Bb3+D4:4",
  "Gsus4-G": "G3+C4+D4:2 G3+B3+D4:2",
  "F/G": "G3+C4+F4+A4:4",
  G7: "G3+B3+D4+F4:4",
  Cadd9: "E3+G3+C4+D4:4",
  "G/B": "G3+B3+D4:4",
  Am9: "E3+A3+C4:4",
  "Em/G": "G3+B3+E4:4",
  Fmaj7: "F3+A3+C4+E4:4",
  "C/E": "G3+C4+E4:4",
  Dm9: "F3+A3+C4+E4:4",
};

const atlChoir: Record<string, string> = {
  Bbadd9: "F3+Bb3+C4:4",
  "F/A": "A3+C4+F4:4",
  Gm9: "Bb3+D4+A4:4",
  "Dm/F": "A3+D4+F4:4",
  EbMaj7: "Bb3+D4+G4:4",
  "Bb/D": "Bb3+D4+F4:4",
  Cm9: "G3+C4+D4:4",
  Cm7: "G3+Bb3+Eb4:4",
  Fsus4: "F3+Bb3+C4:4",
  "Fsus4-F": "C4+F4+Bb4:2 C4+F4+A4:2",
  Gm: "Bb3+D4+G4:4",
  "Dsus4-D7": "A3+D4+G4:2 A3+D4+F#4:2",
  AbMaj7: "C4+Eb4+G4:4",
  Fm7: "Ab3+C4+Eb4:4",
  Bb: "Bb3+D4+F4:4",
  "Gsus4-G": "G3+C4+D4:2 G3+B3+D4:2",
  "F/G": "C4+F4+A4:4",
  G7: "B3+D4+G4:4",
  Cadd9: "G3+C4+D4:4",
  "G/B": "B3+D4+G4:4",
  Am9: "A3+C4+E4:4",
  "Em/G": "B3+E4+G4:4",
  Fmaj7: "A3+C4+E4:4",
  "C/E": "G3+C4+E4:4",
  Dm9: "A3+D4+E4:4",
};

const atlLow: Record<string, string> = {
  Bbadd9: "Bb1:2.5 Bb1:.5 F2:1",
  "F/A": "A1:2.5 A1:.5 F2:1",
  Gm9: "G2:2.5 G2:.5 D2:1",
  "Dm/F": "F2:2.5 F2:.5 D2:1",
  EbMaj7: "Eb2:2.5 Eb2:.5 Bb1:1",
  "Bb/D": "D2:2.5 D2:.5 Bb1:1",
  Cm9: "C2:2.5 C2:.5 G2:1",
  Cm7: "C2:2.5 C2:.5 G2:1",
  Fsus4: "F2:3 C2:1",
  "Fsus4-F": "F2:2 C2:1 F2:1",
  Fadd9: "F2:2.5 F2:.5 C2:1",
  "Bb/F": "F2:2.5 F2:.5 Bb1:1",
  Gm: "G2:2.5 G2:.5 D2:1",
  "Dsus4-D7": "D2:2 A1:1 D2:1",
  AbMaj7: "Ab1:2.5 Ab1:.5 Eb2:1",
  Fm7: "F2:2.5 F2:.5 C2:1",
  Bb: "Bb1:2.5 Bb1:.5 F2:1",
  "Gsus4-G": "G2:2 D2:1 G2:1",
  "F/G": "G2:2.5 G2:.5 D2:1",
  G7: "G2:1.5 G2:.5 D2:1 G2:1",
  Cadd9: "C2:2.5 C2:.5 G2:1",
  "G/B": "B1:2.5 B1:.5 G2:1",
  Am9: "A1:2.5 A1:.5 E2:1",
  "Em/G": "G2:2.5 G2:.5 E2:1",
  Fmaj7: "F2:2.5 F2:.5 C2:1",
  "C/E": "E2:2.5 E2:.5 C2:1",
  Dm9: "D2:2.5 D2:.5 A2:1",
};

const atlIntroCello =
  "F3:1:.85 Bb3:1.5:.95 C4:.5:.9 D4:1:1 " +
  "C4:2:.95 A3:1:.85 F3:1:.8 " +
  "G3:1:.85 Bb3:1.5:.95 D4:.5:1 C4:1:.9 " +
  "Bb3:2.5:.9 -:1.5 " +
  "F3:1:.85 Bb3:1.5:.95 C4:.5:.95 D4:1:1 " +
  "F4:2:1.05 C4:1:.9 A3:1:.85 " +
  "G3:1.5:.9 Bb3:.5:.95 D4:1:1 Bb3:1:.9 " +
  "C4:2.5:.95 -:1.5";

const atlThemeA1 =
  "F4:1:.95 Bb4:1.5:1.1 C5:.5:1 D5:1:1.15 " +
  "C5:2:1.05 A4:1:.9 F4:1:.85 " +
  "G4:1:.95 Bb4:1.5:1.05 C5:.5:1 D5:1:1.15 " +
  "F5:2:1.2 D5:1:1 A4:1:.9 " +
  "G4:1.5:1 A4:.5:.95 Bb4:1:1.05 D5:1:1.1 " +
  "C5:1.5:1.05 Bb4:.5:.95 F4:2:.9 " +
  "G4:1:.95 Bb4:1:1 D5:1:1.1 C5:1:1.05 " +
  "C5:2.5:1.05 -:1.5";

const atlThemeA2High =
  "F5:1:.95 Bb5:1.5:1.1 C6:.5:1.05 D6:1:1.15 " +
  "C6:2:1.05 A5:1:.95 F5:1:.9 " +
  "G5:1:.95 Bb5:1.5:1.1 C6:.5:1.05 D6:1:1.15 " +
  "D6:2:1.15 Bb5:1:1 A5:1:.95 " +
  "G5:1.5:1 A5:.5:1 Bb5:1:1.1 D6:1:1.15 " +
  "C6:1.5:1.1 Bb5:.5:1 A5:1:.95 C6:1:1.05 " +
  "D6:1.5:1.15 C6:.5:1.05 Bb5:2:1.1 " +
  "Bb5:2:1 -:2";

const atlHornUnderA2 =
  "D4:2:.9 F4:2:.95 F4:2:.95 C4:2:.85 D4:2:.95 G4:2:1 A4:2:1 F4:2:.9 " +
  "Eb4:2:.95 G4:2:1 F4:2:1 A4:2:1.05 F4:2:1 D4:2:.95 F4:2:.95 -:2";

const atlThemeB1 =
  "Bb4:1:.95 D5:.5:.95 Eb5:.5:1 F5:1:1.05 G5:1:1.1 " +
  "F5:1.5:1.05 D5:.5:.95 C5:1:.9 A4:1:.85 " +
  "Bb4:1:.95 D5:.5:.95 F5:.5:1.05 G5:1:1.1 D5:1:.95 " +
  "F5:2:1.05 D5:1:.95 A4:1:.85 " +
  "G4:1:.9 Bb4:.5:.95 D5:.5:1 Eb5:1:1.05 G5:1:1.1 " +
  "F5:1.5:1.05 D5:.5:.95 Bb4:1:.9 D5:1:.95 " +
  "Eb5:1:1 D5:.5:.95 C5:.5:.9 Bb4:1:.9 G4:1:.85 " +
  "C5:2.5:1 -:1.5";

const atlThemeB2Horn =
  "G4:1:.95 Bb4:.5:.95 C5:.5:1 D5:1:1.1 Eb5:1:1.1 " +
  "F5:1.5:1.15 D5:.5:1 C5:1:.95 A4:1:.9 " +
  "Bb4:1:1 D5:.5:1.05 C5:.5:1 Bb4:1:.95 G4:1:.9 " +
  "D5:2:1.05 C5:1:.95 Bb4:1:.9 " +
  "G4:1:.95 Bb4:.5:1 D5:.5:1.05 Eb5:1:1.15 D5:1:1.05 " +
  "C5:1.5:1.05 D5:.5:1.05 F5:1:1.15 C5:1:1 " +
  "D5:2:1.1 Bb4:1:1 A4:1:.95 " +
  "G4:2.5:1 -:1.5";

const atlStormHorn =
  "D4:1:.95 G4:1.5:1.1 A4:.5:1.05 Bb4:1:1.15 " +
  "A4:1.5:1.05 G4:.5:1 F4:1:.95 D4:1:.9 " +
  "Eb4:1:.95 G4:1.5:1.05 Bb4:.5:1.05 C5:1:1.1 " +
  "A4:2.5:1.05 -:1.5 " +
  "D5:1.5:1.15 C5:.5:1.05 Bb4:1:1 G4:1:.95 " +
  "Bb4:1.5:1.1 C5:.5:1.05 D5:1:1.15 Bb4:1:1 " +
  "C5:1.5:1.1 Bb4:.5:1.05 Eb5:1:1.2 C5:1:1.05 " +
  "D5:2:1.15 Bb4:1:1 F4:1:.95 " +
  "G4:1:1 C5:1.5:1.15 D5:.5:1.1 Eb5:1:1.2 " +
  "Eb5:1.5:1.15 C5:.5:1.05 Bb4:1:1 G4:1:.95 " +
  "Ab4:1:1 C5:1.5:1.15 Eb5:.5:1.15 F5:1:1.2 " +
  "D5:2.5:1.15 -:1.5 " +
  "Eb5:2:1.2 C5:1:1.05 G4:1:.95 " +
  "F5:2:1.25 D5:1:1.1 Bb4:1:1 " +
  "C5:1.5:1.15 D5:.5:1.1 F5:1:1.2 C5:1:1.05 " +
  "D5:2.5:1.2 -:1.5";

const atlStormFlute =
  "G5:1:.95 C6:1.5:1.05 D6:.5:1.05 Eb6:1:1.15 " +
  "Eb6:1.5:1.1 C6:.5:1 Bb5:1:.95 G5:1:.9 " +
  "Ab5:1:.95 C6:1.5:1.1 Eb6:.5:1.1 F6:1:1.15 " +
  "D6:2.5:1.1 -:1.5 " +
  "Eb6:2:1.15 C6:1:1 G5:1:.95 " +
  "F6:2:1.15 D6:1:1.05 Bb5:1:1 " +
  "C6:1.5:1.1 D6:.5:1.1 F6:1:1.15 E6:1:1.1 " +
  "D6:2:1.15 -:2";

const atlClimaxA1 =
  "G4:1:1 C5:1.5:1.15 D5:.5:1.1 E5:1:1.2 " +
  "D5:2:1.1 B4:1:1 G4:1:.95 " +
  "A4:1:1 C5:1.5:1.15 D5:.5:1.1 E5:1:1.2 " +
  "G5:2:1.25 E5:1:1.1 B4:1:1 " +
  "A4:1.5:1.05 B4:.5:1.05 C5:1:1.15 E5:1:1.2 " +
  "D5:1.5:1.1 C5:.5:1.05 G4:2:.95 " +
  "A4:1:1 C5:1:1.1 E5:1:1.15 D5:1:1.1 " +
  "D5:2.5:1.1 -:1.5";

const atlClimaxA2 =
  "G4:1:1 C5:1.5:1.15 D5:.5:1.1 E5:1:1.2 " +
  "D5:2:1.1 B4:1:1 G4:1:.95 " +
  "A4:1:1 C5:1.5:1.15 D5:.5:1.1 E5:1:1.2 " +
  "G5:2:1.25 E5:1:1.1 B4:1:1 " +
  "A4:1.5:1.1 B4:.5:1.1 C5:1:1.15 E5:1:1.2 " +
  "D5:1.5:1.15 C5:.5:1.05 B4:1:1 D5:1:1.15 " +
  "E5:1.5:1.2 D5:.5:1.1 C5:2:1.15 " +
  "C5:2:1.1 -:2";

const atlClimaxDescant =
  "G5:1:.95 C6:1.5:1.05 D6:.5:1 E6:1:1.15 " +
  "D6:2:1.05 B5:1:.95 G5:1:.9 " +
  "A5:1:.95 C6:1.5:1.1 D6:.5:1.05 E6:1:1.15 " +
  "E6:2:1.15 B5:1:1 G5:1:.95 " +
  "A5:1.5:1 B5:.5:1 C6:1:1.1 E6:1:1.15 " +
  "D6:1.5:1.05 C6:.5:1 G5:2:.95 " +
  "A5:1:1 C6:1:1.05 E6:1:1.1 D6:1:1.05 " +
  "D6:2.5:1.05 -:1.5 " +
  "G5:1:.95 C6:1.5:1.1 D6:.5:1.05 E6:1:1.15 " +
  "D6:2:1.05 B5:1:.95 G5:1:.9 " +
  "A5:1:1 C6:1.5:1.1 D6:.5:1.05 E6:1:1.2 " +
  "E6:2:1.15 B5:1:1 G5:1:.95 " +
  "A5:1.5:1.05 B5:.5:1.05 C6:1:1.15 E6:1:1.2 " +
  "D6:1.5:1.1 C6:.5:1.05 B5:1:1 D6:1:1.1 " +
  "E6:1.5:1.2 D6:.5:1.1 C6:2:1.15 " +
  "C6:2:1.05 -:2";

const atlClimaxHornCounter =
  "E4:2:.95 G4:2:1 G4:2:1 D4:2:.9 E4:2:.95 A4:2:1.05 B4:2:1.05 G4:2:.95 " +
  "F4:2:1 A4:2:1.05 G4:2:1.05 B4:2:1.1 G4:2:1.05 E4:2:1 E4:2:.95 -:2";

const atlCodaHorn =
  "A4:1.5:.95 G4:.5:.9 E4:1:.85 C4:1:.85 " +
  "G4:1.5:.95 E4:.5:.9 C4:2:.85 " +
  "F4:1.5:.95 E4:.5:.9 D4:1:.85 A4:1:.9 " +
  "G4:2.5:.95 -:1.5 " +
  "E4:1:.9 A4:1.5:.95 B4:.5:.95 C5:1:1 " +
  "B4:1.5:.95 G4:.5:.9 E4:2:.85 " +
  "F4:1.5:.95 G4:.5:.9 A4:1:.95 C5:1:1 " +
  "B4:2.5:.95 -:1.5";

const atlCodaCello =
  "G3:1:.85 C4:1.5:.95 D4:.5:.9 E4:1:.95 " +
  "D4:2:.9 B3:1:.85 G3:1:.8 " +
  "A3:1.5:.85 C4:.5:.9 E4:2:.9 " +
  "C4:2:.85 A3:2:.8 " +
  "G3:1.5:.85 C4:.5:.9 D4:2:.9 " +
  "D4:2:.85 B3:2:.8 " +
  "C4:3:.85 -:1 " +
  "-:4";

const atlMarchSnare =
  "C4:1:.7 -:1 C4:.75:.55 C4:.25:.45 C4:1:.8 -:1 C4:.5:.55 C4:.5:.5 C4:.75:.65 C4:.25:.45 -:1";

export const europeanThemes: LayeredTheme[] = [
  {
    id: "atlantic-horizon",
    title: "The Atlantic horizon",
    subtitle:
      "A symphonic overture for the age of steam and iron: solo cello over open strings, a brass anthem in B-flat, a surging storm through G minor and A-flat, and a full orchestral and choral lift into C major.",
    place: "London, New York and the Atlantic, c. 1890",
    culture: ["european", "other-indigenous-american"],
    years: [1800, 1950],
    // Atlantic and North Sea ports and the Americas, not inland Europe.
    lon: [-180, 10],
    evidence:
      "Documented: 19th- and early 20th-century Romantic symphonic orchestras, brass bands and choral societies on both sides of the Atlantic. The melody, harmonic progression and orchestration are original, written in the epic historical-strategy orchestral idiom.",
    bpm: 108,
    meter: 4,
    bars: 88,
    key: "B-flat major, through G minor / A-flat major, lifting to C major",
    reverb: [0.32, 3.0],
    sections: [
      { bar: 0, label: "First light on the piers" },
      { bar: 8, label: "The wide crossing" },
      { bar: 24, label: "The great works" },
      { bar: 40, label: "Storm over the banks" },
      { bar: 56, label: "The new meridian" },
      { bar: 72, label: "Harbour lights" },
    ],
    layers: [
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(atlHold, atlIntro),
        velocity: 0.048,
        exit: 8,
        fade: [0.45, 1],
      },
      {
        voice: "piano",
        stem: "harmony",
        loop: seq(atlHarp, `${atlIntro} ${atlA1}`),
        velocity: 0.125,
        exit: 16,
        pan: -0.22,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: seq(atlHarp, `${atlIntro} ${atlA1} ${atlA2}`),
        velocity: 0.135,
        exit: 24,
        pan: 0.28,
      },
      {
        voice: "cello",
        stem: "melody",
        loop: atlIntroCello,
        velocity: 0.175,
        exit: 8,
        pan: -0.08,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(atlLow, "Bbadd9 F/A EbMaj7 Fsus4"),
        velocity: 0.135,
        enter: 4,
        exit: 8,
        fade: [0.55, 1],
      },

      {
        voice: "bass",
        stem: "bass",
        loop: seq(atlLow, `${atlA1} ${atlA2}`),
        velocity: 0.165,
        enter: 8,
        exit: 24,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(atlHold, `${atlA1} ${atlA2}`),
        velocity: 0.052,
        enter: 8,
        exit: 24,
        fade: [0.7, 1.05],
      },
      {
        voice: "horn",
        stem: "melody",
        loop: atlThemeA1,
        velocity: 0.2,
        enter: 8,
        exit: 16,
        pan: -0.06,
      },
      {
        voice: "piano",
        stem: "harmony",
        loop: seq(atlPianoPulse, atlA2),
        velocity: 0.13,
        enter: 16,
        exit: 24,
        pan: -0.22,
      },
      {
        voice: "strings",
        stem: "melody",
        loop: atlThemeA2High,
        velocity: 0.14,
        enter: 16,
        exit: 24,
        pan: -0.08,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: atlThemeA2High,
        velocity: 0.115,
        enter: 16,
        exit: 24,
        pan: 0.12,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: atlHornUnderA2,
        velocity: 0.13,
        enter: 16,
        exit: 24,
        pan: -0.26,
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(atlChoir, atlA2),
        velocity: 0.048,
        enter: 16,
        exit: 24,
        fade: [0.6, 1.05],
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "Bb1:1.5:1 F1:.5:.65 Bb1:2:.85",
        velocity: 0.145,
        enter: 16,
        exit: 24,
        pan: -0.1,
      },
      {
        voice: "snare",
        stem: "percussion",
        loop: atlMarchSnare,
        velocity: 0.058,
        enter: 16,
        exit: 24,
        pan: 0.18,
        day: true,
      },

      {
        voice: "piano",
        stem: "harmony",
        loop: seq(atlPianoPulse, `${atlB1} ${atlB2}`),
        velocity: 0.14,
        enter: 24,
        exit: 40,
        pan: -0.2,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: seq(atlHarp, `${atlB1} ${atlB2}`),
        velocity: 0.125,
        enter: 24,
        exit: 40,
        pan: 0.28,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(atlLow, `${atlB1} ${atlB2}`),
        velocity: 0.165,
        enter: 24,
        exit: 40,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(atlHold, `${atlB1} ${atlB2}`),
        velocity: 0.045,
        enter: 24,
        exit: 40,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: atlThemeB1,
        velocity: 0.155,
        enter: 24,
        exit: 32,
        pan: -0.08,
      },
      {
        voice: "clarinet",
        stem: "harmony",
        loop: atlThemeB1,
        transpose: -12,
        velocity: 0.115,
        enter: 24,
        exit: 32,
        pan: 0.18,
      },
      {
        voice: "horn",
        stem: "melody",
        loop: atlThemeB2Horn,
        velocity: 0.2,
        enter: 32,
        exit: 40,
        pan: -0.06,
      },
      {
        voice: "flute",
        stem: "harmony",
        loop: "G5:1:.9 Bb5:.5:.95 D6:.5:1 Eb6:1:1.05 D6:1:1 C6:1.5:1 D6:.5:1 F6:1:1.1 C6:1:.95 D6:2:1.05 Bb5:1:.95 A5:1:.9 G5:2.5:.95 -:1.5",
        velocity: 0.105,
        enter: 36,
        exit: 40,
        pan: 0.2,
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "Eb2:1.5:1 Bb1:.5:.65 F2:2:.85 G2:1.5:.95 D2:.5:.6 G2:2:.8",
        velocity: 0.14,
        enter: 24,
        exit: 40,
        pan: -0.1,
      },
      {
        voice: "snare",
        stem: "percussion",
        loop: atlMarchSnare,
        velocity: 0.062,
        enter: 24,
        exit: 40,
        pan: 0.18,
        day: true,
      },
      {
        voice: "kick",
        stem: "percussion",
        loop: "C2:2 -:2",
        velocity: 0.15,
        enter: 32,
        exit: 40,
        day: true,
      },

      {
        voice: "piano",
        stem: "harmony",
        loop: seq(atlPianoPulse, atlC),
        velocity: 0.145,
        enter: 40,
        exit: 56,
        pan: -0.22,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: seq(atlHarp, atlC),
        velocity: 0.135,
        enter: 40,
        exit: 56,
        pan: 0.28,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(atlLow, atlC),
        velocity: 0.175,
        enter: 40,
        exit: 56,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(atlHold, atlC),
        velocity: 0.058,
        enter: 40,
        exit: 56,
        fade: [0.75, 1.2],
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(atlChoir, atlC),
        velocity: 0.058,
        enter: 40,
        exit: 56,
        fade: [0.65, 1.25],
      },
      {
        voice: "horn",
        stem: "melody",
        loop: atlStormHorn,
        velocity: 0.21,
        enter: 40,
        exit: 56,
        pan: -0.06,
      },
      {
        voice: "flute",
        stem: "harmony",
        loop: atlStormFlute,
        velocity: 0.115,
        enter: 48,
        exit: 56,
        pan: 0.18,
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "G2:1.5:1 D2:.5:.7 G2:1:.85 D2:1:.75 Eb2:1.5:1 Bb1:.5:.7 Eb2:2:.9",
        velocity: 0.165,
        enter: 40,
        exit: 54,
        pan: -0.1,
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "G2:1:.9 G2:1:.95 G2:1:1 G2:1:1.05",
        velocity: 0.165,
        enter: 54,
        exit: 55,
        pan: -0.08,
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "G2:.5:.75 G2:.5:.85 G2:.5:.95 G2:.5:1.05 G2:.5:1.1 G2:.5:1.15 G2:.5:1.2 G2:.5:1.25",
        velocity: 0.155,
        enter: 55,
        exit: 56,
        pan: -0.05,
      },
      {
        voice: "snare",
        stem: "percussion",
        loop: atlMarchSnare,
        velocity: 0.072,
        enter: 44,
        exit: 56,
        pan: 0.18,
        day: true,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: "-:2 G3:.25 B3:.25 D4:.25 F4:.25 G4:.25 B4:.25 D5:.25 F5:.25",
        velocity: 0.14,
        enter: 55,
        exit: 56,
        pan: 0.3,
        fade: [0.7, 1.3],
      },

      {
        voice: "piano",
        stem: "harmony",
        loop: seq(atlPianoPulse, `${atlA1C} ${atlA2C}`),
        velocity: 0.145,
        enter: 56,
        exit: 72,
        pan: -0.22,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: seq(atlHarp, `${atlA1C} ${atlA2C}`),
        velocity: 0.14,
        enter: 56,
        exit: 72,
        pan: 0.28,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(atlLow, `${atlA1C} ${atlA2C}`),
        velocity: 0.18,
        enter: 56,
        exit: 72,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(atlHold, `${atlA1C} ${atlA2C}`),
        velocity: 0.06,
        enter: 56,
        exit: 72,
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(atlChoir, `${atlA1C} ${atlA2C}`),
        velocity: 0.062,
        enter: 56,
        exit: 72,
        fade: [0.9, 1.15],
      },
      {
        voice: "strings",
        stem: "melody",
        loop: `${atlClimaxA1} ${atlClimaxA2}`,
        velocity: 0.175,
        enter: 56,
        exit: 72,
        pan: -0.1,
      },
      {
        voice: "horn",
        stem: "melody",
        loop: atlClimaxA1,
        velocity: 0.185,
        enter: 56,
        exit: 64,
        pan: 0.06,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: atlClimaxHornCounter,
        velocity: 0.145,
        enter: 64,
        exit: 72,
        pan: -0.24,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: atlClimaxDescant,
        velocity: 0.125,
        enter: 56,
        exit: 72,
        pan: 0.14,
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "C2:1.5:1 G1:.5:.7 C2:2:.9",
        velocity: 0.165,
        enter: 56,
        exit: 70,
        pan: -0.1,
      },
      {
        voice: "kick",
        stem: "percussion",
        loop: "C2:2 -:2",
        velocity: 0.175,
        enter: 56,
        exit: 70,
        day: true,
      },
      {
        voice: "snare",
        stem: "percussion",
        loop: atlMarchSnare,
        velocity: 0.075,
        enter: 56,
        exit: 70,
        pan: 0.18,
        day: true,
      },
      {
        voice: "carillon",
        stem: "percussion",
        loop: "C5:4 -:12 G4:4 -:12 C5:4 -:12 G4:2 C5:2 C4:4 -:8",
        velocity: 0.065,
        enter: 56,
        exit: 72,
        pan: 0.35,
      },

      {
        voice: "harp",
        stem: "harmony",
        loop: seq(atlHarp, `${atlCoda1} ${atlCoda2}`),
        velocity: 0.135,
        enter: 72,
        exit: 86,
        pan: 0.24,
        fade: [1, 0.6],
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: "C3:1 G3:1 D4:1 E4:1 C3+G3+D4+E4:4",
        velocity: 0.11,
        enter: 86,
        pan: 0.24,
        fade: [0.85, 0.4],
      },
      {
        voice: "piano",
        stem: "harmony",
        loop: seq(atlHarp, atlCoda1),
        velocity: 0.115,
        enter: 72,
        exit: 80,
        pan: -0.22,
        fade: [1, 0.65],
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(atlLow, atlCoda1),
        velocity: 0.135,
        enter: 72,
        exit: 80,
        fade: [1, 0.65],
      },
      {
        voice: "bass",
        stem: "bass",
        loop: "C2:4 B1:4 A1:4 F2:4 C2:4 G2:4 C2:8",
        velocity: 0.11,
        enter: 80,
        fade: [0.9, 0.35],
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(atlHold, `${atlCoda1} ${atlCoda2} Cadd9 Cadd9`),
        velocity: 0.044,
        enter: 72,
        fade: [1, 0.25],
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(atlChoir, `${atlCoda2} Cadd9 Cadd9`),
        velocity: 0.04,
        enter: 80,
        fade: [0.9, 0.2],
      },
      {
        voice: "horn",
        stem: "melody",
        loop: atlCodaHorn,
        velocity: 0.165,
        enter: 72,
        exit: 80,
        pan: -0.06,
      },
      {
        voice: "cello",
        stem: "melody",
        loop: atlCodaCello,
        velocity: 0.155,
        enter: 80,
        pan: -0.1,
      },
      {
        voice: "bell",
        stem: "harmony",
        loop: "G5:2 -:6 C5:2 -:6 G5:2 -:6 C5:4 -:4",
        velocity: 0.065,
        enter: 80,
        pan: 0.35,
        fade: [0.9, 0.35],
      },
    ],
  },
  {
    id: "chartres-stone-bridge",
    title: "The stone bridge at Chartres",
    subtitle:
      "Harp and a distant bell over the river; a Dorian flute tune crosses into a sunny orchard dance for clarinet and lute, lifts through stained glass on horn and choir, and comes home in a Picardy sunrise.",
    place: "Chartres, c. 1240",
    culture: "european",
    years: [1150, 1500],
    evidence:
      "Documented: Gothic cathedral towns in northern France, tuned church bells, harps, lutes, recorders, bowed strings and liturgical choir in the 13th century. The melody, chord progressions and orchestral arrangement are original, written in the manner of 1990s role-playing-game and pastoral scores rather than as a historical reconstruction.",
    bpm: 96,
    meter: 4,
    bars: 76,
    key: "D Dorian, opening to F major, G minor / E-flat major, and D major",
    reverb: [0.28, 2.6],
    sections: [
      { bar: 0, label: "River mist" },
      { bar: 4, label: "The stone bridge" },
      { bar: 20, label: "Orchard lane" },
      { bar: 36, label: "Rose window" },
      { bar: 48, label: "All the bells of town" },
      { bar: 64, label: "Dusk on the bridge" },
    ],
    layers: [
      {
        voice: "carillon",
        stem: "percussion",
        loop: "D4:4 -:12",
        velocity: 0.055,
        exit: 4,
        pan: 0.35,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: seq(bridgeHarp, `${bridgeIntro} ${bridgeA1} ${bridgeA2}`),
        velocity: 0.145,
        exit: 20,
        pan: -0.24,
      },
      {
        voice: "celesta",
        stem: "harmony",
        loop: "-:2 A5:.5 F5:.5 E5:1 -:2 G5:.5 D5:.5 B4:1 -:2 E5:.5 G5:.5 C6:1 -:2 A5:.5 E5:.5 A4:1",
        velocity: 0.095,
        exit: 4,
        pan: 0.35,
        echo: [0.5, 2, 0.4],
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(bridgeChoir, bridgeIntro),
        velocity: 0.04,
        exit: 4,
        fade: [0.4, 0.95],
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(bridgeLow, `${bridgeA1} ${bridgeA2}`),
        velocity: 0.15,
        enter: 4,
        exit: 20,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: `${bridgeTuneA1} ${bridgeTuneA2}`,
        velocity: 0.16,
        enter: 4,
        exit: 20,
        pan: -0.08,
      },
      {
        voice: "pluck",
        stem: "harmony",
        loop: seq(bridgeLute, bridgeA2),
        velocity: 0.12,
        enter: 12,
        exit: 20,
        pan: 0.28,
      },
      {
        voice: "cello",
        stem: "harmony",
        loop: bridgeCelloA2,
        velocity: 0.12,
        enter: 12,
        exit: 20,
        pan: 0.22,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(bridgeHold, bridgeA2),
        velocity: 0.04,
        enter: 12,
        exit: 20,
        fade: [0.6, 1],
      },
      {
        voice: "frame",
        stem: "percussion",
        loop: "D2:1.5:.9 A2:.5:.55 D2:1:.75 A2:1:.5",
        velocity: 0.11,
        enter: 12,
        exit: 20,
        pan: -0.15,
        day: true,
      },
      {
        voice: "brush",
        stem: "percussion",
        loop: "-:1 C4:1",
        velocity: 0.045,
        enter: 12,
        exit: 20,
        pan: 0.25,
        day: true,
      },

      {
        voice: "guitar",
        stem: "harmony",
        loop: seq(orchardGuitar, `${orchardB1} ${orchardB2}`),
        velocity: 0.165,
        enter: 20,
        exit: 36,
        pan: -0.22,
      },
      {
        voice: "pluck",
        stem: "harmony",
        loop: seq(bridgeLute, `${orchardB1} ${orchardB2}`),
        velocity: 0.115,
        enter: 20,
        exit: 36,
        pan: 0.3,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(bridgeLow, `${orchardB1} ${orchardB2}`),
        velocity: 0.155,
        enter: 20,
        exit: 36,
      },
      {
        voice: "clarinet",
        stem: "melody",
        loop: orchardClarinetB1,
        velocity: 0.15,
        enter: 20,
        exit: 28,
        pan: -0.06,
      },
      {
        voice: "flute",
        stem: "harmony",
        loop: "-:12 -:2 E5:.5:.85 G5:.5:.9 A5:1:.95 -:12 -:2 G5:.5:.9 A5:.5:.95 G5:.5:.9 E5:.5:.85",
        velocity: 0.13,
        enter: 20,
        exit: 28,
        pan: 0.28,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: orchardFluteB2,
        velocity: 0.16,
        enter: 28,
        exit: 36,
        pan: -0.08,
      },
      {
        voice: "clarinet",
        stem: "harmony",
        loop: orchardClarinetB2,
        velocity: 0.095,
        enter: 28,
        exit: 36,
        pan: 0.16,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(bridgeHold, orchardB2),
        velocity: 0.038,
        enter: 28,
        exit: 36,
        fade: [0.6, 1],
      },
      {
        voice: "celesta",
        stem: "harmony",
        loop: "-:14 C6:.5 A5:.5 F5:1 -:14 G5:.5 E5:.5 C5:1",
        velocity: 0.09,
        enter: 28,
        exit: 36,
        pan: 0.36,
        echo: [0.5, 1, 0.4],
      },
      {
        voice: "frame",
        stem: "percussion",
        loop: "F2:1.5:.9 C3:.5:.55 F2:1:.75 C3:.5:.5 F2:.5:.6",
        velocity: 0.115,
        enter: 20,
        exit: 36,
        pan: -0.15,
        day: true,
      },
      {
        voice: "wood",
        stem: "percussion",
        loop: "-:1.5 D5:.5:.7 -:1.5 A4:.5:.55",
        velocity: 0.038,
        enter: 20,
        exit: 36,
        pan: 0.35,
        day: true,
      },
      {
        voice: "shaker",
        stem: "percussion",
        loop: "C4:.5:.85 C4:.5:.4",
        velocity: 0.03,
        enter: 20,
        exit: 36,
        pan: 0.28,
        day: true,
      },

      {
        voice: "harp",
        stem: "harmony",
        loop: seq(bridgeHarp, `${roseC} ${bridgeA1} ${bridgeA2Climax}`),
        velocity: 0.15,
        enter: 36,
        exit: 64,
        pan: -0.24,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(bridgeLow, `${roseC} ${bridgeA1} ${bridgeA2Climax}`),
        velocity: 0.165,
        enter: 36,
        exit: 64,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(bridgeHold, roseC),
        velocity: 0.05,
        enter: 36,
        exit: 48,
        fade: [0.65, 1.1],
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(bridgeChoir, roseC),
        velocity: 0.052,
        enter: 36,
        exit: 48,
        fade: [0.65, 1.15],
      },
      {
        voice: "horn",
        stem: "melody",
        loop: roseHorn,
        velocity: 0.19,
        enter: 36,
        exit: 48,
        pan: -0.06,
      },
      {
        voice: "flute",
        stem: "harmony",
        loop: roseFlute,
        velocity: 0.105,
        enter: 40,
        exit: 48,
        pan: 0.22,
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "G2:1.5:1 D2:.5:.65 G2:2:.85 Eb2:1.5:.9 Bb1:.5:.6 Bb1:2:.75",
        velocity: 0.135,
        enter: 36,
        exit: 48,
        pan: -0.1,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: "-:2 A3:.25 C#4:.25 E4:.25 G4:.25 A4:.25 C#5:.25 E5:.25 G5:.25",
        velocity: 0.13,
        enter: 47,
        exit: 48,
        pan: 0.3,
        fade: [0.6, 1.2],
      },

      {
        voice: "strings",
        stem: "melody",
        loop: `${bridgeTuneA1} ${bridgeTuneA2Climax}`,
        velocity: 0.16,
        enter: 48,
        exit: 64,
        pan: -0.08,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: `${bridgeTuneA1} ${bridgeTuneA2Climax}`,
        velocity: 0.125,
        enter: 48,
        exit: 64,
        pan: 0.1,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: bridgeHornClimax,
        velocity: 0.125,
        enter: 48,
        exit: 64,
        pan: -0.26,
      },
      {
        voice: "pluck",
        stem: "harmony",
        loop: seq(bridgeLute, `${bridgeA1} ${bridgeA2Climax}`),
        velocity: 0.11,
        enter: 48,
        exit: 64,
        pan: 0.3,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: seq(bridgeHold, `${bridgeA1} ${bridgeA2Climax}`),
        velocity: 0.048,
        enter: 48,
        exit: 64,
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(bridgeChoir, bridgeA2Climax),
        velocity: 0.055,
        enter: 56,
        exit: 64,
        fade: [0.7, 1.15],
      },
      {
        voice: "footdrum",
        stem: "percussion",
        loop: "D2:1.5:1 A1:.5:.65 D2:2:.85",
        velocity: 0.14,
        enter: 48,
        exit: 62,
        pan: -0.1,
      },
      {
        voice: "frame",
        stem: "percussion",
        loop: "D2:1:.85 A2:.5:.5 D2:.5:.65 A2:1:.7 D2:1:.6",
        velocity: 0.11,
        enter: 48,
        exit: 62,
        pan: -0.2,
        day: true,
      },
      {
        voice: "brush",
        stem: "percussion",
        loop: "-:1 C4:1",
        velocity: 0.055,
        enter: 48,
        exit: 62,
        pan: 0.25,
        day: true,
      },
      {
        voice: "shaker",
        stem: "percussion",
        loop: "C4:.5:.85 C4:.5:.4",
        velocity: 0.032,
        enter: 48,
        exit: 62,
        pan: 0.3,
        day: true,
      },
      {
        voice: "carillon",
        stem: "percussion",
        loop: "D5:2 A4:2 D4:4",
        velocity: 0.06,
        enter: 62,
        exit: 64,
        pan: 0.35,
      },

      {
        voice: "harp",
        stem: "harmony",
        loop: seq(bridgeHarp, bridgeCoda),
        velocity: 0.135,
        enter: 64,
        exit: 74,
        pan: -0.22,
        fade: [1, 0.7],
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: "C3:1 G3:1 D4:1 E4:1 D3:1 A3:1 E4:1 F4:1",
        velocity: 0.11,
        enter: 74,
        pan: -0.22,
        fade: [0.9, 0.45],
      },
      {
        voice: "pluck",
        stem: "harmony",
        loop: seq(bridgeLute, "Dm9 G/B Cadd9 Fmaj7 BbMaj7 Gm7 Asus4-A7 Dm9"),
        velocity: 0.095,
        enter: 64,
        exit: 72,
        pan: 0.26,
        fade: [1, 0.55],
      },
      {
        voice: "bass",
        stem: "bass",
        loop: seq(bridgeLow, "Dm9 G/B Cadd9 Fmaj7 BbMaj7 Gm7 Asus4-A7 Dm9"),
        velocity: 0.125,
        enter: 64,
        exit: 72,
        fade: [1, 0.6],
      },
      {
        voice: "bass",
        stem: "bass",
        loop: "D2:4 D2:4 C2:4 D2:4",
        velocity: 0.1,
        enter: 72,
        fade: [0.85, 0.35],
      },
      {
        voice: "clarinet",
        stem: "melody",
        loop: bridgeCodaClarinet,
        velocity: 0.155,
        enter: 64,
        exit: 72,
        pan: -0.06,
      },
      {
        voice: "choir",
        stem: "harmony",
        loop: seq(bridgeChoir, "Dm9 G/D Cadd9 Dm9"),
        velocity: 0.038,
        enter: 72,
        fade: [0.85, 0.25],
      },
      {
        voice: "celesta",
        stem: "harmony",
        loop: "-:2 A5:.5 F5:.5 E5:1 -:2 G5:.5 D5:.5 B4:1 -:2 E5:.5 G5:.5 C6:1 -:2 A5:.5 F5:.5 D5:1",
        velocity: 0.09,
        enter: 72,
        pan: 0.35,
        echo: [0.5, 2, 0.4],
        fade: [0.95, 0.4],
      },
      {
        voice: "carillon",
        stem: "percussion",
        loop: "A4:2 D4:6",
        velocity: 0.055,
        enter: 74,
        pan: 0.35,
      },
    ],
  },
  {
    id: "bruges-carillon",
    title: "Market morning in Bruges",
    subtitle:
      "Recorder and lute over a bouncing bass while the belfry marks the hour: a tune to whistle crossing the Markt.",
    place: "Bruges, c. 1550",
    culture: "european",
    years: [1450, 2026],
    evidence:
      "Documented: Low Countries belfries sounded tunes on tuned bells from the 15th century, and recorders, lutes and dance tunes were everyday town music in 16th-century Flanders (Susato's dance books, Antwerp, 1551). The tune and arrangement are original.",
    bpm: 112,
    meter: 4,
    bars: 64,
    key: "G major",
    swing: [0.5, 0.06],
    reverb: [0.2, 1.6],
    sections: [
      { bar: 0, label: "Hour bell" },
      { bar: 4, label: "Tune" },
      { bar: 20, label: "Across the square" },
      { bar: 36, label: "Lute" },
      { bar: 44, label: "Together" },
      { bar: 60, label: "Home" },
    ],
    layers: [
      {
        voice: "carillon",
        stem: "percussion",
        loop: "G4:4 D4:4 G3:8",
        velocity: 0.07,
        exit: 4,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: changes
          .map((c) => {
            const [root, fifth] = chords[c];
            return `${root}:1 ${fifth}:1 ${root}:1 ${fifth}:.5 ${root}:.5`;
          })
          .join(" "),
        velocity: 0.2,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: changes
          .map((c) => {
            const [a, b, d, e] = chords[c][2].split(" ");
            return [a, b, d, e, d, b, d, b].map((n) => `${n}:.5`).join(" ");
          })
          .join(" "),
        velocity: 0.1,
        pan: 0.25,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: [
          "-:16",
          verseOpen,
          verseClose,
          tuneB,
          verseClose,
          "-:32",
          tuneB,
          verseClose,
          "B4:1 D5:1 G5:2 A5:1 F#5:1 D5:2 E5:1 C5:1 A4:1 F#4:1 G4:4",
        ].join(" "),
        velocity: 0.24,
        pan: -0.1,
      },
      {
        voice: "pluck",
        stem: "melody",
        loop: verseOpen,
        velocity: 0.2,
        enter: 36,
        exit: 44,
        transpose: -12,
        pan: -0.2,
      },
      {
        voice: "chime",
        stem: "harmony",
        loop: `${tuneB} ${verseClose}`,
        velocity: 0.05,
        enter: 44,
        exit: 60,
        pan: 0.3,
      },
      {
        voice: "wood",
        stem: "percussion",
        loop: "-:1 C5:1:.8 -:1 C5:.5 C5:.5:.6",
        velocity: 0.07,
        enter: 4,
        exit: 60,
        day: true,
        pan: 0.3,
      },
      {
        voice: "shaker",
        stem: "percussion",
        loop: "C5:.5:1 C5:.5:.5",
        velocity: 0.04,
        enter: 20,
        exit: 60,
        day: true,
        pan: -0.3,
      },
      {
        voice: "carillon",
        stem: "percussion",
        loop: "G4:4 G3:4",
        velocity: 0.06,
        enter: 62,
      },
    ],
  },
];
