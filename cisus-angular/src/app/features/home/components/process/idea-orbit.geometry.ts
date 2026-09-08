/** Visual options are independent of the media backend's intentionally strict target allow-list. */
export function wrapIdeaIndex(index: number, count: number): number {
  return count > 0 ? ((index % count) + count) % count : 0;
}

/** Place a real item in the nearest turn of the wheel, so crossing the end stays continuous. */
export function nearestIdeaTurn(index: number, cursor: number, count: number): number {
  return count > 0 ? index + Math.round((cursor - index) / count) * count : 0;
}

export function orbitPosition(relative: number): {
  angle: number;
  visible: boolean;
  scale: number;
} {
  return {
    angle: 180 + relative * 46,
    visible: Math.abs(relative) <= 1,
    scale: relative === 0 ? 1 : Math.abs(relative) === 1 ? 0.76 : 0.54,
  };
}
