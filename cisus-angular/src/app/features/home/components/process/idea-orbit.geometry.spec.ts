import { nearestIdeaTurn, orbitPosition, wrapIdeaIndex } from './idea-orbit.geometry';

describe('Idea orbit geometry', () => {
  for (const count of [1, 2, 3, 5, 12]) {
    it(`keeps one centered selection and unique nearby positions with ${count} ideas`, () => {
      for (let cursor = -count * 2; cursor <= count * 2; cursor++) {
        const positions = Array.from(
          { length: count },
          (_, index) => nearestIdeaTurn(index, cursor, count) - cursor,
        );
        expect(positions.filter((position) => position === 0)).toHaveLength(1);
        expect(new Set(positions).size).toBe(count);
        expect(
          positions.filter((position) => orbitPosition(position).visible).length,
        ).toBeLessThanOrEqual(3);
        expect(wrapIdeaIndex(cursor, count)).toBeGreaterThanOrEqual(0);
        expect(wrapIdeaIndex(cursor, count)).toBeLessThan(count);
      }
    });
  }
  it('wraps negative and repeated turns without an angle per product id', () => {
    expect(wrapIdeaIndex(-1, 5)).toBe(4);
    expect(wrapIdeaIndex(17, 5)).toBe(2);
    expect(orbitPosition(0)).toEqual({ angle: 180, scale: 1, visible: true });
    expect(orbitPosition(2).visible).toBe(false);
  });
  it('has a safe empty-catalogue fallback', () => {
    expect(wrapIdeaIndex(8, 0)).toBe(0);
    expect(nearestIdeaTurn(8, 1, 0)).toBe(0);
  });
});
