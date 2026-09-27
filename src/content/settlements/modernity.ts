import type { WorldSetting } from "../geography/types";

/** When factory industry and then the motor car began to reshape the towns of
 * a region. Two dates, not one threshold, because the rail-and-mill city and the
 * car-and-suburb city are different shapes and a region reaches them decades
 * apart. These are regional onsets for layout, not dates for any one town. */
export type Modernity = {
  id: string;
  /** Mills, railways and workers' districts begin to shape towns. */
  industrial: number;
  /** Mass car ownership: parking, arterials, suburbs, strip retail. */
  motor: number;
  note: string;
};

type Rule = Modernity & {
  /** West, south, east, north degrees. */
  bounds: readonly [number, number, number, number];
};

// Smaller boxes first: the first box that contains a place wins.
const rules: Rule[] = [
  {
    id: "britain",
    bounds: [-11, 49, 2, 61],
    industrial: 1820,
    motor: 1955,
    note: "Lancashire mill towns and the railway boom of the 1830s-40s; car ownership becomes general in the 1950s-60s.",
  },
  {
    id: "southern-africa",
    bounds: [16, -35, 33, -22],
    industrial: 1890,
    motor: 1955,
    note: "The Witwatersrand gold field from 1886 and the railways built to it.",
  },
  {
    id: "japan",
    bounds: [128, 30, 146, 46],
    industrial: 1890,
    motor: 1965,
    note: "Meiji industrialisation from the 1880s; motorisation follows the 1960s growth years.",
  },
  {
    id: "north-america",
    bounds: [-170, 24, -52, 72],
    industrial: 1850,
    motor: 1920,
    note: "New England and Great Lakes mill and rail towns from the 1840s-50s; the United States motorises first, from the 1920s.",
  },
  {
    id: "western-europe",
    bounds: [-11, 36, 20, 60],
    industrial: 1860,
    motor: 1955,
    note: "Belgian, Rhenish and northern French industry from mid-century, the rest by 1880; mass car ownership after the war.",
  },
  {
    id: "eastern-europe",
    bounds: [20, 36, 60, 70],
    industrial: 1890,
    motor: 1975,
    note: "Russian and Polish industrial growth from the 1890s; private cars stay scarce until the 1970s.",
  },
  {
    id: "australasia",
    bounds: [110, -48, 179, -10],
    industrial: 1870,
    motor: 1945,
    note: "Colonial rail and port cities after the gold rushes; early mass motoring.",
  },
  {
    id: "latin-america",
    bounds: [-118, -56, -34, 24],
    industrial: 1900,
    motor: 1960,
    note: "Buenos Aires, Sao Paulo and Mexico City industrialise from about 1900.",
  },
  {
    id: "south-asia",
    bounds: [60, 5, 97, 37],
    industrial: 1880,
    motor: 1995,
    note: "Bombay cotton mills from the 1850s and railway towns across the subcontinent; mass motoring only after liberalisation.",
  },
  {
    id: "east-asia",
    bounds: [97, 18, 135, 54],
    industrial: 1910,
    motor: 1995,
    note: "Treaty-port industry before 1937, planned industrial cities after 1949; mass car ownership after 1995.",
  },
  {
    id: "southeast-asia",
    bounds: [92, -11, 141, 23],
    industrial: 1920,
    motor: 1990,
    note: "Colonial port and processing towns; motorcycles before cars.",
  },
  {
    id: "west-asia-north-africa",
    bounds: [-18, 12, 63, 42],
    industrial: 1920,
    motor: 1970,
    note: "Railways and oil from the 1920s; planned new quarters beside the old cities.",
  },
  {
    id: "sub-saharan-africa",
    bounds: [-18, -35, 52, 12],
    industrial: 1930,
    motor: 1990,
    note: "Colonial railheads and ports; industry concentrated in a few centres.",
  },
];

const elsewhere: Modernity = {
  id: "elsewhere",
  industrial: 1920,
  motor: 1980,
  note: "No regional entry: a late, generic onset.",
};

export function modernity(s: Pick<WorldSetting, "lon" | "lat">): Modernity {
  return (
    rules.find(
      ({ bounds: [w, south, e, n] }) =>
        s.lon >= w && s.lon <= e && s.lat >= south && s.lat <= n,
    ) ?? elsewhere
  );
}

export const industrialized = (s: Pick<WorldSetting, "lon" | "lat" | "year">) =>
  s.year >= modernity(s).industrial;

export const motorized = (s: Pick<WorldSetting, "lon" | "lat" | "year">) =>
  s.year >= modernity(s).motor;
