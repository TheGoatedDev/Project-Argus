"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api";

export const graphKeys = {
    all: ["graph"] as const,
    traversal: (
        entityId: string,
        opts?: { depth?: number; edgeTypes?: string; minConfidence?: number },
    ) => ["graph", "traversal", entityId, opts] as const,
};

export function useGraphTraversal(
    entityId: string | null,
    opts?: { depth?: number; edgeTypes?: string; minConfidence?: number },
) {
    return useQuery({
        queryKey: graphKeys.traversal(entityId!, opts),
        queryFn: async () => {
            const query: Record<string, string> = {};
            if (opts?.depth != null) query.depth = String(opts.depth);
            if (opts?.edgeTypes) query.edgeTypes = opts.edgeTypes;
            if (opts?.minConfidence != null)
                query.minConfidence = String(opts.minConfidence);

            const res = await client.api.graph[":entityId"].$get({
                param: { entityId: entityId! },
                query,
            });
            if (!res.ok) throw new Error("Failed to fetch graph");
            return res.json();
        },
        enabled: !!entityId,
    });
}
