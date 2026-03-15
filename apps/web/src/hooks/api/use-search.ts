"use client";

import type { EntityType } from "@argus/types";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api";

export const searchKeys = {
    all: ["search"] as const,
    query: (q: string, type?: EntityType, limit?: number, offset?: number) =>
        ["search", q, type, limit, offset] as const,
};

export function useSearch(
    q: string,
    type?: EntityType,
    limit?: number,
    offset?: number,
) {
    return useQuery({
        queryKey: searchKeys.query(q, type, limit, offset),
        queryFn: async () => {
            const query: {
                q: string;
                type?: string;
                limit?: string;
                offset?: string;
            } = { q };
            if (type) query.type = type;
            if (limit != null) query.limit = String(limit);
            if (offset != null) query.offset = String(offset);

            const res = await client.api.search.$get({ query });
            if (!res.ok) throw new Error("Failed to search");
            return res.json();
        },
        enabled: q.length > 0,
    });
}
