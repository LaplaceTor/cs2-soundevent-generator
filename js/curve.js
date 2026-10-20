/**
 * CS2 Curve Math & Interactive Canvas Editor
 * Ported directly from Hammer5Tools/Hammer5ToolsGUI/gui/editors/soundevent_editor/property/curve/algorithm.py
 */

export class CurvePoint {
  constructor(xValue, yValue, slopeLeft, slopeRight, modeLeft, modeRight) {
    this.xValue = Number(xValue) || 0;
    this.yValue = Number(yValue) || 0;
    this.slopeLeft = Number(slopeLeft) || 0;
    this.slopeRight = Number(slopeRight) || 0;
    this.modeLeft = Number(modeLeft) || 0;
    this.modeRight = Number(modeRight) || 0;
  }
}

/**
 * Initializes an evaluation copy without changing the source curve.
 * 1:1 translation of _setup_curve_point in algorithm.py
 */
export function setupCurvePoint(point, prevPoint, nextPoint) {
  let delta_x2 = 0;
  let delta_y2 = 0;
  let delta_x = 0;
  let delta_y = 0;
  let slope2 = 0;
  let slope3 = 0;
  let slope = 0;

  const firstPoint = prevPoint === null || prevPoint === undefined;
  const lastPoint = nextPoint === null || nextPoint === undefined;

  if (firstPoint) {
    if (lastPoint) {
      slope3 = slope2;
    } else {
      delta_y2 = nextPoint.yValue - point.yValue;
      delta_x2 = nextPoint.xValue - point.xValue;
      slope = delta_x2 !== 0 ? delta_y2 / delta_x2 : 0;
    }
  } else {
    delta_y = point.yValue - prevPoint.yValue;
    delta_x = point.xValue - prevPoint.xValue;
    slope2 = delta_x !== 0 ? delta_y / delta_x : 0;

    if (!lastPoint) {
      const denom = nextPoint.xValue - prevPoint.xValue;
      slope3 = denom !== 0 ? (nextPoint.yValue - prevPoint.yValue) / denom : 0;
      delta_y2 = nextPoint.yValue - point.yValue;
      delta_x2 = nextPoint.xValue - point.xValue;
      slope = delta_x2 !== 0 ? delta_y2 / delta_x2 : 0;
    } else {
      slope3 = slope2;
    }
  }

  if (firstPoint) {
    slope3 = slope;
  }

  // Modes choose the left and right tangent interpolation.
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

/**
 * Setup all points in the curve before calling sampleCurve.
 */
export function setupAllCurveValues(points) {
  const totalPoints = points.length;
  if (totalPoints === 0) return;
  if (totalPoints === 1) {
    setupCurvePoint(points[0], null, null);
    return;
  }

  const lastIndex = totalPoints - 1;
  for (let i = 0; i < totalPoints; i++) {
    const prevPoint = i > 0 ? points[i - 1] : null;
    const nextPoint = i < lastIndex ? points[i + 1] : null;
    setupCurvePoint(points[i], prevPoint, nextPoint);
  }
}

/**
 * Samples curve at xValue using CS2 Bezier/Hermite interpolation math.
 */
export function sampleCurve(xValue, points) {
  const total_points = points.length;
  if (!points || total_points <= 1) return -1.0;

  const last_point = total_points - 1;
  let u_var2 = 1;
  let u_var1 = 1;
  let u_var3 = last_point;
  let cur_point = 1;

  if (last_point !== 0) {
    let broke = false;
    while (u_var2 <= u_var3) {
      cur_point = (u_var3 + u_var2) >> 1;
      if (xValue <= points[cur_point].xValue) {
        if (points[cur_point].xValue <= xValue) {
          broke = true;
          break;
        }
        u_var3 = cur_point - 1;
      } else {
        u_var2 = cur_point + 1;
      }
      u_var1 = cur_point;
    }
    if (!broke) {
      cur_point = u_var1;
    }

    if (points[u_var1].xValue <= xValue) {
      cur_point = u_var1 + 1;
      if (last_point <= u_var1) {
        cur_point = u_var1;
      }
    }
  }

  const left_point = points[cur_point - 1];
  const right_point = points[cur_point];
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
  const calc_yValue = (p2 * yValue + yValue_result * delta_x) * yValue + left_point.yValue;

  return calc_yValue;
}

/**
 * Standard curve preset templates
 */
export const CURVE_PRESETS = {
  linear: [
    [0.0, 1.0, -0.001, -0.001, 0, 0],
    [1000.0, 0.0, -0.001, -0.001, 0, 0]
  ],
  smooth: [
    [0.0, 1.0, 0.0, 0.0, 2, 3],
    [400.0, 0.8, -0.001, -0.001, 3, 1],
    [1500.0, 0.1, -0.0002, -0.0002, 3, 1],
    [2500.0, 0.0, 0.0, 0.0, 1, 1]
  ],
  fade_in: [
    [0.0, 0.0, 0.0, 0.0, 2, 3],
    [1.0, 1.0, 0.0, 0.0, 1, 1]
  ],
  fade_out: [
    [0.0, 1.0, 0.0, 0.0, 2, 3],
    [1.0, 0.0, 0.0, 0.0, 1, 1]
  ],
  flat: [
    [0.0, 1.0, 0.0, 0.0, 2, 3],
    [1000.0, 1.0, 0.0, 0.0, 1, 1]
  ]
};

/**
 * Clean floating point numbers to avoid IEEE precision artifacts
 */
function roundFloat(val, maxDecimals = 3) {
  if (val === undefined || val === null || isNaN(val)) return 0;
  if (Number.isInteger(val)) return val;
  const factor = Math.pow(10, maxDecimals);
  return Math.round(val * factor) / factor;
}

/**
 * Compute optimal smooth tangents across arbitrary control points
 * using Fritsch-Carlson Monotone Cubic Hermite Spline (PCHIP).
 * Guarantees zero overshoot/ringing while creating a natural, optimal C1 curve.
 */
function computePchipTangents(points) {
  const n = points.length;
  const tangents = new Array(n).fill(0);
  if (n <= 1) return tangents;

  // 1. Calculate secants between adjacent points
  const deltas = [];
  const h = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dy = points[i + 1][1] - points[i][1];
    h.push(dx);
    deltas.push(dx !== 0 ? dy / dx : 0);
  }

  // 2. Boundary tangents: horizontal (0) for natural smooth start and landing
  tangents[0] = 0.0;
  tangents[n - 1] = 0.0;

  // 3. Interior tangents: weighted harmonic mean of adjacent secants
  for (let i = 1; i < n - 1; i++) {
    const d0 = deltas[i - 1];
    const d1 = deltas[i];
    if (d0 * d1 <= 0) {
      // Local extremum (peak/valley) or flat segment: horizontal tangent
      tangents[i] = 0.0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      tangents[i] = (w1 + w2) / (w1 / d0 + w2 / d1);
    }
  }

  return tangents;
}

