import type { Database } from "@argus/db";
import { sql } from "drizzle-orm";

interface TraverseOptions {
    entityId: string;
    depth: number;
    edgeTypes?: string[];
    minConfidence: number;
}

// Normalize execute() result across postgres-js (RowList) and PGlite ({ rows })
function extractRows(result: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(result)) return result;
    if (result && typeof result === "object" && "rows" in result) {
        return (result as { rows: Array<Record<string, unknown>> }).rows;
    }
    return [];
}

export function createGraphService(db: Database) {
    return {
        async traverse({
            entityId,
            depth,
            edgeTypes,
            minConfidence,
        }: TraverseOptions) {
            const edgeTypeFilter = edgeTypes?.length
                ? sql`AND e.edge_type IN (${sql.join(
                      edgeTypes.map((t) => sql`${t}::edge_type`),
                      sql`, `,
                  )})`
                : sql``;

            const result = await db.execute(sql`
                WITH RECURSIVE graph AS (
                    SELECT
                        e.id,
                        e.source_id,
                        e.target_id,
                        e.edge_type,
                        e.confidence,
                        e.source_provider,
                        e.metadata,
                        e.created_at,
                        1 AS depth,
                        ARRAY[e.id] AS path
                    FROM entity_edges e
                    WHERE (e.source_id = ${entityId}::uuid OR e.target_id = ${entityId}::uuid)
                        AND e.confidence >= ${minConfidence}
                        ${edgeTypeFilter}

                    UNION ALL

                    SELECT
                        e.id,
                        e.source_id,
                        e.target_id,
                        e.edge_type,
                        e.confidence,
                        e.source_provider,
                        e.metadata,
                        e.created_at,
                        g.depth + 1,
                        g.path || e.id
                    FROM entity_edges e
                    INNER JOIN graph g ON (
                        e.source_id = g.target_id OR e.source_id = g.source_id
                        OR e.target_id = g.source_id OR e.target_id = g.target_id
                    )
                    WHERE g.depth < ${depth}
                        AND NOT (e.id = ANY(g.path))
                        AND e.confidence >= ${minConfidence}
                        ${edgeTypeFilter}
                )
                SELECT DISTINCT ON (id) id, source_id, target_id, edge_type, confidence, source_provider, metadata, created_at
                FROM graph
            `);

            const edges = extractRows(result) as Array<{
                id: string;
                source_id: string;
                target_id: string;
                edge_type: string;
                confidence: number;
                source_provider: string | null;
                metadata: Record<string, unknown>;
                created_at: string;
            }>;

            const nodeIds = new Set<string>();
            for (const edge of edges) {
                nodeIds.add(edge.source_id);
                nodeIds.add(edge.target_id);
            }

            let nodes: Array<Record<string, unknown>> = [];
            if (nodeIds.size > 0) {
                const idArray = [...nodeIds];
                const idList = sql.join(
                    idArray.map((id) => sql`${id}::uuid`),
                    sql`, `,
                );
                const nodeResult = await db.execute(sql`
                    SELECT * FROM entities
                    WHERE id IN (${idList})
                        AND deleted_at IS NULL
                `);
                nodes = extractRows(nodeResult);
            }

            return { nodes, edges };
        },
    };
}
