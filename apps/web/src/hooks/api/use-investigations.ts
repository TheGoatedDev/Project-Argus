"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api";

export const investigationKeys = {
    all: ["investigations"] as const,
    list: () => ["investigations", "list"] as const,
    detail: (id: string) => ["investigations", "detail", id] as const,
};

export function useInvestigations() {
    return useQuery({
        queryKey: investigationKeys.list(),
        queryFn: async () => {
            const res = await client.api.investigations.$get();
            if (!res.ok) throw new Error("Failed to fetch investigations");
            return res.json();
        },
    });
}

export function useInvestigation(id: string | null) {
    return useQuery({
        queryKey: investigationKeys.detail(id!),
        queryFn: async () => {
            const res = await client.api.investigations[":id"].$get({
                param: { id: id! },
            });
            if (!res.ok) throw new Error("Failed to fetch investigation");
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateInvestigation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const res = await client.api.investigations.$post({ json: data });
            if (!res.ok) throw new Error("Failed to create investigation");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: investigationKeys.all,
            });
        },
    });
}

export function useUpdateInvestigation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            ...data
        }: {
            id: string;
            name?: string;
            description?: string;
        }) => {
            const res = await client.api.investigations[":id"].$patch({
                param: { id },
                json: data,
            });
            if (!res.ok) throw new Error("Failed to update investigation");
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: investigationKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({
                queryKey: investigationKeys.all,
            });
        },
    });
}

export function useDeleteInvestigation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await client.api.investigations[":id"].$delete({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to delete investigation");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: investigationKeys.all,
            });
        },
    });
}

export function useAddEntityToInvestigation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            investigationId,
            entityId,
            notes,
        }: {
            investigationId: string;
            entityId: string;
            notes?: string;
        }) => {
            const res = await client.api.investigations[":id"].entities.$post({
                param: { id: investigationId },
                json: { entityId, notes },
            });
            if (!res.ok) throw new Error("Failed to add entity");
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: investigationKeys.detail(variables.investigationId),
            });
        },
    });
}

export function useRemoveEntityFromInvestigation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            investigationId,
            entityId,
        }: {
            investigationId: string;
            entityId: string;
        }) => {
            const res = await client.api.investigations[":id"].entities[
                ":entityId"
            ].$delete({
                param: { id: investigationId, entityId },
            });
            if (!res.ok) throw new Error("Failed to remove entity");
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: investigationKeys.detail(variables.investigationId),
            });
        },
    });
}
