"use client";

import type { EntityType } from "@argus/types";
import { BugIcon } from "lucide-react";
import { useState } from "react";
import { CrawlButton } from "@/components/crawl-button";
import { CrawlFeedback } from "@/components/crawl-feedback";
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
                    aria-label="Entity type"
                    className="rounded-[0.2rem] border border-primary/20 bg-card px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none transition-all"
                >
                    {ENTITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <CrawlButton
                    depth={maxDepth}
                    onDepthChange={setMaxDepth}
                    onCrawl={handleCrawl}
                    isCrawling={crawl.status === "crawling"}
                    disabled={!query.trim()}
                />
            </div>

            <CrawlFeedback crawl={crawl} />
        </div>
    );
}
