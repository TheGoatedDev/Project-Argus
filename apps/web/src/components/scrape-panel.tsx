"use client";

import type { EntityType } from "@argus/types";
import { BugIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCrawl } from "@/hooks/api/use-crawl";

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
    { value: "domain", label: "Domain" },
    { value: "email", label: "Email" },
    { value: "handle", label: "Handle" },
    { value: "person", label: "Person" },
];

export function ScrapePanel({ defaultQuery }: { defaultQuery?: string }) {
    const crawl = useCrawl();
    const [query, setQuery] = useState(defaultQuery ?? "");
    const [entityType, setEntityType] = useState<EntityType>("domain");
    const [maxDepth, setMaxDepth] = useState(2);

    function handleCrawl() {
        if (!query.trim()) return;
        crawl.startCrawl(query.trim(), entityType, maxDepth);
    }

    return (
        <div className="rounded-[0.2rem] border border-primary/20 bg-card p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary uppercase tracking-wider">
                <BugIcon className="size-4 text-primary" />
                <span className="font-mono">&gt; Spider Crawl</span>
            </div>
            <div className="flex gap-2">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Query (e.g., example.com, user@email.com)"
                    className="flex-1 bg-card border-primary/20 focus:border-primary/40 focus:glow-cyan transition-all"
                />
                <select
                    value={entityType}
                    onChange={(e) =>
                        setEntityType(e.target.value as EntityType)
                    }
                    className="rounded-[0.2rem] border border-primary/20 bg-card px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none transition-all"
                >
                    {ENTITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <select
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    className="rounded-[0.2rem] border border-primary/20 bg-card px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none transition-all"
                >
                    {[1, 2, 3, 4, 5].map((d) => (
                        <option key={d} value={d}>
                            Depth {d}
                        </option>
                    ))}
                </select>
                <Button
                    onClick={handleCrawl}
                    disabled={!query.trim() || crawl.status === "crawling"}
                    className="rounded-[0.2rem] bg-primary glow-cyan disabled:glow-none disabled:opacity-50 transition-all"
                >
                    {crawl.status === "crawling" ? (
                        <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                        <BugIcon className="size-4" />
                    )}
                    Crawl
                </Button>
            </div>

            {crawl.error && (
                <p className="text-sm text-destructive font-mono">
                    Crawl failed: {crawl.error}
                </p>
            )}

            {crawl.status !== "idle" && (
                <div className="rounded-[0.2rem] bg-secondary/50 border border-primary/10 p-3 space-y-2">
                    <div className="flex items-center gap-4 text-sm font-mono">
                        <span className="text-primary uppercase tracking-wider">
                            {crawl.status === "crawling"
                                ? `Crawling depth ${crawl.currentDepth}...`
                                : crawl.status === "completed"
                                  ? "Crawl Complete"
                                  : "Crawl Failed"}
                        </span>
                        <span className="text-muted-foreground">
                            {crawl.totalEntities} entities
                        </span>
                        <span className="text-muted-foreground">
                            {crawl.totalEdges} edges
                        </span>
                    </div>
                    {crawl.events.length > 0 && (
                        <div className="max-h-48 overflow-auto space-y-1">
                            {crawl.events.map((event) => (
                                <div
                                    key={event.eventId}
                                    className="text-xs font-mono"
                                >
                                    {event.type === "crawl:scrape" && (
                                        <span className="text-neon-green">
                                            [{event.depth}] {event.scraperName}{" "}
                                            → {event.entityName}: +
                                            {event.newEntities} entities, +
                                            {event.newEdges} edges
                                        </span>
                                    )}
                                    {event.type === "crawl:depth" && (
                                        <span className="text-primary">
                                            ── Depth {event.depth} (
                                            {event.entitiesAtDepth} entities) ──
                                        </span>
                                    )}
                                    {event.type === "crawl:error" && (
                                        <span className="text-destructive">
                                            [{event.depth}] {event.scraperName}{" "}
                                            → {event.entityName}: {event.error}
                                        </span>
                                    )}
                                    {event.type === "crawl:completed" && (
                                        <span className="text-primary">
                                            Done: {event.totalEntities}{" "}
                                            entities, {event.totalEdges} edges,
                                            depth {event.depthReached}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
