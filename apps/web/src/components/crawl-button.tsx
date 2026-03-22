"use client";

import {
    BugIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Loader2Icon,
} from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface CrawlButtonProps {
    depth: number;
    onDepthChange: (depth: number) => void;
    onCrawl: () => void;
    isCrawling: boolean;
    disabled?: boolean;
    minDepth?: number;
    maxDepth?: number;
}

export function CrawlButton({
    depth,
    onDepthChange,
    onCrawl,
    isCrawling,
    disabled = false,
    minDepth = 1,
    maxDepth = 5,
}: CrawlButtonProps) {
    const increment = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (depth < maxDepth) onDepthChange(depth + 1);
        },
        [depth, maxDepth, onDepthChange],
    );

    const decrement = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (depth > minDepth) onDepthChange(depth - 1);
        },
        [depth, minDepth, onDepthChange],
    );

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (isCrawling) return;
            if (e.deltaY < 0 && depth < maxDepth) onDepthChange(depth + 1);
            if (e.deltaY > 0 && depth > minDepth) onDepthChange(depth - 1);
        },
        [depth, minDepth, maxDepth, isCrawling, onDepthChange],
    );

    const isDisabled = disabled || isCrawling;

    return (
        <fieldset
            aria-label={`Crawl controls, depth ${depth}`}
            className={cn(
                "group/crawl relative inline-flex h-9 items-center overflow-hidden rounded-[0.2rem] border transition-all",
                isDisabled
                    ? "border-primary/10 opacity-50 pointer-events-none"
                    : "border-primary/20 hover:border-primary/40",
                isCrawling && "opacity-100 pointer-events-auto",
            )}
        >
            {/* Main crawl action */}
            <button
                type="button"
                onClick={onCrawl}
                disabled={isDisabled}
                className={cn(
                    "flex h-full items-center gap-1.5 px-3 text-sm font-medium transition-all",
                    "bg-card hover:bg-primary/10 active:bg-primary/15",
                    "disabled:pointer-events-none",
                )}
            >
                {isCrawling ? (
                    <Loader2Icon className="size-4 animate-spin text-primary" />
                ) : (
                    <BugIcon className="size-4 text-primary/70 group-hover/crawl:text-primary transition-colors" />
                )}
                <span className="text-foreground">Crawl</span>
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-primary/15" />

            {/* Depth stepper */}
            <div
                onWheel={handleWheel}
                className="flex h-full items-center bg-card"
            >
                <button
                    type="button"
                    onClick={decrement}
                    disabled={isDisabled || depth <= minDepth}
                    aria-label="Decrease crawl depth"
                    className="flex h-full w-5 items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:pointer-events-none disabled:opacity-30"
                    tabIndex={-1}
                >
                    <ChevronDownIcon className="size-3" />
                </button>
                <span
                    className="min-w-[2ch] text-center font-mono text-xs tabular-nums text-primary select-none"
                    title={`Crawl depth — scroll to adjust (max ${maxDepth})`}
                    aria-hidden="true"
                >
                    {depth}
                </span>
                <button
                    type="button"
                    onClick={increment}
                    disabled={isDisabled || depth >= maxDepth}
                    aria-label="Increase crawl depth"
                    className="flex h-full w-5 items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:pointer-events-none disabled:opacity-30"
                    tabIndex={-1}
                >
                    <ChevronUpIcon className="size-3" />
                </button>
            </div>
        </fieldset>
    );
}
