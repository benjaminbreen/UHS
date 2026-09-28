import { expect, test } from "@playwright/test";

test("classroom entry requires consent and uploads human game actions", async ({ page }) => {
  const uploads: { events: { kind: string; seq: number }[] }[] = [];
  await page.route("**/api/narrator", (route) => route.fulfill({ status: 503, json: { error: "Narrator unavailable." } }));
  await page.route("**/api/edu?view=*", async (route) => {
    const view = new URL(route.request().url()).searchParams.get("view");
    if (view === "config") return route.fulfill({ json: { available: true } });
    if (view === "start") return route.fulfill({ json: {
      sessionId: "00000000-0000-4000-8000-000000000001", token: "student-token",
    } });
    if (view === "events") {
      const batch = route.request().postDataJSON() as { events: { kind: string; seq: number }[] };
      uploads.push(batch);
      return route.fulfill({ json: { through: batch.events.at(-1)!.seq } });
    }
    return route.fulfill({ status: 404 });
  });
  await page.goto("/edumode");
  await expect(page.getByRole("heading", { name: "Classroom mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start recorded session" })).toBeDisabled();
  await page.getByLabel("Your name").fill("Ada");
  await page.getByLabel("Class code").fill("class-secret");
  await page.getByLabel(/I agree to share/).check();
  await page.getByRole("button", { name: "Start recorded session" }).click();
  await page.getByPlaceholder(/A hunter in Anatolia/).fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page.locator(".game-container").focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => uploads.flatMap((b) => b.events).map((e) => e.kind), { timeout: 15000 })
    .toContain("command");
  await page.getByLabel("Action command").fill("look around");
  await page.getByRole("button", { name: "Tell the narrator" }).click();
  await expect.poll(() => uploads.flatMap((b) => b.events).map((e) => e.kind), { timeout: 15000 })
    .toContain("text");
  await page.getByRole("button", { name: "Notebook", exact: true }).click();
  await page.getByLabel("Notebook entry").fill("I noticed the well.");
  await page.getByRole("button", { name: "Save observation" }).click();
  await expect.poll(() => uploads.flatMap((b) => b.events).map((e) => e.kind), { timeout: 15000 })
    .toContain("note");
  expect(uploads.flatMap((b) => b.events).some((e) => e.kind === "world")).toBe(true);
  await expect(page.getByText(/Classroom recording · Ada/)).toBeVisible();
});

test("teacher access opens a student's timeline and exports", async ({ page }) => {
  await page.route("**/api/edu?view=*", async (route) => {
    const view = new URL(route.request().url()).searchParams.get("view");
    if (route.request().headers().authorization !== "Bearer teacher-secret")
      return route.fulfill({ status: 401, json: { error: "Teacher access required." } });
    if (view === "sessions") return route.fulfill({ json: { sessions: [{
      id: "00000000-0000-4000-8000-000000000001", name: "Ada", eventCount: 2,
      createdAt: "2026-09-27T00:00:00.000Z", updatedAt: "2026-09-27T00:01:00.000Z",
    }] } });
    if (view === "session") return route.fulfill({ json: {
      session: { id: "00000000-0000-4000-8000-000000000001", name: "Ada", eventCount: 2,
        createdAt: "2026-09-27T00:00:00.000Z", updatedAt: "2026-09-27T00:01:00.000Z" },
      events: [
        { seq: 1, kind: "world", wallTime: "2026-09-27T00:00:00.000Z", simTime: 0, revision: 0, data: { manifest: { seed: "class" } } },
        { seq: 2, kind: "text", wallTime: "2026-09-27T00:01:00.000Z", simTime: 60, revision: 0, data: { input: "Where is the well?", response: "Nearby." } },
      ],
    } });
    return route.fulfill({ status: 404 });
  });
  await page.goto("/edumode/teacher");
  await page.getByLabel("Teacher token").fill("teacher-secret");
  await page.getByRole("button", { name: "Load sessions" }).click();
  await page.getByRole("button", { name: /Ada · 2 events/ }).click();
  await expect(page.getByText("Where is the well?")).toBeVisible();
  await expect(page.getByText("Response: Nearby.")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("uhs-classroom-session.csv");
});
