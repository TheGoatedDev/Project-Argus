import { z } from "zod/v4";

export const EntityType = {
    person: "person",
    org: "org",
    domain: "domain",
    email: "email",
    handle: "handle",
    ip: "ip",
    phone: "phone",
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const EntityTypeSchema = z.enum(EntityType);

export const EdgeType = {
    owns: "owns",
    works_at: "works_at",
    associated_with: "associated_with",
    alias_of: "alias_of",
} as const;

export type EdgeType = (typeof EdgeType)[keyof typeof EdgeType];

export const EdgeTypeSchema = z.enum(EdgeType);
