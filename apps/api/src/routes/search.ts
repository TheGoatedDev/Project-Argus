import type { Database } from "@argus/db";
import { Hono } from "hono";
import { searchQuery, validate } from "../lib/schemas.js";
import { createEntityService } from "../services/entity.service.js";

export function createSearchRoute(db: Database) {
    const service = createEntityService(db);

    return new Hono().get("/", validate("query", searchQuery), async (c) => {
        const { q, type, limit, offset } = c.req.valid("query");
        const { results, total } = await service.search({
            query: q,
            type,
            limit,
            offset,
        });
        return c.json({ results, total, limit, offset });
    });
}
