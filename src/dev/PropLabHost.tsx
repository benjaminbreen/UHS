import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
const PropLab = lazy(() => import("./PropLab"));

/** One global shortcut works in the world and both existing labs. Capture prevents
 * the underlying game receiving commands while the art-review dialog is open. */
export function PropLabHost({
  children,
  onOpen,
  standalone = false,
}: {
  children?: ReactNode;
  onOpen?: () => void;
  standalone?: boolean;
}) {
  const [open, setOpen] = useState(standalone);
  const callback = useRef(onOpen);
  callback.current = onOpen;
  const close = () => {
    if (standalone) location.href = "/";
    else setOpen(false);
  };
  useEffect(() => {
    const show = () => {
      callback.current?.();
      setOpen(true);
    };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === "Digit2") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) {
          if (open) {
            if (standalone) location.href = "/";
            else setOpen(false);
          } else show();
        }
        return;
      }
      if (open && e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (standalone) location.href = "/";
        else setOpen(false);
        return;
      }
      if (open && e.key !== "Tab") e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", key, true);
    window.addEventListener("uhs-open-props", show);
    return () => {
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("uhs-open-props", show);
    };
  }, [open, standalone]);
  return (
    <>
      {children}
      {open && (
        <Suspense
          fallback={
            <div role="status" data-modal="true">
              Loading prop gallery…
            </div>
          }
        >
          <PropLab onClose={close} />
        </Suspense>
      )}
    </>
  );
}
