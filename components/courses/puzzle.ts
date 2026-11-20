// Jigsaw pieces for a small grid: one piece per item, laid out left to right,
// top to bottom. Pure geometry, so it can be drawn anywhere.

export const CELL = 100;
// How far a knob sticks out past its cell, as a share of CELL
export const KNOB = 0.25;

type Pt = [number, number];

const round = (n: number) => Math.round(n * 10) / 10;

// One side of a piece, from a to b going clockwise (a is already drawn).
// bump: 1 = a knob out, -1 = a hole in, 0 = a flat outer edge. The shape is
// symmetric, so two neighbours drawing the same side the opposite way round
// fit exactly.
function side(a: Pt, b: Pt, bump: number): string {
  if (!bump) return `L${b[0]} ${b[1]}`;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  // Clockwise with y down, (dy, -dx) points out of the piece
  const p = (u: number, v: number) => `${round(a[0] + u * dx + v * bump * dy)} ${round(a[1] + u * dy - v * bump * dx)}`;
  return [
    `L${p(0.35, 0)}`,
    `C${p(0.4, 0)} ${p(0.42, 0.03)} ${p(0.4, 0.08)}`,
    `C${p(0.34, 0.14)} ${p(0.36, KNOB)} ${p(0.5, KNOB)}`,
    `C${p(0.64, KNOB)} ${p(0.66, 0.14)} ${p(0.6, 0.08)}`,
    `C${p(0.58, 0.03)} ${p(0.6, 0)} ${p(0.65, 0)}`,
    `L${p(1, 0)}`,
  ].join(' ');
}

export function puzzleGrid(count: number) {
  const cols = count <= 2 ? Math.max(count, 1) : count <= 4 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(count / cols));
  const has = (r: number, c: number) => r >= 0 && c >= 0 && c < cols && r * cols + c < count;
  // Which way the knob between two neighbours points, alternating like a
  // checkerboard so the pieces differ
  const below = (r: number, c: number) => ((r + c) % 2 ? -1 : 1);
  const right = (r: number, c: number) => ((r + c) % 2 ? 1 : -1);

  const pieces = Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = c * CELL;
    const y = r * CELL;
    const tl: Pt = [x, y];
    const tr: Pt = [x + CELL, y];
    const br: Pt = [x + CELL, y + CELL];
    const bl: Pt = [x, y + CELL];
    const d = [
      `M${x} ${y}`,
      side(tl, tr, has(r - 1, c) ? -below(r - 1, c) : 0),
      side(tr, br, has(r, c + 1) ? right(r, c) : 0),
      side(br, bl, has(r + 1, c) ? below(r, c) : 0),
      side(bl, tl, has(r, c - 1) ? -right(r, c - 1) : 0),
      'Z',
    ].join(' ');
    return { d, cx: x + CELL / 2, cy: y + CELL / 2 };
  });

  const pad = KNOB * CELL + 4;
  return { pieces, viewBox: `${-pad} ${-pad} ${cols * CELL + 2 * pad} ${rows * CELL + 2 * pad}`, cols, rows };
}
