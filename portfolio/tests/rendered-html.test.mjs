import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete modifier support matrix", async () => {
  const response = await render("/reference");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Modifier support, without the wishful thinking\./);
  assert.match(html, /66 public builder modifiers/);
  assert.match(html, /Live \/ implemented/);
  assert.match(html, /Model-only/);
  assert.match(html, /Adapter \/ planned/);
  assert.match(html, /asyncValidator(?:<!-- -->)?\(\)/);
  assert.match(html, /visibleWhen(?:<!-- -->)?\(\)/);
  assert.match(html, /Deprecated/);
  assert.match(html, /How this inventory was classified/);
});

test("server-renders the curated documentation gateway", async () => {
  const response = await render("/docs");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Learn the model in the order you’ll use it\./);
  assert.match(html, /Start here/);
  assert.match(html, /FieldType/);
  assert.match(html, /Recordset/);
  assert.match(html, /Design principles/);
  assert.match(html, /Modifier support matrix/);
  assert.match(html, /Release process/);
  assert.match(html, /npm run typecheck/);
  assert.match(html, /cd portfolio/);
});

test("server-renders the workflow cookbook with canonical repository links", async () => {
  const response = await render("/cookbook");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Model a payment workflow without teaching every screen the rules\./);
  assert.match(html, /Run the Lit modifier catalog locally\./);
  assert.match(html, /npm run example:fdl-input/);
  assert.match(html, /href="https:\/\/github\.com\/pmcelhaney\/FDL\/tree\/main\/examples\/fdl-input"/);
  assert.match(html, /href="\/cookbook"[^>]*>Cookbook/);
  assert.doesNotMatch(html, /github\.com\/Banno\/FDL/);
});
