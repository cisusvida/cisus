/** Visual options are independent of the media backend's intentionally strict target allow-list. */
export function wrapIdeaIndex(index: number, count: number): number {
  return count > 0 ? ((index % count) + count) % count : 0;
}

/** Place a real item in the nearest turn of the wheel, so crossing the end stays continuous. */
export function nearestIdeaTurn(index: number, cursor: number, count: number): number {
  return count > 0 ? index + Math.round((cursor - index) / count) * count : 0;
}

export function orbitPosition(
  relative: number,
  count = 3,
): {
  angle: number;
  visible: boolean;
  scale: number;
} {
  return {
    angle: 180 + relative * 46,
    visible: count > 0 && Math.abs(relative) <= 1 && (count > 2 || relative >= 0),
    scale: relative === 0 ? 1 : Math.abs(relative) === 1 ? 0.76 : 0.54,
  };
}

/**
 * Track occurrences along an unbounded wheel, not product ids. The outgoing occurrence keeps
 * travelling past the selection while the next copy enters from the far end of the arc.
 * With two ideas only the selection and next neighbour are visible at rest, never two copies
 * of the same product. Offstage occurrences provide continuity in either direction.
 */
export function orbitWindow(cursor: number, count: number) {
  if (count < 1) return [];
  const offsets = count === 1 ? [0] : [-2, -1, 0, 1, 2];
  return offsets.map((relative) => {
    const position = cursor + relative;
    return {
      position,
      relative,
      index: wrapIdeaIndex(position, count),
      ...orbitPosition(relative, count),
    };
  });
}
