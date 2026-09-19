import { expect, test } from "@playwright/test";

test("readiness, cursor pagination and trend range are real", async ({ request }) => {
  const readiness = await request.get("/api/system/readiness");
  expect(readiness.ok()).toBeTruthy();
  const ready = (await readiness.json()).data;
  expect(ready.storage).toBe("sqlite-local");
  expect(ready.schemaVersion).toBeGreaterThanOrEqual(2);
  expect(Array.isArray(ready.sourceHealth)).toBeTruthy();

  const content = await request.get("/api/content?limit=5&cursor=0");
  const contentPayload = await content.json();
  expect(content.ok()).toBeTruthy();
  expect(contentPayload.data.length).toBeLessThanOrEqual(5);
  expect(contentPayload.meta).toHaveProperty("nextCursor");

  for (const range of ["7d", "14d", "30d"]) {
    const response = await request.get(`/api/trends?range=${range}`);
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).meta.range).toBe(range);
  }
});

test("collection and person CRUD persists then cleans up", async ({ request }) => {
  const collectionResponse = await request.post("/api/collections", { data: { name: "E2E Koleksiyonu", description: "otomatik test" } });
  expect(collectionResponse.status()).toBe(201);
  const collection = (await collectionResponse.json()).data;
  const updateCollection = await request.patch("/api/collections", { data: { id: collection.id, name: "E2E Güncel", description: "güncellendi" } });
  expect(updateCollection.ok()).toBeTruthy();

  const personResponse = await request.post("/api/people", { data: { name: "E2E Kişi", role: "Test", platform: "github", profileUrl: "https://github.com/openai", topics: ["agents"], sourceIds: ["builtin-github"] } });
  expect(personResponse.status()).toBe(201);
  const person = (await personResponse.json()).data;
  expect(person.sourceIds).toContain("builtin-github");
  const updatePerson = await request.patch(`/api/people/${person.id}`, { data: { sourceIds: [] } });
  expect((await updatePerson.json()).data.sourceIds).toEqual([]);

  expect((await request.delete(`/api/people/${person.id}`)).ok()).toBeTruthy();
  expect((await request.delete(`/api/collections?id=${collection.id}`)).ok()).toBeTruthy();
});

test("local API performance budget", async ({ request }) => {
  const durations: number[] = [];
  for (let index = 0; index < 12; index += 1) {
    const start = performance.now();
    const response = await request.get("/api/content?limit=24");
    expect(response.ok()).toBeTruthy();
    durations.push(performance.now() - start);
  }
  durations.sort((a, b) => a - b);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  expect(p95, `API p95 ${p95.toFixed(1)}ms`).toBeLessThan(250);
});
