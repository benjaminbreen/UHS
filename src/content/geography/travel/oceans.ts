import type { Coordinate } from "../../../world/travel/types";

export type WaterRegion = { id: string; name: string; spacing: number };
const ocean = (id: string, name: string, spacing: number): WaterRegion => ({
  id,
  name,
  spacing,
});

// Approximate geographic labels, not navigation, current, or sea-ice models.
export function waterRegion({ lon: x, lat: y }: Coordinate): WaterRegion {
  if (y < -60) {
    const sector =
      x >= -70 && x < 20
        ? "Atlantic"
        : x >= 20 && x < 147
          ? "Indian"
          : "Pacific";
    return ocean(
      `southern-${sector.toLowerCase()}`,
      `${sector} Southern Ocean`,
      1600,
    );
  }
  if (y > 66)
    return ocean(
      "arctic",
      x < -45
        ? "Western Arctic Ocean"
        : x < 90
          ? "Eurasian Arctic waters"
          : "Eastern Arctic Ocean",
      1000,
    );
  if (x > -6 && x < 37 && y > 30 && y < 46)
    return ocean(
      "mediterranean",
      x < 15 ? "Western Mediterranean" : "Eastern Mediterranean",
      600,
    );
  if (x > 27 && x < 42 && y >= 40 && y < 48)
    return ocean("black-sea", "Black Sea", 500);
  if (x > 32 && x < 44 && y > 12 && y < 30)
    return ocean("red-sea", "Red Sea", 600);
  if (x > 47 && x < 57 && y > 23 && y < 31)
    return ocean("persian-gulf", "Persian Gulf", 450);
  if (x > -100 && x < -81 && y > 18 && y < 31)
    return ocean("gulf-mexico", "Gulf of Mexico", 800);
  if (x > -89 && x < -60 && y > 8 && y <= 23)
    return ocean("caribbean", "Caribbean Sea", 800);
  if (x > -85 && x < -50 && y > 50 && y < 66)
    return ocean(
      "labrador",
      x < -65 ? "Hudson Bay waters" : "Labrador Sea",
      900,
    );
  if (x > -20 && x < 15 && y > 58 && y <= 66)
    return ocean("norwegian", "Norwegian Sea", 900);
  if (x > 9 && x < 31 && y > 53 && y < 66)
    return ocean("baltic", "Baltic Sea", 500);
  if (x > -12 && x < -4 && y > 48 && y < 53)
    return ocean("celtic", "Celtic Sea", 900);
  if (x > -82 && x < -73 && y > 30 && y < 37)
    return ocean("carolina-shelf", "Carolina–Georgia shelf", 900);
  if (x > -1 && x < 9 && y > 51 && y < 62)
    return ocean("north-sea", "North Sea", 500);
  if (x > 100 && x < 122 && y > 0 && y < 23)
    return ocean("south-china", "South China Sea", 700);
  if (x >= 117 && x < 131 && y >= 23 && y < 41)
    return ocean("east-china", y > 33 ? "Yellow Sea" : "East China Sea", 600);
  if (x > 127 && x < 143 && y > 34 && y < 51)
    return ocean("japan-sea", "Sea of Japan", 600);
  if ((x > 160 || x < -155) && y > 52)
    return ocean("bering", "Bering Sea", 900);
  if (x >= 20 && x < 147 && y < 30 && (x < 100 || y < -8)) {
    if (y > 5 && x < 78) return ocean("arabian", "Arabian Sea", 1200);
    if (y > 5 && x < 100) return ocean("bengal", "Bay of Bengal", 1000);
    const side = x < 60 ? "Western" : x < 95 ? "Central" : "Eastern";
    return ocean(`indian-${side.toLowerCase()}`, `${side} Indian Ocean`, 1600);
  }
  if ((x >= -70 && x < 20) || (x >= -82 && x < -70 && y > 23)) {
    const side =
      x < -50
        ? "Western"
        : x < -35
          ? "West-central"
          : x < -20
            ? "East-central"
            : "Eastern";
    const half = y >= 0 ? "North" : "South";
    return ocean(
      `atlantic-${half.toLowerCase()}-${side.toLowerCase()}`,
      `${side} ${half} Atlantic`,
      2200,
    );
  }
  const side =
    x >= 0
      ? x < 160
        ? "Western"
        : "West-central"
      : x < -140
        ? "East-central"
        : "Eastern";
  const half = y >= 0 ? "North" : "South";
  return ocean(
    `pacific-${half.toLowerCase()}-${side.toLowerCase()}`,
    `${side} ${half} Pacific`,
    1300,
  );
}
