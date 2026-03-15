"use client";

import {
    Background,
    Controls,
    type Edge,
    MiniMap,
    type Node,
    ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const NODE_COLORS: Record<string, string> = {
    person: "#3b82f6",
    org: "#22c55e",
    domain: "#a855f7",
    email: "#f97316",
    handle: "#14b8a6",
    ip: "#ef4444",
    phone: "#6b7280",
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export function GraphView() {
    return (
        <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
            <Background />
            <Controls />
            <MiniMap
                nodeColor={(node) =>
                    NODE_COLORS[node.data?.entityType as string] ?? "#6b7280"
                }
            />
        </ReactFlow>
    );
}
