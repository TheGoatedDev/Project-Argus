import { Hono } from "hono";
import { db } from "../lib/db.js";
import { createInvestigationService } from "../services/investigation.service.js";

const service = createInvestigationService(db);

export const investigationsRoute = new Hono()
    .get("/", async (c) => {
        const result = await service.list();
        return c.json(result);
    })
    .get("/:id", async (c) => {
        const investigation = await service.getById(c.req.param("id"));
        if (!investigation) return c.json({ error: "Not found" }, 404);
        return c.json(investigation);
    })
    .post("/", async (c) => {
        const body = await c.req.json();
        const investigation = await service.create(body);
        return c.json(investigation, 201);
    })
    .patch("/:id", async (c) => {
        const body = await c.req.json();
        const investigation = await service.update(c.req.param("id"), body);
        if (!investigation) return c.json({ error: "Not found" }, 404);
        return c.json(investigation);
    })
    .delete("/:id", async (c) => {
        const investigation = await service.remove(c.req.param("id"));
        if (!investigation) return c.json({ error: "Not found" }, 404);
        return c.json(investigation);
    })
    .post("/:id/entities", async (c) => {
        const { entityId, notes } = await c.req.json();
        const result = await service.addEntity(
            c.req.param("id"),
            entityId,
            notes,
        );
        return c.json(result, 201);
    })
    .delete("/:id/entities/:entityId", async (c) => {
        const result = await service.removeEntity(
            c.req.param("id"),
            c.req.param("entityId"),
        );
        if (!result) return c.json({ error: "Not found" }, 404);
        return c.json(result);
    });
