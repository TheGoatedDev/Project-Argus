"use client";

import type { EntityType } from "@argus/types";
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ExternalLinkIcon,
    NetworkIcon,
    PencilIcon,
    TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CrawlButton } from "@/components/crawl-button";
import { CrawlFeedback } from "@/components/crawl-feedback";
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
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [crawlDepth, setCrawlDepth] = useState(1);
    const [expandedDataPoints, setExpandedDataPoints] = useState<Set<string>>(
        new Set(),
    );

    function handleEdit() {
        if (!editName.trim()) return;
        setEditError(null);
        updateMutation.mutate(
            { id, name: editName.trim() },
            {
                onSuccess: () => setEditOpen(false),
                onError: (err) =>
                    setEditError(
                        err instanceof Error
                            ? err.message
                            : "Failed to update entity",
                    ),
            },
        );
    }

    function handleDelete() {
        setDeleteError(null);
        deleteMutation.mutate(id, {
            onSuccess: () => router.push("/search"),
            onError: (err) =>
                setDeleteError(
                    err instanceof Error
                        ? err.message
                        : "Failed to delete entity",
                ),
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
                <CrawlButton
                    depth={crawlDepth}
                    onDepthChange={setCrawlDepth}
                    onCrawl={() =>
                        crawl.startCrawl(
                            entity.name,
                            entity.type as EntityType,
                            crawlDepth,
                        )
                    }
                    isCrawling={crawl.status === "crawling"}
                />
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
            <CrawlFeedback crawl={crawl} />

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
                                    const isSource = edge.sourceId === id;
                                    const connectedId = isSource
                                        ? edge.targetId
                                        : edge.sourceId;
                                    const connectedName = isSource
                                        ? (edge as { targetName?: string })
                                              .targetName
                                        : (edge as { sourceName?: string })
                                              .sourceName;
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
                                                    {connectedName ??
                                                        connectedId}
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
            <Dialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) setEditError(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Entity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label
                            htmlFor="edit-entity-name"
                            className="text-sm font-medium"
                        >
                            Entity name
                        </label>
                        <Input
                            id="edit-entity-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="e.g. example.com"
                        />
                        {editError && (
                            <p className="text-xs text-destructive font-mono">
                                {editError}
                            </p>
                        )}
                    </div>
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
            <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);
                    if (!open) setDeleteError(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Entity</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete &quot;{entity.name}
                        &quot;? This action cannot be undone.
                    </p>
                    {deleteError && (
                        <p className="text-xs text-destructive font-mono">
                            {deleteError}
                        </p>
                    )}
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
