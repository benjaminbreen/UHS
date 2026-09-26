import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatHistoricalYear } from "../core/calendar";
import { SKILLS, type SkillId } from "../core/skills";
import { TECHNIQUES, techniqueIds, type TechniqueId } from "../core/techniques";
import { skillContext, techniqueContext } from "../content/skill-context";
import { eraAt } from "../content/history/dates";
import { cultures, type CultureId } from "../content/history/types";
import { wikiSummary, type WikiSummary } from "./wiki";

export type Place = { culture: CultureId; year: number; location: string };

/** History around the fire: what a skill or technique meant in the player's
 * own time and place, from Wikipedia and from the scholarship. */
export function SkillLore({
  skill,
  technique,
  place,
  onTechnique,
  onClose,
}: {
  skill: SkillId;
  technique?: TechniqueId;
  place?: Place;
  onTechnique: (id?: TechniqueId) => void;
  onClose: () => void;
}) {
  const era = place ? eraAt({ year: place.year }) : undefined;
  const cultureLabel = place ? cultures.find(([id]) => id === place.culture)?.[1] : undefined;
  const ctx = skillContext(skill, place?.culture, era?.id);
  const note = technique ? techniqueContext(skill, technique) : undefined;
  const titles = technique ? (note?.wiki ? [note.wiki] : []) : ctx.wiki;
  const [article, setArticle] = useState(0);
  const [pages, setPages] = useState<(WikiSummary | undefined)[]>();
  useEffect(() => {
    setArticle(0);
    setPages(undefined);
    let live = true;
    void Promise.all(titles.map(wikiSummary)).then((all) => live && setPages(all));
    return () => {
      live = false;
    };
  }, [skill, technique, titles.join("|")]);
  const found = pages?.filter((p): p is WikiSummary => !!p) ?? [];
  const page = found[Math.min(article, found.length - 1)];
  const own = techniqueIds.filter((id) => TECHNIQUES[id].skill === skill);
  const where = [cultureLabel, era?.label].filter(Boolean).join(", ");
  const fit =
    ctx.matched.culture && ctx.matched.era
      ? `Chosen for ${where}`
      : ctx.matched.culture
        ? `Chosen for ${cultureLabel}`
        : ctx.matched.era
          ? `Chosen for ${era?.label.toLowerCase()}`
          : `General reading; nothing here yet is specific to ${where || "your time and place"}`;

  return (
    <section className="vault-lore" aria-label="Historical context" data-group={SKILLS[skill].group}>
      <div className="vault-lore-panel" key={`${skill}-${technique ?? ""}`}>
        <header style={{ "--i": 0 } as CSSProperties}>
          <button className="vault-lore-back" onClick={onClose}>
            ‹ Back
          </button>
          <small>Historical context</small>
          <h2>{technique ? TECHNIQUES[technique].name : SKILLS[skill].name}</h2>
          {place && (
            <p>
              {place.location} <span>·</span> {formatHistoricalYear(place.year)} <span>·</span> {where}
            </p>
          )}
        </header>
        <nav className="vault-lore-chips" style={{ "--i": 1 } as CSSProperties} aria-label="Skill and techniques">
          <button data-on={!technique || undefined} onClick={() => onTechnique(undefined)}>
            {SKILLS[skill].name}
          </button>
          {own.map((id) => (
            <button key={id} data-on={technique === id || undefined} onClick={() => onTechnique(id)}>
              {TECHNIQUES[id].name}
            </button>
          ))}
        </nav>
        {note && (
          <p className="vault-lore-note" style={{ "--i": 2 } as CSSProperties}>
            {note.note}
          </p>
        )}
        <article className="vault-lore-article" style={{ "--i": 3 } as CSSProperties} aria-busy={!pages}>
          {!pages ? (
            <div className="vault-lore-loading">
              <i />
              <i />
              <i />
              <span>Reading…</span>
            </div>
          ) : page ? (
            <>
              {page.image && <PixelImage key={page.image} src={page.image} alt={page.title} />}
              <div>
                <h3>{page.title}</h3>
                <p>{page.extract}</p>
                <a href={page.url} target="_blank" rel="noreferrer">
                  Read on Wikipedia ↗
                </a>
              </div>
            </>
          ) : (
            <p className="vault-lore-empty">
              {titles.length ? "Wikipedia could not be reached. The reading below still stands." : "No article for this one yet."}
            </p>
          )}
        </article>
        {found.length > 1 && (
          <div className="vault-lore-more" style={{ "--i": 4 } as CSSProperties}>
            <small>Also on Wikipedia</small>
            {found.map((p, i) => (
              <button key={p.title} data-on={i === article || undefined} onClick={() => setArticle(i)}>
                {p.title}
              </button>
            ))}
          </div>
        )}
        <div className="vault-lore-sources" style={{ "--i": 5 } as CSSProperties}>
          <h4>
            Further reading <small>{fit}</small>
          </h4>
          <ol>
            {ctx.sources.map((s, i) => (
              <li key={s.title} style={{ "--j": i } as CSSProperties}>
                <a href={`https://openlibrary.org/search?q=${encodeURIComponent(`${s.title} ${s.author.split(/,| and /)[0]}`)}`} target="_blank" rel="noreferrer">
                  <span>{s.author}</span>
                  <cite>{s.title}</cite>
                  <b>{s.year}</b>
                </a>
                <p>{s.note}</p>
              </li>
            ))}
          </ol>
        </div>
        <footer style={{ "--i": 6 } as CSSProperties}>Techniques are the game's abstractions. The history and the books are real.</footer>
      </div>
    </section>
  );
}

