// msw/node is not RN-compatible (no `http` module) — msw/native is the
// documented React Native entry point (https://mswjs.io/docs/integrations/react-native).
import { setupServer } from 'msw/native';

// No default handlers — every test registers exactly the routes it needs via
// server.use(...). Same pattern as nicoflow-shared's test/server.ts.
export const server = setupServer();
