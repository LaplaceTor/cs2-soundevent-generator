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
 * Standard curve presets
 */
export const CURVE_PRESETS = {
  linear: [
    [0.0, 1.0, -0.001, -0.001, 2, 3],
    [1000.0, 0.0, -0.001, -0.001, 1, 1]
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
  flat: [
    [0.0, 1.0, 0.0, 0.0, 2, 3],
    [1000.0, 1.0, 0.0, 0.0, 1, 1]
  ]
};

/**
 * Render Curve onto HTML5 Canvas with HiDPI / scaling support
 */
export function drawCurveCanvas(canvas, rawPoints, xLabel = "X", yLabel = "Y") {
  if (!canvas || typeof canvas.getContext !== "function") return;
  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width) || 600;
  const height = Math.round(rect.height) || 160;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  // Clear
  ctx.clearRect(0, 0, width, height);

  const FONT_CANVAS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', sans-serif";

  if (!rawPoints || rawPoints.length < 2) {
    ctx.fillStyle = "#888";
    ctx.font = `13px ${FONT_CANVAS}`;
    ctx.fillText("Need at least 2 control points", 20, 30);
    ctx.restore();
    return;
  }

  // Deep copy and sort
  const points = rawPoints.map(p => new CurvePoint(p[0], p[1], p[2], p[3], p[4], p[5]))
    .sort((a, b) => a.xValue - b.xValue);

  setupAllCurveValues(points);

  const minX = points[0].xValue;
  const maxX = Math.max(points[points.length - 1].xValue, minX + 0.001);
  const minY = Math.min(0, ...points.map(p => p.yValue));
  const maxY = Math.max(1.0, ...points.map(p => p.yValue));

  const padL = 45;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const toScreenX = (x) => padL + ((x - minX) / (maxX - minX)) * plotW;
  const toScreenY = (y) => padT + (1 - (y - minY) / (maxY - minY)) * plotH;

  // Background grid
  ctx.strokeStyle = "rgba(128, 128, 128, 0.15)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const yVal = minY + (i / 4) * (maxY - minY);
    const sy = toScreenY(yVal);
    ctx.beginPath();
    ctx.moveTo(padL, sy);
    ctx.lineTo(width - padR, sy);
    ctx.stroke();

    ctx.fillStyle = "rgba(160, 160, 160, 0.8)";
    ctx.font = `10px ${FONT_CANVAS}`;
    ctx.fillText(yVal.toFixed(1), 8, sy + 3);
  }

  for (let i = 0; i <= 4; i++) {
    const xVal = minX + (i / 4) * (maxX - minX);
    const sx = toScreenX(xVal);
    ctx.beginPath();
    ctx.moveTo(sx, padT);
    ctx.lineTo(sx, height - padB);
    ctx.stroke();

    ctx.fillStyle = "rgba(160, 160, 160, 0.8)";
    ctx.font = `10px ${FONT_CANVAS}`;
    ctx.fillText(Math.round(xVal).toString(), sx - 10, height - 12);
  }

  // Draw curve line
  ctx.strokeStyle = "#4a83c9";
  ctx.lineWidth = 2.5;
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
  points.forEach((p, idx) => {
    const sx = toScreenX(p.xValue);
    const sy = toScreenY(p.yValue);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#4a83c9";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}
