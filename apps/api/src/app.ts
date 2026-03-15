import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { entitiesRoute } from "./routes/entities.js";
import { healthRoute } from "./routes/health.js";
import { investigationsRoute } from "./routes/investigations.js";

export function createApp() {
    const app = new Hono()
        .use("*", logger())
        .use("*", cors())
        .route("/api", healthRoute)
        .route("/api/entities", entitiesRoute)
        .route("/api/investigations", investigationsRoute);

    return app;
}

const app = createApp();

export type AppType = typeof app;
