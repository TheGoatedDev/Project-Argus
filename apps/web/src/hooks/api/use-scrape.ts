"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api";
import { entityKeys } from "./use-entities";
import { searchKeys } from "./use-search";

export const scrapeKeys = {
    all: ["scrape"] as const,
    scrapers: () => ["scrape", "scrapers"] as const,
};

export function useScrapers() {
    return useQuery({
        queryKey: scrapeKeys.scrapers(),
        queryFn: async () => {
            const res = await client.api.scrape.scrapers.$get();
            if (!res.ok) throw new Error("Failed to fetch scrapers");
            return res.json();
        },
    });
}

export function useScrape() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { query: string; scraperName: string }) => {
            const res = await client.api.scrape.$post({ json: data });
            if (!res.ok) throw new Error("Failed to run scrape");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: entityKeys.all });
            queryClient.invalidateQueries({ queryKey: searchKeys.all });
        },
    });
}
