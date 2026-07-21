import { test, expect } from "@playwright/test";

/**
 * Navigation & routing smoke tests — the class of bugs that kept slipping
 * through: broken routes (404s), dead links, and pages with no way back.
 * These run against the dev server with dummy Firebase config, so they
 * assert on shell/nav/UI rather than live data.
 */

test("landing page renders hero and primary CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /connect with/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
});

test("header About and Contact links resolve to real pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About", exact: true }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: /about blowmind/i })).toBeVisible();

  await page.getByRole("link", { name: "Contact", exact: true }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: /get in touch/i })).toBeVisible();
});

test("contact form validates required fields", async ({ page }) => {
  await page.goto("/contact");
  // Submitting empty should not navigate away / should keep the form.
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
});

test("login and signup pages share the public header with working links", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  // The dead-link regression guard: About goes to /about, not "#".
  await page.getByRole("link", { name: "About", exact: true }).first().click();
  await expect(page).toHaveURL(/\/about$/);

  await page.goto("/signup");
  await expect(page.getByRole("link", { name: "Contact", exact: true }).first()).toBeVisible();
});

test("signed-out blog is browsable with a sign-in CTA (no bounce)", async ({
  page,
}) => {
  await page.goto("/blog");
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByText(/join the conversation/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /^sign up$/i }).first()).toBeVisible();
});

test("search page loads and reflects the query", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByPlaceholder(/search posts/i)).toBeVisible();
  await page.getByPlaceholder(/search posts/i).fill("hello");
  await page.getByRole("button", { name: /^search$/i }).click();
  await expect(page).toHaveURL(/\/search\?q=hello/);
  await expect(page.getByText(/results for/i)).toBeVisible();
});

test("unknown route shows the branded 404", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText(/page not found/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /back to the feed/i })).toBeVisible();
});

test("auth action page rejects an invalid/missing link", async ({ page }) => {
  await page.goto("/auth/action");
  await expect(
    page.getByRole("heading", { name: /something went wrong/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /request a new link/i })).toBeVisible();
});

test("mobile menu opens on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: /open menu/i }).click();
  // The mobile nav exposes the same links.
  await expect(page.getByRole("link", { name: "Blog", exact: true }).last()).toBeVisible();
});
