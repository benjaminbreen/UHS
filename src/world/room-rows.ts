type Sized = { wide: number; deep?: number; hold?: "s" };
export type RoomRow<T extends Sized> = { deep: number; slots: (T | { stack: T[]; wide: number } | { gap: number })[] };

/** From the entrance back, centre each range on the same axis. */
export function setOutRows<T extends Sized>(rows: RoomRow<T>[], centre: number, place: (room: T, x: number, y: number, w: number, d: number) => void) {
  const width = (s: RoomRow<T>["slots"][number]) => "gap" in s ? s.gap : s.wide;
  let y = rows.reduce((n, r) => n + r.deep, 0);
  for (const row of rows) {
    y -= row.deep;
    let x = centre - Math.round(row.slots.reduce((n, s) => n + width(s), 0) / 2);
    for (const s of row.slots) {
      if ("stack" in s) {
        let sy = y;
        for (const room of s.stack) {
          const deep = room.deep ?? row.deep;
          place(room, x, sy, s.wide, deep);
          sy += deep;
        }
      } else if (!("gap" in s)) {
        const deep = s.deep ?? row.deep;
        place(s, x, s.hold === "s" ? y + row.deep - deep : y, s.wide, deep);
      }
      x += width(s);
    }
  }
}
