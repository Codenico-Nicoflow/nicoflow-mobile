// redux-devtools-expo-dev-plugin ships ESM-only transitive deps (nanoid via
// @redux-devtools/utils) that jest can't transform. It's a dev-only debugging
// tool with nothing to assert on in tests, so stub the store enhancer as a
// no-op rather than teaching jest to transpile a devtools package.
module.exports =
  () =>
  createStore =>
  (...args) =>
    createStore(...args);
