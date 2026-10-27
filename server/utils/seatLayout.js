// Seat ids look like "A1", "B12". Rows are lettered A.. across sections, top to bottom.
export const MAX_ROWS = 26;
export const rowLabel = (i) => String.fromCharCode(65 + i);

export function buildSeats(sections) {
  const seats = [];
  let r = 0;
  for (const s of sections) {
    for (let i = 0; i < s.rows; i += 1, r += 1) {
      const row = rowLabel(r);
      for (let n = 1; n <= s.seatsPerRow; n += 1) {
        seats.push({ id: `${row}${n}`, row, number: n, section: s.name, price: s.price });
      }
    }
  }
  return seats;
}

export const countSeats = (sections) => sections.reduce((t, s) => t + s.rows * s.seatsPerRow, 0);

/** Server-side pricing: returns the priced seats, the total and any unknown ids. */
export function priceSeats(sections, seatIds) {
  const byId = new Map(buildSeats(sections).map((s) => [s.id, s]));
  const seats = [];
  const invalid = [];
  for (const id of seatIds) {
    const seat = byId.get(id);
    if (seat) seats.push({ seatId: seat.id, section: seat.section, price: seat.price });
    else invalid.push(id);
  }
  const total = seats.reduce((t, s) => t + s.price, 0);
  return { seats, total, invalid };
}
