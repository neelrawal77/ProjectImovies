import { formatINR } from '../utils/format.js';

/**
 * Seat picker. `seats` come from GET /api/shows/:id (each has id,row,number,section,price,booked).
 * Rows are drawn under a curved screen; section price headings appear where the section changes.
 */
export default function SeatMap({ seats, selected, onToggle, max }) {
  const rows = [];
  for (const seat of seats) {
    let row = rows[rows.length - 1];
    if (!row || row.label !== seat.row) {
      row = { label: seat.row, section: seat.section, price: seat.price, seats: [] };
      rows.push(row);
    }
    row.seats.push(seat);
  }

  let lastSection = null;
  return (
    <div className="im-seatmap">
      <div className="im-screen" aria-hidden="true"><span>Screen this way</span></div>
      <div className="im-rows">
        {rows.map((row) => {
          const heading = row.section !== lastSection;
          lastSection = row.section;
          return (
            <div key={row.label}>
              {heading && <p className="im-section-label">{row.section} · {formatINR(row.price)}</p>}
              <div className="im-seat-row" role="group" aria-label={`Row ${row.label}`}>
                <span className="im-row-label" aria-hidden="true">{row.label}</span>
                {row.seats.map((s) => {
                  const isSel = selected.includes(s.id);
                  const blocked = !isSel && selected.length >= max;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`im-seat ${s.booked ? 'booked' : ''} ${isSel ? 'selected' : ''}`}
                      disabled={s.booked || blocked}
                      aria-pressed={isSel}
                      aria-label={`Seat ${s.id}, ${s.section}, ${formatINR(s.price)}${s.booked ? ', already booked' : ''}`}
                      onClick={() => onToggle(s.id)}
                    >
                      {s.number}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ul className="im-legend">
        <li><span className="im-seat sample" /> Available</li>
        <li><span className="im-seat sample selected" /> Your pick</li>
        <li><span className="im-seat sample booked" /> Booked</li>
      </ul>
    </div>
  );
}
