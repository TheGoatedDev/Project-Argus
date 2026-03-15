import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createRegistry } from "./lib/registry.js";

const registry = await createRegistry();
const app = createApp(undefined, registry);
const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Argus API running on http://localhost:${info.port}`);
});
