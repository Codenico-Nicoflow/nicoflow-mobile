import { MOBILE_NAV_DESTINATIONS } from './data';

describe('MOBILE_NAV_DESTINATIONS', () => {
  it('renders exactly the 5 required destinations, in order', () => {
    expect(MOBILE_NAV_DESTINATIONS.map(d => d.id)).toEqual(['today', 'inbox', 'areas', 'calendar', 'more']);
  });

  it('every destination has a label and an icon', () => {
    for (const destination of MOBILE_NAV_DESTINATIONS) {
      expect(destination.label.length).toBeGreaterThan(0);
      expect(destination.icon).toBeDefined();
    }
  });
});
