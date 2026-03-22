"use client";

import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type { useCrawl } from "@/hooks/api/use-crawl";

type CrawlState = ReturnType<typeof useCrawl>;

interface CrawlFeedbackProps {
    crawl: CrawlState;
}

export function CrawlFeedback({ crawl }: CrawlFeedbackProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom whenever events update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [crawl.events]);

    if (crawl.status === "idle") return null;

    return (
        <div className="relative overflow-hidden rounded-[0.2rem] border border-primary/20 bg-card">
            {/* Animated scanline while crawling */}
            {crawl.status === "crawling" && (
                <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
                    <div
                        className="h-full w-full"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, var(--neon-cyan), transparent)",
                            animation: "crawl-scan 1.5s ease-in-out infinite",
                        }}
                    />
                </div>
            )}

            <div className="p-4 space-y-3">
                {/* Status header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {crawl.status === "crawling" && (
                            <Loader2Icon className="size-4 animate-spin text-primary" />
                        )}
                        {crawl.status === "completed" && (
                            <CheckCircle2Icon className="size-4 text-neon-green" />
                        )}
                        {crawl.status === "failed" && (
                            <XCircleIcon className="size-4 text-destructive" />
                        )}
                        <span className="text-xs font-mono uppercase tracking-widest text-primary">
                            {crawl.status === "crawling"
                                ? `Crawling depth ${crawl.currentDepth}...`
                                : crawl.status === "completed"
                                  ? "Crawl Complete"
                                  : "Crawl Failed"}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                        <span>{crawl.totalEntities} entities</span>
                        <span>{crawl.totalEdges} edges</span>
                    </div>
                </div>

                {/* Error message */}
                {crawl.error && (
                    <p className="text-xs font-mono text-destructive">
                        {crawl.error}
                    </p>
                )}

                {/* Event log */}
                {crawl.events.length > 0 && (
                    <div
                        ref={scrollRef}
                        className="max-h-36 overflow-auto rounded-[0.2rem] bg-background/60 border border-primary/10 p-2 space-y-0.5"
                    >
                        {crawl.events.map((event) => (
                            <div
                                key={event.eventId}
                                className="text-[11px] leading-relaxed font-mono"
                            >
                                {event.type === "crawl:depth" && (
                                    <span className="text-primary/60">
                                        ── depth {event.depth} ·{" "}
                                        {event.entitiesAtDepth} targets ──
                                    </span>
                                )}
                                {event.type === "crawl:scrape" && (
                                    <span className="text-neon-green/80">
                                        <span className="text-muted-foreground">
                                            [{event.scraperName}]
                                        </span>{" "}
                                        {event.entityName}{" "}
                                        <span className="text-neon-green">
                                            +{event.newEntities}e +
                                            {event.newEdges}r
                                        </span>
                                    </span>
                                )}
                                {event.type === "crawl:error" && (
                                    <span className="text-destructive/80">
                                        <span className="text-muted-foreground">
                                            [{event.scraperName}]
                                        </span>{" "}
                                        {event.entityName}: {event.error}
                                    </span>
                                )}
                                {event.type === "crawl:completed" && (
                                    <span className="text-primary">
                                        done · {event.totalEntities} entities ·{" "}
                                        {event.totalEdges} edges · depth{" "}
                                        {event.depthReached}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Dismiss button when done */}
                {(crawl.status === "completed" ||
                    crawl.status === "failed") && (
                    <button
                        type="button"
                        onClick={crawl.reset}
                        className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                        Dismiss
                    </button>
                )}
            </div>
        </div>
    );
}
