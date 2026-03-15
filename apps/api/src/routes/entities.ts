import { Hono } from "hono";
import { db } from "../lib/db.js";
import { createEntityService } from "../services/entity.service.js";

const service = createEntityService(db);

export const entitiesRoute = new Hono()
    .get("/", async (c) => {
        const type = c.req.query("type");
        const result = await service.list(type);
        return c.json(result);
    })
    .get("/:id", async (c) => {
        const entity = await service.getById(c.req.param("id"));
        if (!entity) return c.json({ error: "Not found" }, 404);
        return c.json(entity);
    })
    .post("/", async (c) => {
        const body = await c.req.json();
        const entity = await service.create(body);
        return c.json(entity, 201);
    })
    .patch("/:id", async (c) => {
        const body = await c.req.json();
        const entity = await service.update(c.req.param("id"), body);
        if (!entity) return c.json({ error: "Not found" }, 404);
        return c.json(entity);
    })
    .delete("/:id", async (c) => {
        const entity = await service.softDelete(c.req.param("id"));
        if (!entity) return c.json({ error: "Not found" }, 404);
        return c.json(entity);
    })
    .get("/:id/edges", async (c) => {
        const edges = await service.getEdges(c.req.param("id"));
        return c.json(edges);
    })
    .get("/:id/data-points", async (c) => {
        const points = await service.getDataPoints(c.req.param("id"));
        return c.json(points);
    });
