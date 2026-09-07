import { MORE_DESTINATIONS } from './data';

// MoreList.test asserts each row pushes its href; this asserts each of those
// hrefs actually resolves to a route file that exports a screen — without it
// a typo'd href is a dead press that no unit test catches (Expo Router
// resolves deep links purely from the app/ file structure, same rationale as
// __tests__/routing/deep-link-routes.test.ts). require() (not import) since
// the path itself is the thing under test.
describe('More section routes', () => {
  it.each(MORE_DESTINATIONS)('$href resolves to a screen component', ({ id }) => {
    const module = require(`../../app/${id}`);
    expect(typeof module.default).toBe('function');
  });
});
