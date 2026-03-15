"use client";

import type { EntityType } from "@argus/types";
import {
    ArrowLeftIcon,
    BugIcon,
    CheckCircle2Icon,
    ChevronDownIcon,
    ChevronRightIcon,
    ExternalLinkIcon,
    Loader2Icon,
    NetworkIcon,
    PencilIcon,
    TrashIcon,
    XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EntityTypeBadge } from "@/components/entity-type-badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCrawl } from "@/hooks/api/use-crawl";
import {
    useDeleteEntity,
    useEntity,
    useEntityDataPoints,
    useEntityEdges,
    useUpdateEntity,
} from "@/hooks/api/use-entities";

export function EntityDetail({ id }: { id: string }) {
    const router = useRouter();
    const { data: entity, isLoading } = useEntity(id);
    const { data: edges } = useEntityEdges(id);
    const { data: dataPoints } = useEntityDataPoints(id);
    const updateMutation = useUpdateEntity();
    const deleteMutation = useDeleteEntity();
    const crawl = useCrawl();

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [expandedDataPoints, setExpandedDataPoints] = useState<Set<string>>(
        new Set(),
    );

    function handleEdit() {
        if (!editName.trim()) return;
        updateMutation.mutate(
            { id, name: editName.trim() },
            { onSuccess: () => setEditOpen(false) },
        );
    }

    function handleDelete() {
        deleteMutation.mutate(id, {
            onSuccess: () => router.push("/search"),
        });
    }

    function toggleDataPoint(dpId: string) {
        setExpandedDataPoints((prev) => {
            const next = new Set(prev);
            if (next.has(dpId)) next.delete(dpId);
            else next.add(dpId);
            return next;
        });
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!entity || "error" in entity) {
        return <p className="text-muted-foreground">Entity not found.</p>;
    }

    const metadata = (entity.metadata ?? {}) as Record<string, unknown>;
    const metadataEntries = Object.entries(metadata);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => router.back()}
                >
                    <ArrowLeftIcon />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-display uppercase tracking-wide">
                            {entity.name}
                        </h1>
                        <EntityTypeBadge type={entity.type as EntityType} />
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="border-primary/20 hover:glow-subtle"
                    render={<Link href={`/graph?entityId=${id}`} />}
                >
                    <NetworkIcon data-icon="inline-start" />
                    View in Graph
                </Button>
                <Button
                    variant="outline"
                    className="border-primary/20 hover:glow-subtle"
                    onClick={() => {
                        crawl.startCrawl(
                            entity.name,
                            entity.type as EntityType,
                            1,
                        );
                    }}
                    disabled={crawl.status === "crawling"}
                >
                    {crawl.status === "crawling" ? (
                        <Loader2Icon
                            className="size-4 animate-spin"
                            data-icon="inline-start"
                        />
                    ) : (
                        <BugIcon data-icon="inline-start" />
                    )}
                    Crawl
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="border-primary/20 hover:glow-subtle"
                    onClick={() => {
                        setEditName(entity.name);
                        setEditOpen(true);
                    }}
                >
                    <PencilIcon />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="border-primary/20 hover:glow-subtle"
                    onClick={() => setDeleteOpen(true)}
                >
                    <TrashIcon />
                </Button>
            </div>

            {/* Crawl Feedback */}
            {crawl.status !== "idle" && (
                <div className="relative overflow-hidden rounded-[0.2rem] border border-primary/20 bg-card">
                    {/* Animated top border — pulsing scanline while crawling */}
                    {crawl.status === "crawling" && (
                        <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
                            <div
                                className="h-full w-full"
                                style={{
                                    background:
                                        "linear-gradient(90deg, transparent, var(--neon-cyan), transparent)",
                                    animation:
                                        "crawl-scan 1.5s ease-in-out infinite",
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

                        {/* Event log — terminal-style feed */}
                        {crawl.events.length > 0 && (
                            <div className="max-h-36 overflow-auto rounded-[0.2rem] bg-background/60 border border-primary/10 p-2 space-y-0.5">
                                {crawl.events.map((event) => (
                                    <div
                                        key={event.eventId}
                                        className="text-[11px] leading-relaxed font-mono"
                                    >
                                        {event.type === "crawl:depth" && (
                                            <span className="text-primary/60">
                                                ── depth {event.depth} ·{" "}
                                                {event.entitiesAtDepth} targets
                                                ──
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
                                                {event.entityName}:{" "}
                                                {event.error}
                                            </span>
                                        )}
                                        {event.type === "crawl:completed" && (
                                            <span className="text-primary">
                                                done · {event.totalEntities}{" "}
                                                entities · {event.totalEdges}{" "}
                                                edges · depth{" "}
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
            )}

            {/* Metadata */}
            {metadataEntries.length > 0 && (
                <section>
                    <h2 className="mb-3 text-sm font-display uppercase tracking-wider text-primary">
                        Metadata
                    </h2>
                    <div className="rounded-lg border bg-card border-primary/15">
                        <Table>
                            <TableBody>
                                {metadataEntries.map(([key, value]) => (
                                    <TableRow key={key}>
                                        <TableCell className="font-medium text-primary/70 uppercase tracking-wider text-xs">
                                            {key}
                                        </TableCell>
                                        <TableCell>{String(value)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            )}

            {/* Edges */}
            {edges && edges.length > 0 && (
                <section>
                    <h2 className="mb-3 text-sm font-display uppercase tracking-wider text-primary">
                        Connections ({edges.length})
                    </h2>
                    <div className="rounded-lg border bg-card border-primary/15">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                        Type
                                    </TableHead>
                                    <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                        Connected Entity
                                    </TableHead>
                                    <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                        Confidence
                                    </TableHead>
                                    <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                        Source
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {edges.map((edge) => {
                                    const connectedId =
                                        edge.sourceId === id
                                            ? edge.targetId
                                            : edge.sourceId;
                                    return (
                                        <TableRow key={edge.id}>
                                            <TableCell className="font-medium">
                                                {edge.edgeType}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/entities/${connectedId}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {connectedId}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {edge.confidence != null
                                                    ? `${Math.round(Number(edge.confidence) * 100)}%`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {edge.sourceProvider ?? "—"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            )}

            {/* Data Points */}
            {dataPoints && dataPoints.length > 0 && (
                <section>
                    <h2 className="mb-3 text-sm font-display uppercase tracking-wider text-primary">
                        Data Points ({dataPoints.length})
                    </h2>
                    <div className="space-y-2">
                        {dataPoints.map((dp) => (
                            <div
                                key={dp.id}
                                className="rounded-lg border bg-card border-primary/15"
                            >
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 p-3 text-sm hover:bg-primary/5"
                                    onClick={() => toggleDataPoint(dp.id)}
                                >
                                    {expandedDataPoints.has(dp.id) ? (
                                        <ChevronDownIcon className="size-4" />
                                    ) : (
                                        <ChevronRightIcon className="size-4" />
                                    )}
                                    <span className="font-medium">
                                        {dp.sourceProvider}
                                    </span>
                                    <a
                                        href={dp.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {dp.sourceUrl}
                                        <ExternalLinkIcon className="size-3" />
                                    </a>
                                    <span className="ml-auto text-muted-foreground">
                                        {new Date(
                                            dp.fetchedAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </button>
                                {expandedDataPoints.has(dp.id) && (
                                    <pre className="border-t bg-secondary p-3 text-xs overflow-auto max-h-64 font-mono text-neon-green/80">
                                        {JSON.stringify(dp.rawData, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Edit dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Entity</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Entity name"
                    />
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                            Cancel
                        </DialogClose>
                        <Button
                            onClick={handleEdit}
                            disabled={
                                !editName.trim() || updateMutation.isPending
                            }
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Entity</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete &quot;{entity.name}
                        &quot;? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                            Cancel
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
