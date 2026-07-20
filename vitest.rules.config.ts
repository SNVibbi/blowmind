import { defineConfig } from "vitest/config";

// Security-rule tests run against the Firestore emulator:
//   npm run test:rules
// (firebase emulators:exec starts the emulator, runs vitest, tears down.)
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
