import { describe, it, expect, vi } from 'vitest';
import { generateLifeHistory } from '../../services/lifeHistoryService';
import { CulturalZone, HistoricalEra } from '../../types';

describe('lifeHistoryService era gating', () => {
  it('does not generate modern/future-only events for industrial-era timelines', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.999);

    const character = {
      age: 21,
      profession: 'dandy',
      hometown: 'a frontier settlement',
      socialClass: 'common'
    } as any;

    const events = generateLifeHistory(
      character,
      1879,
      'NORTH_AMERICAN_COLONIAL' as CulturalZone,
      'INDUSTRIAL_ERA' as HistoricalEra
    );

    randomSpy.mockRestore();

    const fullTimelineText = events
      .map(event => `${event.title} ${event.text}`)
      .join(' ')
      .toLowerCase();

    expect(fullTimelineText).not.toContain('covid');
    expect(fullTimelineText).not.toContain('remote work');
    expect(fullTimelineText).not.toContain('cryptocurrency');
    expect(fullTimelineText).not.toContain('silicon valley');
    expect(fullTimelineText).not.toContain('online');
  });
});
