import { EntityTypeSchema } from "@argus/types";
import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodSchema } from "zod";
import { z } from "zod";

export function validate<
    Target extends keyof ValidationTargets,
    T extends ZodSchema,
>(target: Target, schema: T) {
    return zValidator(target, schema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    error: "validation_error",
                    message: "Request validation failed",
                    issues: result.error.issues,
                },
                400,
            );
        }
    });
}

export const idParam = z.object({
    id: z.string().uuid(),
});

export const createEntityBody = z.object({
    type: EntityTypeSchema,
    name: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateEntityBody = z.object({
    name: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createInvestigationBody = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const updateInvestigationBody = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});

export const addEntityBody = z.object({
    entityId: z.string().uuid(),
    notes: z.string().optional(),
});

export const searchQuery = z.object({
    q: z.string().min(1),
    type: EntityTypeSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export const graphQuery = z.object({
    depth: z.coerce.number().int().min(1).max(5).default(2),
    edgeTypes: z.string().optional(),
    minConfidence: z.coerce.number().min(0).max(1).default(0),
});

export const scrapeBody = z.object({
    query: z.string().min(1),
    scraperName: z.string().min(1),
});
