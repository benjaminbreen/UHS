import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useWikiPage } from "./useWikiSummary";

/** The Wikipedia lead and photograph for a named species, under the focus card. */
export function WikiFocus({
  latin,
  reopen,
}: {
  latin: string;
  reopen: number;
}) {
  const page = useWikiPage(latin.replace(/ /g, "_"));
  const [open, setOpen] = useState(false);
  const seen = useRef(reopen);
  useEffect(() => {
    if (reopen !== seen.current && page?.thumb) setOpen(true);
    seen.current = reopen;
  }, [reopen, page]);
  if (!page) return null;
  const sentences = page.extract.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [
    page.extract,
  ];
  return (
    <div className="wiki-focus">
      {page.thumb && (
        <button className="wiki-photo" onClick={() => setOpen(true)}>
          <img src={page.thumb} alt={latin} />
          <span>Present-day photograph</span>
        </button>
      )}
      <p>
        <i>{latin}</i>. {sentences.slice(0, 3).join("").trim()}
      </p>
      <a href={page.url} target="_blank" rel="noreferrer">
        Read more on Wikipedia →
      </a>
      {open && (
        <div
          className="modal-backdrop wiki-lightbox"
          onClick={() => setOpen(false)}
        >
          <figure onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
            <img src={page.image ?? page.thumb} alt={latin} />
            <figcaption>
              <i>{latin}</i> · image via Wikimedia Commons ·{" "}
              <a href={page.url} target="_blank" rel="noreferrer">
                source and licence
              </a>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
