/* eslint-disable @typescript-eslint/no-require-imports */
// Expo Router resolves deep links purely from the app/ file structure — a
// route file at src/app/task/[id].tsx IS the `nicoflow://task/:id` mapping,
// there's no separate linking config to test. This repo has no
// expo-router/testing-library harness for a full router-mounted navigation
// test, so this asserts the structural half of AC3 directly: each deep-link
// target resolves to a real, importable screen component. require() (not
// import) is needed here since the path itself is the thing under test.
describe('deep-link route files', () => {
  it('task/[id].tsx exports a screen component', () => {
    const module = require('../../app/task/[id]');
    expect(typeof module.default).toBe('function');
  });

  it('project/[id].tsx exports a screen component', () => {
    const module = require('../../app/project/[id]');
    expect(typeof module.default).toBe('function');
  });

  it('(tabs)/inbox.tsx exports a screen component', () => {
    const module = require('../../app/(tabs)/inbox');
    expect(typeof module.default).toBe('function');
  });
});
