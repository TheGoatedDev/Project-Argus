import type { EntityType } from "@argus/types";

export const NODE_COLORS: Record<EntityType, string> = {
    person: "#00d4ff",
    org: "#00ff88",
    domain: "#bf5af2",
    email: "#ff9f0a",
    handle: "#30d5c8",
    ip: "#ff453a",
    phone: "#ffd60a",
};

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
    person: "Person",
    org: "Organization",
    domain: "Domain",
    email: "Email",
    handle: "Handle",
    ip: "IP Address",
    phone: "Phone",
};
