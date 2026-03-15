import type { EntityType } from "@argus/types";

const ENTITY_SCRAPER_MAP: Record<EntityType, string[]> = {
    domain: ["dns"],
    email: ["email"],
    handle: ["social"],
    person: ["github"],
    org: [],
    ip: [],
    phone: [],
};

export function getScrapersForEntityType(type: EntityType): string[] {
    return ENTITY_SCRAPER_MAP[type] ?? [];
}
