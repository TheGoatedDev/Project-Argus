import { EdgeTypeSchema, EntityTypeSchema } from "@argus/types";
import { z } from "zod";

export const insertEntitySchema = z.object({
    type: EntityTypeSchema,
    name: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const selectEntitySchema = z.object({
    id: z.string().uuid(),
    type: EntityTypeSchema,
    name: z.string(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    searchVector: z.string().nullable(),
    deletedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const updateEntitySchema = z.object({
    name: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const insertEntityEdgeSchema = z.object({
    sourceId: z.string().uuid(),
    targetId: z.string().uuid(),
    edgeType: EdgeTypeSchema,
    confidence: z.number().min(0).max(1).default(1.0),
    sourceProvider: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const insertDataPointSchema = z.object({
    entityId: z.string().uuid(),
    sourceProvider: z.string(),
    sourceUrl: z.string().url(),
    rawData: z.record(z.string(), z.unknown()),
    fetchedAt: z.coerce.date(),
});

export const insertInvestigationSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const updateInvestigationSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});

export const insertInvestigationEntitySchema = z.object({
    investigationId: z.string().uuid(),
    entityId: z.string().uuid(),
    notes: z.string().optional(),
});
