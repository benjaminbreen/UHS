import { useEffect, useLayoutEffect, useState } from "react";
import { PHONE_QUERY } from "../runtime/device";

export { PHONE_QUERY };

/** Whether the phone layout is on. Used where the two layouts want different
 * markup, not merely different CSS — a second Minimap costs a rebuild per
 * move, so only one of them is ever mounted. */
export function usePhoneLayout() {
  const [phone, setPhone] = useState(
    () => window.matchMedia?.(PHONE_QUERY).matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia?.(PHONE_QUERY);
    if (!mq) return;
    const sync = () => setPhone(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useLayoutEffect(() => {
    if (!phone) return;
    const viewport = window.visualViewport;
    const sync = () => {
      const root = document.documentElement;
      root.style.setProperty("--viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      root.style.setProperty("--viewport-top", `${viewport?.offsetTop ?? 0}px`);
    };
    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.documentElement.style.removeProperty("--viewport-height");
      document.documentElement.style.removeProperty("--viewport-top");
    };
  }, [phone]);
  return phone;
}
