import {
    type Database,
    investigationEntities,
    investigations,
} from "@argus/db";
import { and, eq } from "drizzle-orm";

export function createInvestigationService(db: Database) {
    return {
        async list() {
            return db.select().from(investigations);
        },

        async getById(id: string) {
            const [investigation] = await db
                .select()
                .from(investigations)
                .where(eq(investigations.id, id));
            return investigation;
        },

        async create(data: { name: string; description?: string }) {
            const [investigation] = await db
                .insert(investigations)
                .values(data)
                .returning();
            return investigation;
        },

        async update(
            id: string,
            data: { name?: string; description?: string },
        ) {
            const [investigation] = await db
                .update(investigations)
                .set(data)
                .where(eq(investigations.id, id))
                .returning();
            return investigation;
        },

        async remove(id: string) {
            const [investigation] = await db
                .delete(investigations)
                .where(eq(investigations.id, id))
                .returning();
            return investigation;
        },

        async addEntity(
            investigationId: string,
            entityId: string,
            notes?: string,
        ) {
            const [result] = await db
                .insert(investigationEntities)
                .values({ investigationId, entityId, notes })
                .returning();
            return result;
        },

        async removeEntity(investigationId: string, entityId: string) {
            const [result] = await db
                .delete(investigationEntities)
                .where(
                    and(
                        eq(
                            investigationEntities.investigationId,
                            investigationId,
                        ),
                        eq(investigationEntities.entityId, entityId),
                    ),
                )
                .returning();
            return result;
        },

        async getEntities(investigationId: string) {
            return db
                .select()
                .from(investigationEntities)
                .where(
                    eq(investigationEntities.investigationId, investigationId),
                );
        },
    };
}