/**
 * Generate curve points dynamically based on all provided control points.
 * - linear: preserves all points, connects every consecutive pair linearly
 * - smooth:
 *     - If 2 points: generates optimal 4-point S-curve
 *     - If >= 3 points: calculates optimal smooth Hermite tangents across ALL points
 * - fade_in: smooth fade-in curve from 0 to 1 across all points
 * - fade_out: smooth fade-out curve from 1 to 0 across all points
 * - flat: sets Y=1.0 across all points
 *
 * @param {string} presetKey - "linear" | "smooth" | "fade_in" | "fade_out" | "flat"
 * @param {Array<Array<number>>} currentPoints - existing curve control points
 * @returns {Array<Array<number>>}
 */
export function generateCurveFromEndpoints(presetKey, currentPoints = []) {
  // Normalize, clone, and ensure sorted by X
  let pts = [];
  if (Array.isArray(currentPoints) && currentPoints.length > 0) {
    pts = currentPoints
      .map(p => [
        Number(p[0]) || 0,
        Number(p[1]) || 0,
        Number(p[2]) || 0,
        Number(p[3]) || 0,
        Number(p[4]) || 0,
        Number(p[5]) || 0
      ])
      .sort((a, b) => a[0] - b[0]);
  }

  // Fallbacks if insufficient points
  if (pts.length === 0) {
    pts = [
      [0.0, 1.0, -0.001, -0.001, 0, 0],
      [1000.0, 0.0, -0.001, -0.001, 0, 0]
    ];
  } else if (pts.length === 1) {
    const x0 = pts[0][0];
    const span = x0 >= 10 ? 1000.0 : 1.0;
    pts = [
      [x0, pts[0][1], -0.001, -0.001, 0, 0],
      [x0 + span, 0.0, -0.001, -0.001, 0, 0]
    ];
  }

  const n = pts.length;
  const x0 = pts[0][0];
  const xEnd = pts[n - 1][0];
  const spanX = xEnd > x0 ? xEnd - x0 : (x0 >= 10 ? 1000.0 : 1.0);

  switch (presetKey) {
    case "linear": {
      // Connect each consecutive pair of points strictly linearly
      // For each segment i, slope = (y_{i+1} - y_i) / (x_{i+1} - x_i)
      const secants = [];
      for (let i = 0; i < n - 1; i++) {
        const dx = pts[i + 1][0] - pts[i][0];
        const dy = pts[i + 1][1] - pts[i][1];
        secants.push(dx !== 0 ? Number((dy / dx).toFixed(6)) : 0);
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
        return [
          roundFloat(p[0]),
          roundFloat(p[1]),
          slopeLeft,
          slopeRight,
          0, // modeLeft: linear in CS2
          0  // modeRight: linear in CS2
        ];
      });
    }

    case "smooth": {
      // Smooth curve preset:
      // If user only has 2 points, generate optimal 4-point S-curve
      // If user has >= 3 points, keep ALL points and compute optimal smooth tangents
      if (n === 2) {
        let startY = pts[0][1];
        let endY = pts[1][1];
        if (startY === endY) {
          startY = startY > 0 ? startY : 1.0;
          endY = 0.0;
        }
        const dy = endY - startY;

        if (dy < 0) {
          // Acoustic falloff profile (high nearby, steep drop mid-distance, gradual tail)
          const slopeMid1 = Number(((dy / spanX) * 1.25).toFixed(6));
          const slopeMid2 = Number(((dy / spanX) * 0.35).toFixed(6));
          return [
            [roundFloat(x0), roundFloat(startY), 0.0, 0.0, 2, 3],
            [roundFloat(x0 + spanX * 0.16), roundFloat(startY + dy * 0.20), slopeMid1, slopeMid1, 3, 1],
            [roundFloat(x0 + spanX * 0.60), roundFloat(startY + dy * 0.90), slopeMid2, slopeMid2, 3, 1],
            [roundFloat(xEnd), roundFloat(endY), 0.0, 0.0, 1, 1]
          ];
        } else {
          // Ascending ease-in-out S-curve
          const slopeMid = Number(((dy / spanX) * 1.5).toFixed(6));
          return [
            [roundFloat(x0), roundFloat(startY), 0.0, 0.0, 2, 3],
            [roundFloat(x0 + spanX * 0.35), roundFloat(startY + dy * 0.18), slopeMid, slopeMid, 3, 1],
            [roundFloat(x0 + spanX * 0.65), roundFloat(startY + dy * 0.82), slopeMid, slopeMid, 3, 1],
            [roundFloat(xEnd), roundFloat(endY), 0.0, 0.0, 1, 1]
          ];
        }
      }

      // n >= 3: Calculate optimal smooth tangents across ALL points with zero overshoot
      const tangents = computePchipTangents(pts);
      return pts.map((p, i) => {
        const s = roundFloat(tangents[i], 6);
        let mLeft = 1; // spline
        let mRight = 1;
        if (i === 0) {
          mLeft = 2;
          mRight = 3; // horizontal start
        } else if (i === n - 1) {
          mLeft = 1;
          mRight = 1; // horizontal landing
        } else if (s === 0) {
          mLeft = 3;
          mRight = 3;
        }
        return [
          roundFloat(p[0]),
          roundFloat(p[1]),
          s,
          s,
          mLeft,
          mRight
        ];
      });
    }

    case "fade_in": {
      // Smooth fade-in (0.0 -> 1.0)
      if (n === 2) {
        return [
          [roundFloat(x0), 0.0, 0.0, 0.0, 2, 3],
          [roundFloat(xEnd), 1.0, 0.0, 0.0, 1, 1]
        ];
      }

      return pts.map((p, i) => {
        if (i === 0) return [roundFloat(x0), 0.0, 0.0, 0.0, 2, 3];
        if (i === n - 1) return [roundFloat(xEnd), 1.0, 0.0, 0.0, 1, 1];

        const t = (p[0] - x0) / spanX;
        const yVal = roundFloat(3 * t * t - 2 * t * t * t);
        const slope = Number((6 * t * (1 - t) / spanX).toFixed(6));
        return [
          roundFloat(p[0]),
          yVal,
          slope,
          slope,
          1,
          1
        ];
      });
    }

    case "fade_out": {
      // Smooth fade-out (1.0 -> 0.0)
      if (n === 2) {
        return [
          [roundFloat(x0), 1.0, 0.0, 0.0, 2, 3],
          [roundFloat(xEnd), 0.0, 0.0, 0.0, 1, 1]
        ];
      }

      return pts.map((p, i) => {
        if (i === 0) return [roundFloat(x0), 1.0, 0.0, 0.0, 2, 3];
        if (i === n - 1) return [roundFloat(xEnd), 0.0, 0.0, 0.0, 1, 1];

        const t = (p[0] - x0) / spanX;
        const yVal = roundFloat(1.0 - (3 * t * t - 2 * t * t * t));
        const slope = Number((-6 * t * (1 - t) / spanX).toFixed(6));
        return [
          roundFloat(p[0]),
          yVal,
          slope,
          slope,
          1,
          1
        ];
      });
    }

    case "flat": {
      // Constant 1.0 across all points
      return pts.map((p, i) => {
        const mLeft = i === 0 ? 2 : 1;
        const mRight = i === 0 ? 3 : 1;
        return [
          roundFloat(p[0]),
          1.0,
          0.0,
          0.0,
          mLeft,
          mRight
        ];
      });
    }

    default:
      return currentPoints;
  }
}

