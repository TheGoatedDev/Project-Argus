"use client";

import { FolderOpenIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
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
import { Textarea } from "@/components/ui/textarea";
import {
    useCreateInvestigation,
    useDeleteInvestigation,
    useInvestigations,
} from "@/hooks/api/use-investigations";

export function InvestigationsList() {
    const router = useRouter();
    const { data: investigations, isLoading } = useInvestigations();
    const createMutation = useCreateInvestigation();
    const deleteMutation = useDeleteInvestigation();

    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    function handleCreate() {
        if (!name.trim()) return;
        createMutation.mutate(
            { name: name.trim(), description: description.trim() || undefined },
            {
                onSuccess: () => {
                    setCreateOpen(false);
                    setName("");
                    setDescription("");
                },
            },
        );
    }

    function handleDelete() {
        if (!deleteId) return;
        deleteMutation.mutate(deleteId, {
            onSuccess: () => setDeleteId(null),
        });
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="font-display text-2xl uppercase tracking-wider">
                    Investigations
                </h1>
                <Button onClick={() => setCreateOpen(true)}>
                    <PlusIcon data-icon="inline-start" />
                    New Investigation
                </Button>
            </div>

            {!investigations || investigations.length === 0 ? (
                <EmptyState
                    icon={FolderOpenIcon}
                    title="No investigations yet"
                    description="Create your first investigation to start organizing entities."
                    action={{
                        label: "New Investigation",
                        onClick: () => setCreateOpen(true),
                    }}
                />
            ) : (
                <Table className="bg-card border border-primary/15">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                Name
                            </TableHead>
                            <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                Description
                            </TableHead>
                            <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                Created
                            </TableHead>
                            <TableHead className="w-16" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {investigations.map((inv) => (
                            <TableRow
                                key={inv.id}
                                className="cursor-pointer hover:bg-primary/5 transition-colors"
                                onClick={() =>
                                    router.push(`/investigations/${inv.id}`)
                                }
                            >
                                <TableCell className="font-medium">
                                    {inv.name}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-muted-foreground">
                                    {inv.description || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono">
                                    {new Date(
                                        inv.createdAt,
                                    ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="hover:text-neon-red"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteId(inv.id);
                                        }}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-card border border-primary/20">
                    <DialogHeader>
                        <DialogTitle>New Investigation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Investigation name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Textarea
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                            Cancel
                        </DialogClose>
                        <Button
                            onClick={handleCreate}
                            disabled={!name.trim() || createMutation.isPending}
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <DialogContent className="bg-card border border-primary/20">
                    <DialogHeader>
                        <DialogTitle>Delete Investigation</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this investigation? This
                        action cannot be undone.
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
        </>
    );
}
