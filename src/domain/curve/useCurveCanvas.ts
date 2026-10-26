import { useEffect, useRef } from 'react';
import { CurvePoint, setupAllCurveValues, sampleCurve } from '@/domain/curve/math';

export interface CurveCanvasOptions {
  points: number[][];
  onPointsChange: (pts: number[][]) => void;
  onLiveDrag?: (pts: number[][], activeIdx: number) => void;
  isDark?: boolean;
  fallbackText?: string;
}

interface TransformBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Transformers extends TransformBounds {
  toScreenX: (x: number) => number;
  toScreenY: (y: number) => number;
  toDataX: (sx: number) => number;
  toDataY: (sy: number) => number;
}

export function useCurveCanvas({
  points,
  onPointsChange,
  onLiveDrag,
  isDark = true,
  fallbackText = 'Need at least 2 points',
}: CurveCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeIdxRef = useRef<number>(-1);
  const hoverIdxRef = useRef<number>(-1);
  const pointsRef = useRef<number[][]>(points);
  const isDarkRef = useRef<boolean>(isDark);
  isDarkRef.current = isDark;
  const fallbackTextRef = useRef<string>(fallbackText);
  fallbackTextRef.current = fallbackText;

  const onPointsChangeRef = useRef(onPointsChange);
  onPointsChangeRef.current = onPointsChange;
  const onLiveDragRef = useRef(onLiveDrag);
  onLiveDragRef.current = onLiveDrag;

  const transformersRef = useRef<Transformers | null>(null);
  const dragBoundsRef = useRef<TransformBounds | null>(null);
  const drawRef = useRef<() => void>(() => {});

  // Update pointsRef and redraw when props change (skip redundant redraw during active drag)
  useEffect(() => {
    if (activeIdxRef.current !== -1) return;
    pointsRef.current = [...points].sort((a, b) => a[0]! - b[0]!);
    drawRef.current();
  }, [points, isDark, fallbackText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height) || 144;
      if (width <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const raw = pointsRef.current;
      if (!raw || raw.length < 2) {
        ctx.fillStyle = '#888';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(fallbackTextRef.current, 20, 30);
        ctx.restore();
        return;
      }

      const cPoints = raw.map((p) => new CurvePoint(p[0]!, p[1]!, p[2]!, p[3]!, p[4]!, p[5]!));
      setupAllCurveValues(cPoints);

      let minX: number;
      let maxX: number;
      let minY: number;
      let maxY: number;

      if (activeIdxRef.current !== -1 && dragBoundsRef.current) {
        minX = dragBoundsRef.current.minX;
        maxX = dragBoundsRef.current.maxX;
        minY = dragBoundsRef.current.minY;
        maxY = dragBoundsRef.current.maxY;
      } else {
        minX = Math.min(0, cPoints[0]!.xValue);
        maxX = Math.max(cPoints[cPoints.length - 1]!.xValue, minX + 1.0);
        minY = Math.min(0, ...cPoints.map((p) => p.yValue));
        maxY = Math.max(1.0, ...cPoints.map((p) => p.yValue));
      }

      const padL = 40;
      const padR = 20;
      const padT = 16;
      const padB = 24;

      const plotW = Math.max(10, width - padL - padR);
      const plotH = Math.max(10, height - padT - padB);

      const toScreenX = (x: number) => padL + ((x - minX) / (maxX - minX)) * plotW;
      const toScreenY = (y: number) => padT + (1 - (y - minY) / (maxY - minY)) * plotH;
      const toDataX = (sx: number) => minX + ((sx - padL) / plotW) * (maxX - minX);
      const toDataY = (sy: number) => minY + (1 - (sy - padT) / plotH) * (maxY - minY);

      transformersRef.current = { toScreenX, toScreenY, toDataX, toDataY, minX, maxX, minY, maxY };

      // Background grid
      const dark = isDarkRef.current;
      ctx.strokeStyle = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = 1;

      for (let i = 0; i <= 4; i++) {
        const yVal = minY + (i / 4) * (maxY - minY);
        const sy = toScreenY(yVal);
        ctx.beginPath();
        ctx.moveTo(padL, sy);
        ctx.lineTo(width - padR, sy);
        ctx.stroke();

        ctx.fillStyle = 'rgba(156, 163, 175, 0.9)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(yVal.toFixed(1), padL - 6, sy + 3);
      }

      for (let i = 0; i <= 4; i++) {
        const xVal = minX + (i / 4) * (maxX - minX);
        const sx = toScreenX(xVal);
        ctx.beginPath();
        ctx.moveTo(sx, padT);
        ctx.lineTo(sx, height - padB);
        ctx.stroke();

        ctx.fillStyle = 'rgba(156, 163, 175, 0.9)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        const span = maxX - minX;
        let label = span <= 1.5 ? xVal.toFixed(2) : span <= 10 ? xVal.toFixed(1) : Math.round(xVal).toString();
        ctx.fillText(label, sx, height - 8);
      }

      // Curve line
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      const steps = 150;
      for (let i = 0; i <= steps; i++) {
        const xVal = minX + (i / steps) * (maxX - minX);
        const yVal = sampleCurve(xVal, cPoints);
        const sx = toScreenX(xVal);
        const sy = toScreenY(yVal);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Control points
      const activeIdx = activeIdxRef.current;
      const hoverIdx = hoverIdxRef.current;

      cPoints.forEach((p, idx) => {
        const sx = toScreenX(p.xValue);
        const sy = toScreenY(p.yValue);
        const isActive = idx === activeIdx;
        const isHover = idx === hoverIdx;

        if (isActive) {
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, isActive ? 7.5 : isHover ? 6.5 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#2563EB' : isHover ? '#93C5FD' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = isActive ? 2.5 : 2;
        ctx.strokeStyle = isActive ? '#1D4ED8' : '#2563EB';
        ctx.stroke();

        if (isActive || isHover) {
          const formatCoord = (v: number) => {
            const s = v.toString();
            const parts = s.split('.');
            if (parts.length === 2 && parts[1]!.length > 2) {
              return s;
            }
            return v.toFixed(2);
          };
          const span = maxX - minX;
          const xDisplay = span <= 10 ? formatCoord(p.xValue) : Math.round(p.xValue).toString();
          const tipText = `(${xDisplay}, ${formatCoord(p.yValue)})`;
          ctx.font = '10px Inter, sans-serif';
          const textW = ctx.measureText(tipText).width;
          const tipX = Math.max(padL, Math.min(width - padR - textW - 8, sx - textW / 2 - 4));
          const tipY = Math.max(16, sy - 14);

          ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
          ctx.beginPath();
          ctx.rect(tipX, tipY - 11, textW + 8, 14);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'left';
          ctx.fillText(tipText, tipX + 4, tipY);
        }
      });

      ctx.restore();
    }

    drawRef.current = draw;
    draw();

    function getMousePos(e: PointerEvent | MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onPointerDown(e: PointerEvent) {
      if (!transformersRef.current) return;
      const { toScreenX, toScreenY } = transformersRef.current;
      const pos = getMousePos(e);
      let hit = -1;
      let minDist = 22; // Generous hit radius for ease of grabbing

      pointsRef.current.forEach((p, idx) => {
        const sx = toScreenX(p[0]!);
        const sy = toScreenY(p[1]!);
        const dist = Math.hypot(sx - pos.x, sy - pos.y);
        if (dist < minDist) {
          minDist = dist;
          hit = idx;
        }
      });

      if (hit !== -1) {
        activeIdxRef.current = hit;
        try {
          canvas!.setPointerCapture(e.pointerId);
        } catch (_) {}
        if (transformersRef.current) {
          dragBoundsRef.current = {
            minX: transformersRef.current.minX,
            maxX: transformersRef.current.maxX,
            minY: transformersRef.current.minY,
            maxY: transformersRef.current.maxY,
          };
        }
        draw();
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!transformersRef.current) return;
      const { toDataX, toDataY, toScreenX, toScreenY } = transformersRef.current;
      const pos = getMousePos(e);

      if (activeIdxRef.current !== -1) {
        const activeIdx = activeIdxRef.current;
        let newX = toDataX(pos.x);
        let newY = toDataY(pos.y);

        const currentPts = [...pointsRef.current];
        const lastIdx = currentPts.length - 1;

        // X clamping to prevent crossing neighboring points
        const minAllowedX = activeIdx === 0 ? 0 : (currentPts[activeIdx - 1]?.[0] ?? 0);
        const maxAllowedX = activeIdx === lastIdx ? 50000 : (currentPts[activeIdx + 1]?.[0] ?? 50000);

        const span = Math.max(0.1, transformersRef.current.maxX - transformersRef.current.minX);

        if (span <= 10) {
          newX = Math.round(newX * 100) / 100;
        } else if (span <= 50) {
          newX = Math.round(newX * 10) / 10;
        } else {
          newX = Math.round(newX);
        }

        newX = Math.max(minAllowedX, Math.min(maxAllowedX, newX));
        newY = Math.max(0, Math.min(2.0, Math.round(newY * 100) / 100));

        currentPts[activeIdx] = [
          newX,
          newY,
          currentPts[activeIdx]![2] ?? 0,
          currentPts[activeIdx]![3] ?? 0,
          currentPts[activeIdx]![4] ?? 2,
          currentPts[activeIdx]![5] ?? 3,
        ];
        pointsRef.current = currentPts;

        draw();
        if (onLiveDragRef.current) {
          onLiveDragRef.current(currentPts, activeIdx);
        }
      } else {
        let hit = -1;
        let minDist = 22;
        pointsRef.current.forEach((p, idx) => {
          const sx = toScreenX(p[0]!);
          const sy = toScreenY(p[1]!);
          const dist = Math.hypot(sx - pos.x, sy - pos.y);
          if (dist < minDist) {
            minDist = dist;
            hit = idx;
          }
        });

        if (hit !== hoverIdxRef.current) {
          hoverIdxRef.current = hit;
          canvas!.style.cursor = hoverIdxRef.current !== -1 ? 'grab' : 'crosshair';
          draw();
        }
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (activeIdxRef.current !== -1) {
        try {
          canvas!.releasePointerCapture(e.pointerId);
        } catch (_) {}
        activeIdxRef.current = -1;
        dragBoundsRef.current = null;
        const sorted = [...pointsRef.current].sort((a, b) => a[0]! - b[0]!);
        pointsRef.current = sorted;
        draw();
        if (onPointsChangeRef.current) {
          onPointsChangeRef.current(sorted);
        }
      }
    }

    function onDblClick(e: MouseEvent) {
      if (!transformersRef.current) return;
      const { toDataX, toDataY } = transformersRef.current;
      const pos = getMousePos(e);

      const currentPts = pointsRef.current;
      const rawX = toDataX(pos.x);
      let newX = Math.max(0, Math.round(rawX * 100) / 100);

      // Prevent adding a duplicate point if one already exists at this exact X
      if (currentPts.some((p) => Math.abs(p[0]! - newX) < 1e-4)) {
        return;
      }

      let newY = Math.max(0, Math.min(2.0, Math.round(toDataY(pos.y) * 100) / 100));

      const updated = [...currentPts, [newX, newY, 0, 0, 2, 3]].sort(
        (a, b) => a[0]! - b[0]!
      );
      pointsRef.current = updated;
      draw();
      if (onPointsChangeRef.current) {
        onPointsChangeRef.current(updated);
      }
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
      if (!transformersRef.current) return;
      const { toScreenX, toScreenY } = transformersRef.current;
      const pos = getMousePos(e);
      let hit = -1;
      let minDist = 20;

      pointsRef.current.forEach((p, idx) => {
        const sx = toScreenX(p[0]!);
        const sy = toScreenY(p[1]!);
        const dist = Math.hypot(sx - pos.x, sy - pos.y);
        if (dist < minDist) {
          minDist = dist;
          hit = idx;
        }
      });

      if (hit !== -1) {
        if (pointsRef.current.length <= 2) {
          return;
        }
        const updated = pointsRef.current.filter((_, i) => i !== hit);
        pointsRef.current = updated;
        draw();
        if (onPointsChangeRef.current) {
          onPointsChangeRef.current(updated);
        }
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('contextmenu', onContextMenu);

    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas.parentElement || canvas);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('contextmenu', onContextMenu);
      ro.disconnect();
    };
  }, []); // Stable listener attachment across entire canvas lifespan

  return canvasRef;
}