/**
 * Render Curve onto HTML5 Canvas with HiDPI / scaling support
 */
export function drawCurveCanvas(canvas, rawPoints, options = {}) {
  if (!canvas || typeof canvas.getContext !== "function") return null;
  const ctx = canvas.getContext("2d");

  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height) || 144;

  if (width <= 0) return null;

  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const FONT_CANVAS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', sans-serif";

  if (!rawPoints || rawPoints.length < 2) {
    ctx.fillStyle = "#888";
    ctx.font = `12px ${FONT_CANVAS}`;
    ctx.fillText("需要至少 2 个控制点 (Need at least 2 points)", 20, 30);
    ctx.restore();
    return null;
  }

  const points = rawPoints.map(p => new CurvePoint(p[0], p[1], p[2], p[3], p[4], p[5]))
    .sort((a, b) => a.xValue - b.xValue);

  setupAllCurveValues(points);

  const minX = Math.min(0, points[0].xValue);
  const maxX = Math.max(points[points.length - 1].xValue, minX + 1.0);
  const minY = Math.min(0, ...points.map(p => p.yValue));
  const maxY = Math.max(1.0, ...points.map(p => p.yValue));

  const padL = 40;
  const padR = 20;
  const padT = 16;
  const padB = 24;

  const plotW = Math.max(10, width - padL - padR);
  const plotH = Math.max(10, height - padT - padB);

  const toScreenX = (x) => padL + ((x - minX) / (maxX - minX)) * plotW;
  const toScreenY = (y) => padT + (1 - (y - minY) / (maxY - minY)) * plotH;
  const toDataX = (sx) => minX + ((sx - padL) / plotW) * (maxX - minX);
  const toDataY = (sy) => minY + (1 - ((sy - padT) / plotH)) * (maxY - minY);

  // Background grid
  ctx.strokeStyle = "rgba(128, 128, 128, 0.18)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const yVal = minY + (i / 4) * (maxY - minY);
    const sy = toScreenY(yVal);
    ctx.beginPath();
    ctx.moveTo(padL, sy);
    ctx.lineTo(width - padR, sy);
    ctx.stroke();

    ctx.fillStyle = "rgba(156, 163, 175, 0.9)";
    ctx.font = `9px ${FONT_CANVAS}`;
    ctx.textAlign = "right";
    ctx.fillText(yVal.toFixed(1), padL - 6, sy + 3);
  }

  for (let i = 0; i <= 4; i++) {
    const xVal = minX + (i / 4) * (maxX - minX);
    const sx = toScreenX(xVal);
    ctx.beginPath();
    ctx.moveTo(sx, padT);
    ctx.lineTo(sx, height - padB);
    ctx.stroke();

    ctx.fillStyle = "rgba(156, 163, 175, 0.9)";
    ctx.font = `9px ${FONT_CANVAS}`;
    ctx.textAlign = "center";

    // Adaptive format for X grid label
    const span = maxX - minX;
    let label = "";
    if (span <= 1.5) {
      label = xVal.toFixed(2);
    } else if (span <= 10) {
      label = xVal.toFixed(1);
    } else if (span <= 50) {
      label = Number(xVal.toFixed(1)).toString();
    } else {
      label = Math.round(xVal).toString();
    }
    ctx.fillText(label, sx, height - 8);
  }

  // Draw curve line
  ctx.strokeStyle = "#3B82F6";
  ctx.lineWidth = 2.2;
  ctx.beginPath();

  const steps = 150;
  for (let i = 0; i <= steps; i++) {
    const xVal = minX + (i / steps) * (maxX - minX);
    const yVal = sampleCurve(xVal, points);
    const sx = toScreenX(xVal);
    const sy = toScreenY(yVal);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Draw control points
  const activeIdx = options.activeIdx ?? -1;
  const hoverIdx = options.hoverIdx ?? -1;

  points.forEach((p, idx) => {
    const sx = toScreenX(p.xValue);
    const sy = toScreenY(p.yValue);
    const isActive = (idx === activeIdx);
    const isHover = (idx === hoverIdx);

    // Halo ring if active
    if (isActive) {
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(sx, sy, isActive ? 7.5 : (isHover ? 6.5 : 5), 0, Math.PI * 2);
    ctx.fillStyle = isActive ? "#2563EB" : (isHover ? "#93C5FD" : "#FFFFFF");
    ctx.fill();
    ctx.lineWidth = isActive ? 2.5 : 2;
    ctx.strokeStyle = isActive ? "#1D4ED8" : "#2563EB";
    ctx.stroke();

    // Tooltip coordinate pill
    if (isActive || isHover) {
      const span = maxX - minX;
      let xDisplay = "";
      if (span <= 1.5) {
        xDisplay = p.xValue.toFixed(3).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
      } else if (span <= 10) {
        xDisplay = p.xValue.toFixed(2).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
      } else if (span <= 50) {
        xDisplay = p.xValue.toFixed(1).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
      } else {
        xDisplay = Math.round(p.xValue).toString();
      }
      const tipText = `(${xDisplay}, ${p.yValue.toFixed(2)})`;
      ctx.font = `10px ${FONT_CANVAS}`;
      const textW = ctx.measureText(tipText).width;
      const tipX = Math.max(padL, Math.min(width - padR - textW - 8, sx - textW / 2 - 4));
      const tipY = Math.max(16, sy - 14);

      ctx.fillStyle = "rgba(17, 24, 39, 0.88)";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(tipX, tipY - 11, textW + 8, 14, 2);
      } else {
        ctx.rect(tipX, tipY - 11, textW + 8, 14);
      }
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(tipText, tipX + 4, tipY);
    }
  });

  ctx.restore();

  return { toScreenX, toScreenY, toDataX, toDataY, padL, padR, padT, padB, plotW, plotH, minX, maxX, minY, maxY };
}

