import { defineConfig, devices } from "@playwright/test";

// Dummy Firebase config: pages render and navigate; backend calls fail
// gracefully into empty/error states — enough for UI/navigation E2E.
const dummyEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "e2e-dummy",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "e2e-dummy.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "e2e-dummy",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "e2e-dummy.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:0000000000000000000000",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: dummyEnv,
  },
});
