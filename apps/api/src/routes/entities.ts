import type { Database } from "@argus/db";
import { Hono } from "hono";
import {
    createEntityBody,
    idParam,
    updateEntityBody,
    validate,
} from "../lib/schemas.js";
import { createEntityService } from "../services/entity.service.js";

export function createEntitiesRoute(db: Database) {
    const service = createEntityService(db);

    return new Hono()
        .get("/", async (c) => {
            const type = c.req.query("type");
            const result = await service.list(type);
            return c.json(result);
        })
        .get("/:id", validate("param", idParam), async (c) => {
            const { id } = c.req.valid("param");
            const entity = await service.getById(id);
            if (!entity) return c.json({ error: "Not found" }, 404);
            return c.json(entity);
        })
        .post("/", validate("json", createEntityBody), async (c) => {
            const body = c.req.valid("json");
            const entity = await service.create(body);
            return c.json(entity, 201);
        })
        .patch(
            "/:id",
            validate("param", idParam),
            validate("json", updateEntityBody),
            async (c) => {
                const { id } = c.req.valid("param");
                const body = c.req.valid("json");
                const entity = await service.update(id, body);
                if (!entity) return c.json({ error: "Not found" }, 404);
                return c.json(entity);
            },
        )
        .delete("/:id", validate("param", idParam), async (c) => {
            const { id } = c.req.valid("param");
            const entity = await service.softDelete(id);
            if (!entity) return c.json({ error: "Not found" }, 404);
            return c.json(entity);
        })
        .get("/:id/edges", validate("param", idParam), async (c) => {
            const { id } = c.req.valid("param");
            const edges = await service.getEdges(id);
            return c.json(edges);
        })
        .get("/:id/data-points", validate("param", idParam), async (c) => {
            const { id } = c.req.valid("param");
            const points = await service.getDataPoints(id);
            return c.json(points);
        });
}
