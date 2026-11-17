import { hash } from "../../core/random";
import { isExhibitIcon, type ExhibitIcon } from "../../render/fair/items";
import { FAIR_SIZES, type FairArt, type FairFind } from "./types";

type CatalogEntry = readonly [
  page: number, exhibitor: string, name: string, art: ExhibitIcon | FairArt,
  details?: { entry?: string; look?: string; photo?: NonNullable<FairFind["source"]>["photo"]; variant?: number },
];

type CatalogSection = readonly [area: string, title: string, entries: readonly CatalogEntry[]];

export function catalogFinds(fair: string, pageUrl: (page: number) => string, sections: readonly CatalogSection[]): FairFind[] {
  return sections.flatMap(([area, section, entries]) => entries.map(([page, exhibitor, name, art, details]): FairFind => ({
    id: `${fair}-catalog-${hash(`${page}|${exhibitor}|${name}`).toString(36)}`,
    name, art: isExhibitIcon(art) ? "catalog-item" : art, on: isExhibitIcon(art) ? "case" : art === "curtain" ? "wall" : "floor", tags: [area], tier: "common",
    w: isExhibitIcon(art) ? undefined : FAIR_SIZES[art]?.[0],
    h: isExhibitIcon(art) ? undefined : FAIR_SIZES[art]?.[1],
    verb: "", text: "", basis: "documented",
    look: `Shown by ${exhibitor.replace(/\.$/, "")}.${details?.look ? ` ${details.look}` : ""}`,
    catalog: { section, icon: isExhibitIcon(art) ? art : undefined, variant: details?.variant },
    source: {
      url: pageUrl(page),
      label: `Official catalog · p. ${page}${details?.entry ? `, entry ${details.entry}` : ""}`,
      photo: details?.photo,
    },
  })));
}
