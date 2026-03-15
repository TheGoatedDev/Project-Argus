import type { Database } from "@argus/db";
import { Hono } from "hono";
import { z } from "zod";
import { graphQuery, validate } from "../lib/schemas.js";
import { createGraphService } from "../services/graph.service.js";

const entityIdParam = z.object({ entityId: z.string().uuid() });

export function createGraphRoute(db: Database) {
    const service = createGraphService(db);

    return new Hono().get(
        "/:entityId",
        validate("param", entityIdParam),
        validate("query", graphQuery),
        async (c) => {
            const { entityId } = c.req.valid("param");
            const { depth, edgeTypes, minConfidence } = c.req.valid("query");

            const parsedEdgeTypes = edgeTypes
                ? edgeTypes.split(",").map((s) => s.trim())
                : undefined;

            const result = await service.traverse({
                entityId,
                depth,
                edgeTypes: parsedEdgeTypes,
                minConfidence,
            });

            return c.json(result);
        },
    );
}
