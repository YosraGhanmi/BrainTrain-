// The road on the Courses page, in a 400 x 60 box stretched to the width: it
// starts level at mid-height, winds through one stop per column (the stops
// alternating high and low), then ends level again. Shared by the road
// drawing and the little walker, so he follows exactly the same curve.
export const ROAD_BOX = { width: 400, height: 60, mid: 30 };
const ROAD_TOP = 15;
const ROAD_LOW = 45;

function roadPoints(count: number): number[][] {
  const ys = Array.from({ length: count }, (_, i) => (i % 2 === 0 ? ROAD_TOP : ROAD_LOW));
  return [[0, ROAD_BOX.mid], ...ys.map((y, i) => [((i + 0.5) / count) * ROAD_BOX.width, y]), [ROAD_BOX.width, ROAD_BOX.mid]];
}

// Each stretch between two points is a curve whose handles sit halfway
// across, level with each end: it leaves and arrives horizontally.
export function roadPath(count: number): { d: string; ys: number[] } {
  const points = roadPoints(count);
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const xm = (x0 + x1) / 2;
    d += ` C${xm} ${y0} ${xm} ${y1} ${x1} ${y1}`;
  }
  return { d, ys: points.slice(1, -1).map((p) => p[1]) };
}

// The road's height at each x, as a list of [x, y] samples (box units)
export function roadSamples(count: number, perStretch = 40): [number, number][] {
  const points = roadPoints(count);
  const samples: [number, number][] = [];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const xm = (x0 + x1) / 2;
    for (let s = i === 1 ? 0 : 1; s <= perStretch; s++) {
      const t = s / perStretch;
      const u = 1 - t;
      // Cubic Bezier through (x0,y0), (xm,y0), (xm,y1), (x1,y1)
      const x = u * u * u * x0 + 3 * u * u * t * xm + 3 * u * t * t * xm + t * t * t * x1;
      const y = u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t * t * t * y1;
      samples.push([x, y]);
    }
  }
  return samples;
}
