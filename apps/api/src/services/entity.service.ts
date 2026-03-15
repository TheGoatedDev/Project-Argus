import { type Database, dataPoints, entities, entityEdges } from "@argus/db";
import { and, eq, isNull } from "drizzle-orm";

export function createEntityService(db: Database) {
    return {
        async list(type?: string) {
            const conditions = [isNull(entities.deletedAt)];
            if (type) {
                conditions.push(
                    eq(
                        entities.type,
                        type as (typeof entities.type.enumValues)[number],
                    ),
                );
            }
            return db
                .select()
                .from(entities)
                .where(and(...conditions));
        },

        async getById(id: string) {
            const [entity] = await db
                .select()
                .from(entities)
                .where(and(eq(entities.id, id), isNull(entities.deletedAt)));
            return entity;
        },

        async create(data: {
            type: (typeof entities.type.enumValues)[number];
            name: string;
            metadata?: Record<string, unknown>;
        }) {
            const [entity] = await db.insert(entities).values(data).returning();
            return entity;
        },

        async update(
            id: string,
            data: {
                name?: string;
                metadata?: Record<string, unknown>;
            },
        ) {
            const [entity] = await db
                .update(entities)
                .set(data)
                .where(and(eq(entities.id, id), isNull(entities.deletedAt)))
                .returning();
            return entity;
        },

        async softDelete(id: string) {
            const [entity] = await db
                .update(entities)
                .set({ deletedAt: new Date() })
                .where(and(eq(entities.id, id), isNull(entities.deletedAt)))
                .returning();
            return entity;
        },

        async getEdges(id: string) {
            return db
                .select()
                .from(entityEdges)
                .where(eq(entityEdges.sourceId, id));
        },

        async getDataPoints(id: string) {
            return db
                .select()
                .from(dataPoints)
                .where(eq(dataPoints.entityId, id));
        },
    };
}