/**
 * Attaches drag, hover, double-click and auto-resize observer to curve canvas
 */
export function attachInteractiveCurve(canvas, { getPoints, onPointsChange, onLiveUpdate }) {
  let activeIdx = -1;
  let hoverIdx = -1;
  let currentTransformers = null;

  function redraw() {
    const pts = getPoints ? getPoints() : [];
    currentTransformers = drawCurveCanvas(canvas, pts, { activeIdx, hoverIdx });
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function onPointerDown(e) {
    if (!currentTransformers) redraw();
    if (!currentTransformers) return;
    const { toScreenX, toScreenY } = currentTransformers;
    const pos = getMousePos(e);
    const pts = getPoints ? getPoints() : [];

    let hit = -1;
    let minDist = 18;
    pts.forEach((p, idx) => {
      const sx = toScreenX(p[0]);
      const sy = toScreenY(p[1]);
      const dist = Math.hypot(sx - pos.x, sy - pos.y);
      if (dist < minDist) {
        minDist = dist;
        hit = idx;
      }
    });

    if (hit !== -1) {
      activeIdx = hit;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
      redraw();
    }
  }

  function onPointerMove(e) {
    if (!currentTransformers) return;
    const pos = getMousePos(e);
    const pts = getPoints ? getPoints() : [];

    if (activeIdx !== -1) {
      const { toDataX, toDataY } = currentTransformers;
      let newX = toDataX(pos.x);
      let newY = toDataY(pos.y);

      // Adaptive X rounding based on curve span to support fractional seconds
      const minPtX = pts[0]?.[0] || 0;
      const maxPtX = pts[pts.length - 1]?.[0] || 1;
      const span = Math.max(0.1, maxPtX - minPtX);

      if (span <= 1.5) {
        newX = Math.round(newX * 100) / 100; // 0.01 step for 0-1 range
      } else if (span <= 10) {
        newX = Math.round(newX * 20) / 20;   // 0.05 step
      } else if (span <= 50) {
        newX = Math.round(newX * 10) / 10;   // 0.1 step
      } else {
        newX = Math.round(newX);             // 1.0 step for large distance
      }

      newX = Math.max(0, newX);
      newY = Math.max(0, Math.min(2.0, Math.round(newY * 100) / 100));

      pts[activeIdx][0] = newX;
      pts[activeIdx][1] = newY;

      redraw();
      if (onLiveUpdate) onLiveUpdate(pts, activeIdx);
    } else {
      const { toScreenX, toScreenY } = currentTransformers;
      let hit = -1;
      let minDist = 18;
      pts.forEach((p, idx) => {
        const sx = toScreenX(p[0]);
        const sy = toScreenY(p[1]);
        const dist = Math.hypot(sx - pos.x, sy - pos.y);
        if (dist < minDist) {
          minDist = dist;
          hit = idx;
        }
      });

      if (hit !== hoverIdx) {
        hoverIdx = hit;
        canvas.style.cursor = hoverIdx !== -1 ? "grab" : "crosshair";
        redraw();
      }
    }
  }

  function onPointerUp(e) {
    if (activeIdx !== -1) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
      activeIdx = -1;
      const pts = getPoints ? getPoints() : [];
      pts.sort((a, b) => a[0] - b[0]);
      redraw();
      if (onPointsChange) onPointsChange(pts);
    }
  }

  function onDblClick(e) {
    if (!currentTransformers) return;
    const { toDataX, toDataY } = currentTransformers;
    const pos = getMousePos(e);
    const pts = getPoints ? getPoints() : [];

    const rawX = toDataX(pos.x);
    const minPtX = pts[0]?.[0] || 0;
    const maxPtX = pts[pts.length - 1]?.[0] || 1;
    const span = Math.max(0.1, maxPtX - minPtX);

    let newX = rawX;
    if (span <= 1.5) {
      newX = Math.round(rawX * 100) / 100;
    } else if (span <= 10) {
      newX = Math.round(rawX * 20) / 20;
    } else if (span <= 50) {
      newX = Math.round(rawX * 10) / 10;
    } else {
      newX = Math.round(rawX);
    }
    newX = Math.max(0, newX);

    const newY = Math.max(0, Math.min(2.0, Math.round(toDataY(pos.y) * 100) / 100));

    pts.push([newX, newY, 0, 0, 2, 3]);
    pts.sort((a, b) => a[0] - b[0]);
    redraw();
    if (onPointsChange) onPointsChange(pts);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("dblclick", onDblClick);

  // ResizeObserver to automatically redraw when container size changes or accordion opens
  const resizeTarget = canvas.parentElement || canvas;
  const ro = new ResizeObserver(() => {
    redraw();
  });
  ro.observe(resizeTarget);

  requestAnimationFrame(() => redraw());

  return {
    redraw,
    destroy() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("dblclick", onDblClick);
      ro.disconnect();
    }
  };
}