const LEVELS = 5;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A Wikipedia image redrawn as dithered pixel art, dissolving in along the
 * dither pattern itself. Falls back to the plain image if the pixels cannot
 * be read. */
function PixelImage({ src, alt }: { src: string; alt: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [plain, setPlain] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let raf = 0;
    img.onload = () => {
      const c = canvas.current;
      if (!c) return;
      const w = 132, h = Math.max(1, Math.round((img.height / img.width) * w));
      c.width = w;
      c.height = Math.min(h, 160);
      const g = c.getContext("2d")!;
      g.drawImage(img, 0, 0, w, h);
      let data: ImageData;
      try {
        data = g.getImageData(0, 0, c.width, c.height);
      } catch {
        setPlain(true);
        return;
      }
      const out = g.createImageData(c.width, c.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const p = i / 4, x = p % c.width, y = Math.floor(p / c.width);
        const t = BAYER[(x & 3) + (y & 3) * 4] / 16;
        for (let k = 0; k < 3; k++) out.data[i + k] = (Math.min(LEVELS, Math.floor((data.data[i + k] / 255) * LEVELS + t)) / LEVELS) * 255;
        out.data[i + 3] = 255;
      }
      const start = performance.now();
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const frame = () => {
        const p = still ? 1 : Math.min(1, (performance.now() - start) / 900);
        const shown = g.createImageData(c.width, c.height);
        for (let i = 0; i < out.data.length; i += 4) {
          const q = i / 4, x = (q % c.width) >> 1, y = Math.floor(q / c.width) >> 1;
          if (BAYER[(x & 3) + (y & 3) * 4] / 16 < p) shown.data.set(out.data.subarray(i, i + 4), i);
        }
        g.putImageData(shown, 0, 0);
        if (p < 1) raf = requestAnimationFrame(frame);
      };
      frame();
    };
    img.onerror = () => setPlain(true);
    img.src = src;
    return () => cancelAnimationFrame(raf);
  }, [src]);
  return (
    <figure className="vault-lore-image">
      {plain ? <img src={src} alt={alt} /> : <canvas ref={canvas} role="img" aria-label={alt} />}
    </figure>
  );
}
