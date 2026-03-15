"use client";

import type { CrawlEvent, EntityType } from "@argus/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { entityKeys } from "./use-entities";
import { searchKeys } from "./use-search";

type CrawlStatus = "idle" | "crawling" | "completed" | "failed";

export interface CrawlEventWithId extends CrawlEvent {
    eventId: number;
}

interface CrawlState {
    status: CrawlStatus;
    crawlJobId: string | null;
    currentDepth: number;
    events: CrawlEventWithId[];
    totalEntities: number;
    totalEdges: number;
    error: string | null;
}

const initialState: CrawlState = {
    status: "idle",
    crawlJobId: null,
    currentDepth: 0,
    events: [],
    totalEntities: 0,
    totalEdges: 0,
    error: null,
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function useCrawl() {
    const [state, setState] = useState<CrawlState>(initialState);
    const abortRef = useRef<AbortController | null>(null);
    const eventIdRef = useRef(0);
    const queryClient = useQueryClient();

    const startCrawl = useCallback(
        async (query: string, entityType: EntityType, maxDepth: number) => {
            // Abort any existing crawl
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            eventIdRef.current = 0;
            setState({
                ...initialState,
                status: "crawling",
            });

            try {
                const res = await fetch(`${apiUrl}/api/crawl`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, entityType, maxDepth }),
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) {
                    throw new Error(`Crawl request failed: ${res.status}`);
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        if (!line.startsWith("data:")) continue;
                        const data = line.slice(5).trim();
                        if (!data) continue;

                        try {
                            const event = JSON.parse(data) as CrawlEvent;
                            const eventWithId: CrawlEventWithId = {
                                ...event,
                                eventId: ++eventIdRef.current,
                            };
                            setState((prev) => {
                                const next = {
                                    ...prev,
                                    events: [...prev.events, eventWithId],
                                };

                                switch (event.type) {
                                    case "crawl:started":
                                        next.crawlJobId = event.crawlJobId;
                                        break;
                                    case "crawl:depth":
                                        next.currentDepth = event.depth;
                                        break;
                                    case "crawl:scrape":
                                        next.totalEntities += event.newEntities;
                                        next.totalEdges += event.newEdges;
                                        break;
                                    case "crawl:error":
                                        // Individual scrape error, crawl continues
                                        break;
                                    case "crawl:completed":
                                        next.status = "completed";
                                        next.totalEntities =
                                            event.totalEntities;
                                        next.totalEdges = event.totalEdges;
                                        break;
                                }

                                return next;
                            });
                        } catch {
                            // skip malformed SSE lines
                        }
                    }
                }

                // If stream ended without a completed event, mark as completed
                setState((prev) =>
                    prev.status === "crawling"
                        ? { ...prev, status: "completed" }
                        : prev,
                );

                // Invalidate caches
                queryClient.invalidateQueries({ queryKey: entityKeys.all });
                queryClient.invalidateQueries({ queryKey: searchKeys.all });
            } catch (err) {
                if (controller.signal.aborted) return;
                setState((prev) => ({
                    ...prev,
                    status: "failed",
                    error: err instanceof Error ? err.message : String(err),
                }));
            }
        },
        [queryClient],
    );

    const reset = useCallback(() => {
        abortRef.current?.abort();
        setState(initialState);
    }, []);

    return { ...state, startCrawl, reset };
}