/**
 * Physical numerical attribute definitions for all CS2 soundevent curves.
 * Maps property name to concise X (input) and Y (output) labels and full hover tooltips.
 */
export const CURVE_AXIS_DEFINITIONS = {
  distance_volume_mapping_curve: {
    x_zh: "空间距离",
    y_zh: "音量衰减倍率",
    x_en: "Distance",
    y_en: "Volume Multiplier",
    desc_x_zh: "听者与声源距离 (Hammer 单位)",
    desc_y_zh: "音量衰减倍率 (0.0 静音 ~ 1.0 原音)",
    desc_x_en: "Distance (Hammer Units)",
    desc_y_en: "Volume Multiplier (0.0 Mute ~ 1.0 Full)",
  },
  distance_unfiltered_stereo_mapping_curve: {
    x_zh: "空间距离",
    y_zh: "立体声扩散比",
    x_en: "Distance",
    y_en: "Stereo Spread",
    desc_x_zh: "听者与声源距离 (Hammer 单位)",
    desc_y_zh: "未滤波立体声混合比 (0.0 点源 ~ 1.0 全扩散)",
    desc_x_en: "Distance (Hammer Units)",
    desc_y_en: "Unfiltered Stereo Mix (0.0 Point ~ 1.0 Full Spread)",
  },
  distance_pitch_mapping_curve: {
    x_zh: "空间距离",
    y_zh: "音调倍率",
    x_en: "Distance",
    y_en: "Pitch Multiplier",
    desc_x_zh: "听者与声源距离 (Hammer 单位)",
    desc_y_zh: "音调倍率 (1.0 标准音高，>1 升调，<1 降调)",
    desc_x_en: "Distance (Hammer Units)",
    desc_y_en: "Pitch Multiplier (1.0 Normal, >1 Higher, <1 Lower)",
  },
  distance_effect_mix_mapping_curve: {
    x_zh: "空间距离",
    y_zh: "效果发送比",
    x_en: "Distance",
    y_en: "Effect Mix",
    desc_x_zh: "听者与声源距离 (Hammer 单位)",
    desc_y_zh: "音效发送混合比 (0.0 干声 ~ 1.0 满湿声)",
    desc_x_en: "Distance (Hammer Units)",
    desc_y_en: "Effect Mix Amount (0.0 Dry ~ 1.0 Wet)",
  },
  time_volume_mapping_curve: {
    x_zh: "播放时间",
    y_zh: "音量包络倍率",
    x_en: "Playback Time",
    y_en: "Volume Envelope",
    desc_x_zh: "起播累计时间 (秒)",
    desc_y_zh: "包络音量倍率 (0.0 静音 ~ 1.0 原音)",
    desc_x_en: "Playback Elapsed Time (Seconds)",
    desc_y_en: "Envelope Volume Multiplier (0.0 Mute ~ 1.0 Full)",
  },
  time_unfiltered_stereo_mapping_curve: {
    x_zh: "播放时间",
    y_zh: "立体声扩散比",
    x_en: "Playback Time",
    y_en: "Stereo Spread",
    desc_x_zh: "起播累计时间 (秒)",
    desc_y_zh: "未滤波立体声混合比 (0.0 点源 ~ 1.0 全扩散)",
    desc_x_en: "Playback Elapsed Time (Seconds)",
    desc_y_en: "Unfiltered Stereo Mix (0.0 Point ~ 1.0 Full Spread)",
  },
  time_mixlayer_amount_curve: {
    x_zh: "播放时间",
    y_zh: "混音层强度",
    x_en: "Playback Time",
    y_en: "Mixlayer Amount",
    desc_x_zh: "起播累计时间 (秒)",
    desc_y_zh: "混音层发送强度 (0.0 关闭 ~ 1.0 峰值)",
    desc_x_en: "Playback Elapsed Time (Seconds)",
    desc_y_en: "Mixlayer Send Amount (0.0 Off ~ 1.0 Peak)",
  },
  fadetime_volume_mapping_curve: {
    x_zh: "淡出耗时",
    y_zh: "音量衰减倍率",
    x_en: "Fade Time",
    y_en: "Volume Multiplier",
    desc_x_zh: "停止后淡出耗时 (秒)",
    desc_y_zh: "淡出音量倍率 (1.0 开始淡出 ~ 0.0 静音)",
    desc_x_en: "Fade Elapsed Time (Seconds)",
    desc_y_en: "Fade Volume Multiplier (1.0 Start ~ 0.0 Mute)",
  },
  fadetime_pitch_mapping_curve: {
    x_zh: "淡出耗时",
    y_zh: "音调倍率",
    x_en: "Fade Time",
    y_en: "Pitch Multiplier",
    desc_x_zh: "停止后淡出耗时 (秒)",
    desc_y_zh: "淡出音调倍率 (1.0 标准音高)",
    desc_x_en: "Fade Elapsed Time (Seconds)",
    desc_y_en: "Fade Pitch Multiplier (1.0 Normal)",
  },
  velocity_volume_curve: {
    x_zh: "移动速度",
    y_zh: "音量倍率",
    x_en: "Velocity",
    y_en: "Volume Multiplier",
    desc_x_zh: "声源移动速度 (Hammer 单位/秒)",
    desc_y_zh: "速度关联音量增益倍率",
    desc_x_en: "Entity Velocity (Hammer Units/sec)",
    desc_y_en: "Velocity Volume Gain Multiplier",
  },
  impact_speed_input_volume_mapping_curve: {
    x_zh: "冲击速度",
    y_zh: "音量倍率",
    x_en: "Impact Speed",
    y_en: "Volume Multiplier",
    desc_x_zh: "物理碰撞相对冲击速度 (单位/秒)",
    desc_y_zh: "碰撞响应音量倍率 (0.0 无声 ~ 1.0 满音量)",
    desc_x_en: "Collision Impact Speed (Units/sec)",
    desc_y_en: "Impact Volume Multiplier (0.0 Mute ~ 1.0 Full)",
  },
  occlusion_path_curve: {
    x_zh: "传播路径距离",
    y_zh: "阻挡系数",
    x_en: "Path Distance",
    y_en: "Occlusion Factor",
    desc_x_zh: "几何衍射传播路径距离 (Hammer 单位)",
    desc_y_zh: "阻挡衰减系数 (0.0 无遮挡 ~ 1.0 完全阻隔)",
    desc_x_en: "Diffraction Path Distance (Hammer Units)",
    desc_y_en: "Occlusion Factor (0.0 Clear ~ 1.0 Blocked)",
  }
};

/**
 * Returns localized X and Y axis physical descriptions for a given curve property.
 */
export function getCurveAxisInfo(propKey, lang = "zh") {
  const def = CURVE_AXIS_DEFINITIONS[propKey];
  if (def) {
    return {
      x: lang === "zh" ? def.x_zh : def.x_en,
      y: lang === "zh" ? def.y_zh : def.y_en,
      descX: lang === "zh" ? (def.desc_x_zh || def.x_zh) : (def.desc_x_en || def.x_en),
      descY: lang === "zh" ? (def.desc_y_zh || def.y_zh) : (def.desc_y_en || def.y_en)
    };
  }
  return {
    x: lang === "zh" ? "输入参数" : "Input",
    y: lang === "zh" ? "输出数值" : "Output",
    descX: lang === "zh" ? "输入参数 (X 轴自变量)" : "Input Parameter (X Axis)",
    descY: lang === "zh" ? "输出倍率 / 系数 (Y 轴因变量)" : "Output Value / Ratio (Y Axis)"
  };
}

