import { useEffect, useState } from "react";
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
  return phone;
}
