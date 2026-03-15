import { type Database, dataPoints, entities, entityEdges } from "@argus/db";
import type { ExtractionResult } from "@argus/types";
import { sql } from "drizzle-orm";

export function createIngestionService(db: Database) {
    return {
        async ingest(result: ExtractionResult) {
            return db.transaction(async (tx) => {
                // 1. Upsert entities
                const entityResults: {
                    id: string;
                    type: string;
                    name: string;
                    created: boolean;
                }[] = [];
                const refMap = new Map<string, string>();

                for (const entity of result.entities) {
                    const [row] = await tx
                        .insert(entities)
                        .values({
                            type: entity.type,
                            name: entity.name,
                            metadata: entity.metadata ?? {},
                        })
                        .onConflictDoUpdate({
                            target: [entities.type, entities.name],
                            targetWhere: sql`deleted_at IS NULL`,
                            set: {
                                metadata: sql`entities.metadata || ${JSON.stringify(entity.metadata ?? {})}::jsonb`,
                                updatedAt: new Date(),
                            },
                        })
                        .returning({
                            id: entities.id,
                            type: entities.type,
                            name: entities.name,
                            createdAt: entities.createdAt,
                            updatedAt: entities.updatedAt,
                        });

                    if (row) {
                        const created =
                            row.createdAt.getTime() === row.updatedAt.getTime();
                        entityResults.push({
                            id: row.id,
                            type: row.type,
                            name: row.name,
                            created,
                        });
                        refMap.set(`${entity.type}:${entity.name}`, row.id);
                    }
                }

                // 2. Upsert edges
                let edgeCount = 0;
                for (const edge of result.edges) {
                    const sourceId = refMap.get(
                        `${edge.sourceType}:${edge.sourceRef}`,
                    );
                    const targetId = refMap.get(
                        `${edge.targetType}:${edge.targetRef}`,
                    );
                    if (!sourceId || !targetId) continue;

                    await tx
                        .insert(entityEdges)
                        .values({
                            sourceId,
                            targetId,
                            edgeType: edge.edgeType,
                            confidence: edge.confidence,
                        })
                        .onConflictDoUpdate({
                            target: [
                                entityEdges.sourceId,
                                entityEdges.targetId,
                                entityEdges.edgeType,
                            ],
                            set: {
                                confidence: sql`GREATEST(entity_edges.confidence, excluded.confidence)`,
                            },
                        });
                    edgeCount++;
                }

                // 3. Insert data points
                let dataPointCount = 0;
                for (const dp of result.dataPoints) {
                    const entityId = refMap.get(
                        `${dp.entityType}:${dp.entityRef}`,
                    );
                    if (!entityId) continue;

                    await tx.insert(dataPoints).values({
                        entityId,
                        sourceProvider: dp.sourceProvider,
                        sourceUrl: dp.sourceUrl,
                        rawData: dp.rawData,
                        fetchedAt: dp.fetchedAt,
                    });
                    dataPointCount++;
                }

                return { entities: entityResults, edgeCount, dataPointCount };
            });
        },
    };
}
