export class CurvePoint {
  xValue: number;
  yValue: number;
  slopeLeft: number;
  slopeRight: number;
  modeLeft: number;
  modeRight: number;

  constructor(
    xValue: number,
    yValue: number,
    slopeLeft: number,
    slopeRight: number,
    modeLeft: number,
    modeRight: number
  ) {
    this.xValue = Number(xValue) || 0;
    this.yValue = Number(yValue) || 0;
    this.slopeLeft = Number(slopeLeft) || 0;
    this.slopeRight = Number(slopeRight) || 0;
    this.modeLeft = Number(modeLeft) || 0;
    this.modeRight = Number(modeRight) || 0;
  }
}

export function setupCurvePoint(
  point: CurvePoint,
  prevPoint: CurvePoint | null,
  nextPoint: CurvePoint | null
): void {
  let delta_x2 = 0;
  let delta_y2 = 0;
  let delta_x = 0;
  let delta_y = 0;
  let slope2 = 0;
  let slope3 = 0;
  let slope = 0;

  const firstPoint = prevPoint === null;
  const lastPoint = nextPoint === null;

  if (firstPoint) {
    if (lastPoint) {
      slope3 = slope2;
    } else {
      delta_y2 = nextPoint!.yValue - point.yValue;
      delta_x2 = nextPoint!.xValue - point.xValue;
      slope = delta_x2 !== 0 ? delta_y2 / delta_x2 : 0;
    }
  } else {
    delta_y = point.yValue - prevPoint!.yValue;
    delta_x = point.xValue - prevPoint!.xValue;
    slope2 = delta_x !== 0 ? delta_y / delta_x : 0;

    if (!lastPoint) {
      const denom = nextPoint!.xValue - prevPoint!.xValue;
      slope3 = denom !== 0 ? (nextPoint!.yValue - prevPoint!.yValue) / denom : 0;
      delta_y2 = nextPoint!.yValue - point.yValue;
      delta_x2 = nextPoint!.xValue - point.xValue;
      slope = delta_x2 !== 0 ? delta_y2 / delta_x2 : 0;
    } else {
      slope3 = slope2;
    }
  }

  if (firstPoint) {
    slope3 = slope;
  }

  if (point.modeLeft === 0) {
    point.slopeLeft = slope2;
  } else if (point.modeLeft === 1) {
    point.slopeLeft = slope3;
  } else if (point.modeLeft === 3) {
    point.slopeLeft = 0.0;
  } else if (point.modeLeft === 4) {
    if (delta_y <= 0.0) {
      point.slopeLeft = delta_x === 0.0 ? -1.60305 : (1.0 / delta_x) * -1.60305;
    } else {
      point.slopeLeft = delta_x === 0.0 ? -0.0413377 : (1.0 / delta_x) * -0.0413377;
    }
  }

  if (point.modeRight === 0) {
    point.slopeRight = slope;
  } else if (point.modeRight === 1) {
    point.slopeRight = slope3;
  } else if (point.modeRight === 3) {
    point.slopeRight = point.slopeLeft;
  } else if (point.modeRight === 4) {
    if (delta_y2 <= 0.0) {
      point.slopeRight = delta_x2 === 0.0 ? 0.0413377 : (1.0 / delta_x2) * 0.0413377;
    } else {
      point.slopeRight = delta_x2 === 0.0 ? 1.60305 : (1.0 / delta_x2) * 1.60305;
    }
  }

  if (point.modeLeft === 3) {
    point.slopeLeft = point.slopeRight;
  }
}

export function setupAllCurveValues(points: CurvePoint[]): void {
  const total = points.length;
  if (total === 0) return;
  if (total === 1) {
    setupCurvePoint(points[0]!, null, null);
    return;
  }

  const lastIndex = total - 1;
  for (let i = 0; i < total; i++) {
    const prev = i > 0 ? points[i - 1]! : null;
    const next = i < lastIndex ? points[i + 1]! : null;
    setupCurvePoint(points[i]!, prev, next);
  }
}

