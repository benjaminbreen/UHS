import type { GarmentKit } from "../types";

/**
 * Layers over the body garment: the waistcoat, the shawl, and the hood worn
 * down on the shoulders. Like work-dress, a kit that names a slot must offer
 * something to everyone it offers anything to.
 */

const underCoat = ["shirt", "coat", "suit"] as const;

export const layers: readonly GarmentKit[] = [
  {
    id: "europe-waistcoat",
    label: "Europe · the waistcoat",
    // Charles II's court took up the vest in 1666; it was the middle of the
    // three-piece suit until the mid-twentieth century, figured silk for the
    // rich and plain wool or fustian for working men.
    scope: { years: [1666, 1960], cultures: ["european"] },
    waistcoat: [
      { value: "figured", sex: ["male"], means: ["wealthy", "elite"], weight: 3, garments: underCoat },
      { value: "plain", sex: ["male"], means: ["wealthy", "elite"], weight: 2, garments: underCoat },
      { value: "none", sex: ["male"], means: ["wealthy", "elite"], weight: 1 },
      { value: "plain", sex: ["male"], means: ["common"], weight: 3, garments: underCoat },
      { value: "none", sex: ["male"], means: ["common"], weight: 2 },
      { value: "plain", sex: ["male"], means: ["poor"], weight: 1, garments: underCoat },
      { value: "none", sex: ["male"], means: ["poor"], weight: 3 },
    ],
  },
  {
    id: "ottoman-yelek",
    label: "Ottoman world · the yelek",
    // A short fitted vest over the shirt, often braided or embroidered, worn
    // by men and women from the Balkans to Syria.
    scope: { years: [1500, 1930], cultures: ["north-african-west-asian"] },
    waistcoat: [
      { value: "figured", weight: 2, garments: ["shirt", "coat", "tunic", "long-tunic", "robe"] },
      { value: "plain", weight: 1, garments: ["shirt", "coat", "tunic", "long-tunic", "robe"] },
      { value: "none", weight: 3 },
    ],
  },
  {
    id: "europe-shawl",
    label: "Europe · the shawl",
    // Printed and knitted shawls were the poorer woman's coat from the 1780s
    // to the First World War; Kashmir and Paisley shawls the richer one's.
    scope: { years: [1780, 1940], cultures: ["european"] },
    shawl: [
      { value: "fringed", sex: ["female"], means: ["poor", "common"], weight: 2 },
      { value: "plain", sex: ["female"], means: ["poor", "common"], weight: 2 },
      { value: "none", sex: ["female"], means: ["poor", "common"], weight: 3 },
      { value: "patterned", sex: ["female"], means: ["wealthy", "elite"], weight: 3 },
      { value: "fringed", sex: ["female"], means: ["wealthy", "elite"], weight: 1 },
      { value: "none", sex: ["female"], means: ["wealthy", "elite"], weight: 2 },
    ],
  },
  {
    id: "kashmir-shawl",
    label: "South Asia · the Kashmir shawl",
    // Woven of pashmina goat's down in Kashmir from at least the sixteenth
    // century; a mark of rank given at the Mughal court, worn by men.
    scope: { years: [1500, 1950], cultures: ["south-asian"] },
    shawl: [
      { value: "patterned", sex: ["male"], means: ["wealthy", "elite"], weight: 2 },
      { value: "none", sex: ["male"], means: ["wealthy", "elite"], weight: 3 },
    ],
  },
  {
    id: "andes-lliclla",
    label: "Andes · the lliclla",
    // A woman's mantle of striped warp-faced weaving, pinned at the chest
    // with a tupu, from Inka times to the present.
    scope: { years: [1000, 3000], cultures: ["andean"] },
    shawl: [
      { value: "patterned", sex: ["female"], weight: 3 },
      { value: "none", sex: ["female"], weight: 2 },
    ],
  },
  {
    id: "mexico-rebozo",
    label: "Mexico · the rebozo",
    // The long fringed shawl appears in New Spain by the late sixteenth
    // century and was worn by women of every class.
    scope: { years: [1580, 3000], cultures: ["mesoamerican"] },
    shawl: [
      { value: "fringed", sex: ["female"], weight: 3 },
      { value: "patterned", sex: ["female"], weight: 1 },
      { value: "none", sex: ["female"], weight: 2 },
    ],
  },
  {
    id: "europe-hood",
    label: "Europe · the hood down",
    // The separate hood with its shoulder cape, worn up in the weather and
    // back on the shoulders the rest of the time, until the chaperon turned
    // into a hat in the fifteenth century.
    scope: { years: [1000, 1480], cultures: ["european"] },
    hood: [
      { value: "down", means: ["poor", "common"], weight: 2 },
      { value: "none", means: ["poor", "common"], weight: 3 },
    ],
  },
  {
    id: "hoodie",
    label: "The hooded sweatshirt",
    // Sportswear by the 1930s, everyday wear for the young from the 1980s.
    scope: { years: [1985, 3000] },
    hood: [
      { value: "down", ages: ["youth"], weight: 2, garments: ["shirt", "coat"] },
      { value: "none", ages: ["youth"], weight: 3 },
      { value: "down", ages: ["adult"], weight: 1, garments: ["shirt", "coat"] },
      { value: "none", ages: ["adult"], weight: 6 },
    ],
  },
];
