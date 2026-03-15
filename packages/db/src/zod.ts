import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
    dataPoints,
    entities,
    entityEdges,
    investigationEntities,
    investigations,
} from "./schema.js";

/**
 * Compile-time assertion that a Zod schema's output type is assignable
 * to the expected Drizzle model type. If the schema drifts from the
 * table definition, this line produces a type error.
 */
type AssertSchemaMatches<TSchema extends z.ZodTypeAny, TModel> =
    z.infer<TSchema> extends TModel ? TSchema : never;

// --- Entities ---
export const insertEntitySchema = createInsertSchema(entities);
export const selectEntitySchema = createSelectSchema(entities);

type _AssertInsertEntity = AssertSchemaMatches<
    typeof insertEntitySchema,
    InferInsertModel<typeof entities>
>;
type _AssertSelectEntity = AssertSchemaMatches<
    typeof selectEntitySchema,
    InferSelectModel<typeof entities>
>;

// --- Entity Edges ---
export const insertEntityEdgeSchema = createInsertSchema(entityEdges);
export const selectEntityEdgeSchema = createSelectSchema(entityEdges);

type _AssertInsertEdge = AssertSchemaMatches<
    typeof insertEntityEdgeSchema,
    InferInsertModel<typeof entityEdges>
>;
type _AssertSelectEdge = AssertSchemaMatches<
    typeof selectEntityEdgeSchema,
    InferSelectModel<typeof entityEdges>
>;

// --- Data Points ---
export const insertDataPointSchema = createInsertSchema(dataPoints);
export const selectDataPointSchema = createSelectSchema(dataPoints);

type _AssertInsertDataPoint = AssertSchemaMatches<
    typeof insertDataPointSchema,
    InferInsertModel<typeof dataPoints>
>;
type _AssertSelectDataPoint = AssertSchemaMatches<
    typeof selectDataPointSchema,
    InferSelectModel<typeof dataPoints>
>;

// --- Investigations ---
export const insertInvestigationSchema = createInsertSchema(investigations);
export const selectInvestigationSchema = createSelectSchema(investigations);

type _AssertInsertInvestigation = AssertSchemaMatches<
    typeof insertInvestigationSchema,
    InferInsertModel<typeof investigations>
>;
type _AssertSelectInvestigation = AssertSchemaMatches<
    typeof selectInvestigationSchema,
    InferSelectModel<typeof investigations>
>;

// --- Investigation Entities ---
export const insertInvestigationEntitySchema = createInsertSchema(
    investigationEntities,
);
export const selectInvestigationEntitySchema = createSelectSchema(
    investigationEntities,
);

type _AssertInsertInvestigationEntity = AssertSchemaMatches<
    typeof insertInvestigationEntitySchema,
    InferInsertModel<typeof investigationEntities>
>;
type _AssertSelectInvestigationEntity = AssertSchemaMatches<
    typeof selectInvestigationEntitySchema,
    InferSelectModel<typeof investigationEntities>
>;
