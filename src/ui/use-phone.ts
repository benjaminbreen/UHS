import { useEffect, useState } from "react";

/** The same screens the touch controls and the phone stylesheet claim. */
export const PHONE_QUERY =
  "(max-width: 640px), (pointer: coarse) and (max-width: 1024px)";

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
  return phone;
}
