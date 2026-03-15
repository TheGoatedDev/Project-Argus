import type { Database } from "@argus/db";
import { Hono } from "hono";
import {
    addEntityBody,
    createInvestigationBody,
    idParam,
    updateInvestigationBody,
    validate,
} from "../lib/schemas.js";
import { createInvestigationService } from "../services/investigation.service.js";

export function createInvestigationsRoute(db: Database) {
    const service = createInvestigationService(db);

    return new Hono()
        .get("/", async (c) => {
            const result = await service.list();
            return c.json(result);
        })
        .get("/:id", validate("param", idParam), async (c) => {
            const { id } = c.req.valid("param");
            const investigation = await service.getById(id);
            if (!investigation) return c.json({ error: "Not found" }, 404);
            return c.json(investigation);
        })
        .post("/", validate("json", createInvestigationBody), async (c) => {
            const body = c.req.valid("json");
            const investigation = await service.create(body);
            return c.json(investigation, 201);
        })
        .patch(
            "/:id",
            validate("param", idParam),
            validate("json", updateInvestigationBody),
            async (c) => {
                const { id } = c.req.valid("param");
                const body = c.req.valid("json");
                const investigation = await service.update(id, body);
                if (!investigation) return c.json({ error: "Not found" }, 404);
                return c.json(investigation);
            },
        )
        .delete("/:id", validate("param", idParam), async (c) => {
            const { id } = c.req.valid("param");
            const investigation = await service.remove(id);
            if (!investigation) return c.json({ error: "Not found" }, 404);
            return c.json(investigation);
        })
        .post(
            "/:id/entities",
            validate("param", idParam),
            validate("json", addEntityBody),
            async (c) => {
                const { id } = c.req.valid("param");
                const { entityId, notes } = c.req.valid("json");
                const result = await service.addEntity(id, entityId, notes);
                return c.json(result, 201);
            },
        )
        .delete("/:id/entities/:entityId", async (c) => {
            const result = await service.removeEntity(
                c.req.param("id"),
                c.req.param("entityId"),
            );
            if (!result) return c.json({ error: "Not found" }, 404);
            return c.json(result);
        });
}
