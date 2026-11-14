import { describe, it, expect } from "vitest";
import { z } from "zod";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { createSettingSession as createLocalSession } from "../src/runtime/session";
import { composeIntro, introText } from "../src/core/intro";
import { strictSchema } from "../server/json-schema";
import { worldWeaver } from "../server/world-weaver";
const get = (text: string) => {
  const r = resolveSetting(text);
  if ("error" in r) throw Error(r.error);
  return r.setting;
};
describe("World Weaver setting resolution", () => {
  it("resolves aliases, periods, explicit BCE dates, centuries, roles and climate treatments locally", () => {
    expect(get("Elizabethan London")).toMatchObject({
      placeId: "london",
      water: "river-ew",
    });
    expect(get("Hellenistic Alexandria")).toMatchObject({
      placeId: "alexandria",
      water: "coast-n",
    });
    expect(get("ancient roman legionary in umbria")).toMatchObject({
      placeId: "umbria",
      role: "Legionary",
      settlement: "camp",
    });
    expect(get("free black farmer in 19th century Haiti")).toMatchObject({
      placeId: "haiti",
      role: "Farmer",
      community: "Free Black household",
    });
    expect(get("paleolithic shaman siberia")).toMatchObject({
      climate: "tundra",
      settlement: "camp",
    });
    expect(get("Normandy 100 BCE").year).toBe(-99);
    expect(get("Beijing 14th century").year).toBeGreaterThanOrEqual(1301);
    expect(get("Beijing 14th century").year).toBeLessThanOrEqual(1400);
    expect(get("medieval").placeId).toBe("normandy");
    expect(resolveSetting("a place not in the catalog")).toHaveProperty(
      "error",
    );
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    for (const place of places) expect(() => settingFor(place)).not.toThrow();
    expect(get("19th-century Haiti").year).toBeGreaterThanOrEqual(1801);
    expect(get("19th-century Haiti").year).toBeLessThanOrEqual(1900);
    expect(get("Roman farmer in Haiti").placeId).toBe("haiti");
  });
  it("never calls a provider in free mode; protects and validates the optional World Weaver boundary", async () => {
    let calls = 0;
    const london = places.find((p) => p.id === "london")!;
    const setting = settingFor(london);
    const choice = {
      placeId: london.id,
      placeName: london.name,
      lon: london.lon,
      lat: london.lat,
      year: london.year,
      role: setting.role,
      characterName: setting.characterName,
      community: setting.community,
      climate: london.climate,
      water: london.water,
      relief: london.relief,
      culture: london.culture,
      settlement: london.settlement,
      architecture: london.architecture,
    };
    const provider = (async () => {
      calls++;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(choice) } }],
        }),
      );
    }) as typeof fetch;
    const request = (code = "class") =>
      new Request("http://local/api/world-weaver", {
        method: "POST",
        headers: { "X-World-Weaver-Code": code },
        body: JSON.stringify({ prompt: "Elizabethan London" }),
      });
    const env = {
      UHS_WORLD_WEAVER_ENABLED: "1",
      OPENAI_API_KEY: "test-key",
      UHS_WORLD_WEAVER_ACCESS_CODE: "class",
    };
    expect((await worldWeaver(request(), {}, provider)).status).toBe(503);
    expect(
      (
        await worldWeaver(
          request(),
          { OPENAI_API_KEY: "test-key", UHS_WORLD_WEAVER_ENABLED: "0" },
          provider,
        )
      ).status,
    ).toBe(503);
    expect((await worldWeaver(request("wrong"), env, provider)).status).toBe(
      401,
    );
    expect(calls).toBe(0);
    // No code configured: open to everyone.
    const open = await worldWeaver(
      new Request("http://local/api/world-weaver", {
        method: "POST",
        body: JSON.stringify({ prompt: "Elizabethan London" }),
      }),
      { OPENAI_API_KEY: "test-key" },
      provider,
    );
    expect(open.status).toBe(200);
    calls = 0;
    const response = await worldWeaver(request(), env, provider);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.setting).toEqual(setting);
    expect(calls).toBe(1);
    const named = await worldWeaver(
      new Request("http://local/api/world-weaver", {
        method: "POST",
        headers: { "X-World-Weaver-Code": "class" },
        body: JSON.stringify({ prompt: "I am Ea-Nasir in Mesopotamia, 1750 BCE" }),
      }),
      env,
      provider,
    );
    expect((await named.json()).setting.characterName).toBe("Ea-Nasir");
    const legacyRequest = new Request("http://local/api/world-weaver", {
      method: "POST",
      headers: { "X-Classroom-Code": "class" },
      body: JSON.stringify({ prompt: "Elizabethan London" }),
    });
    expect(
      (
        await worldWeaver(
          legacyRequest,
          {
            UHS_WORLD_WEAVER_ENABLED: "1",
            OPENAI_API_KEY: "test-key",
            UHS_CLASSROOM_CODE: "class",
          },
          provider,
        )
      ).status,
    ).toBe(200);
    const malformed = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"placeId":"london","lat":999}' } }],
        }),
      )) as typeof fetch;
    expect((await worldWeaver(request(), env, malformed)).status).toBe(502);
  });
  it("plays a named figure as themself: their work, people and aim, not a drawn trade", async () => {
    const alexandria = places.find((p) => p.id === "alexandria")!;
    const choice = {
      placeId: "alexandria", placeName: "Alexandria", lon: alexandria.lon, lat: alexandria.lat, year: -330,
      role: "king of Macedon", characterName: "Alexander", community: "the Macedonian court",
      climate: alexandria.climate, water: alexandria.water, relief: alexandria.relief, culture: alexandria.culture,
      settlement: alexandria.settlement, architecture: alexandria.architecture,
      figure: "Alexander III of Macedon", work: "ruler", sex: "male", age: 24, situation: null,
      hook: "Today you mark out the walls of your new city with barley meal.",
      aim: { text: "Conquer the Persian Empire.", reason: "You are heir to Philip's war.", means: "Lead the army east." },
      kin: [], figures: [{ name: "Hephaestion", role: "companion", sex: "male", documented: true }],
      tidings: [{ text: "Darius is gathering a new army in Babylon.", documented: true }],
    };
    const provider = (async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(choice) } }] }))) as typeof fetch;
    const response = await worldWeaver(
      new Request("http://local/api/world-weaver", { method: "POST", body: JSON.stringify({ prompt: "alexander the great" }) }),
      { OPENAI_API_KEY: "test-key" },
      provider,
    );
    expect(response.status).toBe(200);
    const { setting } = await response.json();
    const engine = createLocalSession(setting, "alexander");
    const s = engine.state;
    expect(s.player.role).toBe("king of Macedon");
    expect(s.player.origin?.livelihood).toBe("ruler");
    expect(s.player.age).toBe(24);
    expect(s.lifeAim?.text).toBe("Conquer the Persian Empire.");
    expect(s.actors.some((a) => a.name === "Hephaestion")).toBe(true);
    const text = introText(composeIntro(s, engine.world.pack.setting, "Alexandria"));
    expect(text).toContain("a king of Macedon");
    expect(text).toContain("barley meal");
    expect(text).toContain("Darius");
    expect(text).not.toContain("has come to Egypt");
  }, 60000);
  it("gives every nested object in the model's schema the strict-mode shape", () => {
    const visit = (node: Record<string, unknown>): void => {
      if (node.type === "object" || (Array.isArray(node.type) && node.type.includes("object")))
        expect(node.additionalProperties).toBe(false);
      for (const v of Object.values(node)) if (v && typeof v === "object") visit(v as Record<string, unknown>);
    };
    visit(strictSchema(z.object({ kin: z.array(z.object({ name: z.string() })).optional() })));
  });
});