export function sampleCurve(xValue: number, points: CurvePoint[]): number {
  const total = points.length;
  if (total === 0) return 0.0;
  if (total === 1) return points[0]!.yValue;

  const lastPoint = total - 1;

  if (xValue <= points[0]!.xValue) {
    return points[0]!.yValue;
  }
  if (xValue >= points[lastPoint]!.xValue) {
    return points[lastPoint]!.yValue;
  }

  let low = 0;
  let high = lastPoint - 1;
  let segIdx = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (points[mid]!.xValue <= xValue) {
      segIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const left_point = points[segIdx];
  const right_point = points[segIdx + 1];
  if (!left_point || !right_point) return -1.0;

  const delta_x = right_point.xValue - left_point.xValue;
  const delta_y = right_point.yValue - left_point.yValue;

  let yValue_result = xValue - left_point.xValue;
  if (delta_x !== 0.0) {
    yValue_result /= delta_x;
  }

  const yValue = Math.max(0.0, Math.min(yValue_result, 1.0));
  yValue_result = left_point.slopeRight;

  const p1 = ((yValue_result + right_point.slopeLeft) * delta_x - (delta_y + delta_y)) * yValue;
  const p2 = p1 + (-right_point.slopeLeft - (yValue_result + yValue_result)) * delta_x + delta_y * 3.0;
  return (p2 * yValue + yValue_result * delta_x) * yValue + left_point.yValue;
}

export const CURVE_PRESETS: Record<string, number[][]> = {
  linear: [
    [0.0, 1.0, -0.001, -0.001, 0, 0],
    [1000.0, 0.0, -0.001, -0.001, 0, 0],
  ],
  smooth: [
    [0.0, 1.0, 0.0, 0.0, 2, 3],
    [400.0, 0.8, -0.001, -0.001, 3, 1],
    [1500.0, 0.1, -0.0002, -0.0002, 3, 1],
    [2500.0, 0.0, 0.0, 0.0, 1, 1],
  ],
  fade_in: [
    [0.0, 0.0, 0.0, 0.0, 2, 3],
    [1.0, 1.0, 0.0, 0.0, 1, 1],
  ],
  fade_out: [
    [0.0, 1.0, 0.0, 0.0, 2, 3],
    [1.0, 0.0, 0.0, 0.0, 1, 1],
  ],
  flat: [
    [0.0, 1.0, 0.0, 0.0, 2, 3],
    [1000.0, 1.0, 0.0, 0.0, 1, 1],
  ],
};

export function roundFloat(val: number, maxDecimals = 2): number {
  if (Number.isInteger(val)) return val;
  const factor = Math.pow(10, maxDecimals);
  return Math.round(val * factor) / factor;
}

function computePchipTangents(points: number[][]): number[] {
  const n = points.length;
  const tangents = new Array(n).fill(0);
  if (n <= 1) return tangents;

  const deltas: number[] = [];
  const h: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1]![0]! - points[i]![0]!;
    const dy = points[i + 1]![1]! - points[i]![1]!;
    h.push(dx);
    deltas.push(dx !== 0 ? dy / dx : 0);
  }

  tangents[0] = 0.0;
  tangents[n - 1] = 0.0;

  for (let i = 1; i < n - 1; i++) {
    const d0 = deltas[i - 1]!;
    const d1 = deltas[i]!;
    if (d0 * d1 <= 0) {
      tangents[i] = 0.0;
    } else {
      const w1 = 2 * h[i]! + h[i - 1]!;
      const w2 = h[i]! + 2 * h[i - 1]!;
      tangents[i] = (w1 + w2) / (w1 / d0 + w2 / d1);
    }
  }

  return tangents;
}

export function generateCurveFromEndpoints(presetKey: string, currentPoints: number[][] = []): number[][] {
  let pts: number[][] = [];
  if (Array.isArray(currentPoints) && currentPoints.length > 0) {
    pts = currentPoints
      .map((p) => [
        Number(p[0]) || 0,
        Number(p[1]) || 0,
        Number(p[2]) || 0,
        Number(p[3]) || 0,
        Number(p[4]) || 0,
        Number(p[5]) || 0,
      ])
      .sort((a, b) => a[0]! - b[0]!);
  }

  if (pts.length === 0) {
    pts = [
      [0.0, 1.0, -0.001, -0.001, 0, 0],
      [1000.0, 0.0, -0.001, -0.001, 0, 0],
    ];
  } else if (pts.length === 1) {
    const x0 = pts[0]![0]!;
    const span = x0 >= 10 ? 1000.0 : 1.0;
    pts = [
      [x0, pts[0]![1]!, -0.001, -0.001, 0, 0],
      [x0 + span, 0.0, -0.001, -0.001, 0, 0],
    ];
  }

  const n = pts.length;
  const x0 = pts[0]![0]!;
  const xEnd = pts[n - 1]![0]!;
  const spanX = xEnd > x0 ? xEnd - x0 : x0 >= 10 ? 1000.0 : 1.0;

  switch (presetKey) {
    case 'linear': {
      const secants: number[] = [];
      for (let i = 0; i < n - 1; i++) {
        const dx = pts[i + 1]![0]! - pts[i]![0]!;
        const dy = pts[i + 1]![1]! - pts[i]![1]!;
        secants.push(dx !== 0 ? dy / dx : 0);
      }

      return pts.map((p, i) => {
        let slopeLeft = 0;
        let slopeRight = 0;
        if (i === 0) {
          slopeLeft = secants[0] ?? 0;
          slopeRight = secants[0] ?? 0;
        } else if (i === n - 1) {
          slopeLeft = secants[n - 2] ?? 0;
          slopeRight = secants[n - 2] ?? 0;
        } else {
          slopeLeft = secants[i - 1] ?? 0;
          slopeRight = secants[i] ?? 0;
        }
        return [roundFloat(p[0]!, 2), roundFloat(p[1]!, 2), slopeLeft, slopeRight, 0, 0];
      });
    }

    case 'smooth': {
      if (n === 2) {
        let startY = pts[0]![1]!;
        let endY = pts[1]![1]!;
        if (startY === endY) {
          startY = startY > 0 ? startY : 1.0;
          endY = 0.0;
        }
        const dy = endY - startY;

        if (dy < 0) {
          const slopeMid1 = (dy / spanX) * 1.25;
          const slopeMid2 = (dy / spanX) * 0.35;
          return [
            [roundFloat(x0, 2), roundFloat(startY, 2), 0.0, 0.0, 2, 3],
            [roundFloat(x0 + spanX * 0.16, 2), roundFloat(startY + dy * 0.2, 2), slopeMid1, slopeMid1, 3, 1],
            [roundFloat(x0 + spanX * 0.6, 2), roundFloat(startY + dy * 0.9, 2), slopeMid2, slopeMid2, 3, 1],
            [roundFloat(xEnd, 2), roundFloat(endY, 2), 0.0, 0.0, 1, 1],
          ];
        } else {
          const slopeMid = (dy / spanX) * 1.5;
          return [
            [roundFloat(x0, 2), roundFloat(startY, 2), 0.0, 0.0, 2, 3],
            [roundFloat(x0 + spanX * 0.35, 2), roundFloat(startY + dy * 0.18, 2), slopeMid, slopeMid, 3, 1],
            [roundFloat(x0 + spanX * 0.65, 2), roundFloat(startY + dy * 0.82, 2), slopeMid, slopeMid, 3, 1],
            [roundFloat(xEnd, 2), roundFloat(endY, 2), 0.0, 0.0, 1, 1],
          ];
        }
      }

      const tangents = computePchipTangents(pts);
      return pts.map((p, i) => {
        const s = tangents[i] ?? 0;
        let mLeft = 1;
        let mRight = 1;
        if (i === 0) {
          mLeft = 2;
          mRight = 3;
        } else if (i === n - 1) {
          mLeft = 1;
          mRight = 1;
        } else if (s === 0) {
          mLeft = 3;
          mRight = 3;
        }
        return [roundFloat(p[0]!, 2), roundFloat(p[1]!, 2), s, s, mLeft, mRight];
      });
    }

    case 'fade_in': {
      if (n === 2) {
        return [
          [roundFloat(x0, 2), 0.0, 0.0, 0.0, 2, 3],
          [roundFloat(xEnd, 2), 1.0, 0.0, 0.0, 1, 1],
        ];
      }

      return pts.map((p, i) => {
        if (i === 0) return [roundFloat(x0, 2), 0.0, 0.0, 0.0, 2, 3];
        if (i === n - 1) return [roundFloat(xEnd, 2), 1.0, 0.0, 0.0, 1, 1];

        const t = (p[0]! - x0) / spanX;
        const yVal = roundFloat(3 * t * t - 2 * t * t * t, 2);
        const slope = (6 * t * (1 - t)) / spanX;
        return [roundFloat(p[0]!, 2), yVal, slope, slope, 1, 1];
      });
    }

    case 'fade_out': {
      if (n === 2) {
        return [
          [roundFloat(x0, 2), 1.0, 0.0, 0.0, 2, 3],
          [roundFloat(xEnd, 2), 0.0, 0.0, 0.0, 1, 1],
        ];
      }

      return pts.map((p, i) => {
        if (i === 0) return [roundFloat(x0, 2), 1.0, 0.0, 0.0, 2, 3];
        if (i === n - 1) return [roundFloat(xEnd, 2), 0.0, 0.0, 0.0, 1, 1];

        const t = (p[0]! - x0) / spanX;
        const yVal = roundFloat(1.0 - (3 * t * t - 2 * t * t * t), 2);
        const slope = (-6 * t * (1 - t)) / spanX;
        return [roundFloat(p[0]!, 2), yVal, slope, slope, 1, 1];
      });
    }

    case 'flat': {
      return pts.map((p, i) => {
        const mLeft = i === 0 ? 2 : 1;
        const mRight = i === 0 ? 3 : 1;
        return [roundFloat(p[0]!, 2), 1.0, 0.0, 0.0, mLeft, mRight];
      });
    }

    default:
      return currentPoints;
  }
}
