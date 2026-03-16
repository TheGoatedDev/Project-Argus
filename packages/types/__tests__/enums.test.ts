import { describe, expect, it } from "vitest";
import { EdgeTypeSchema, EntityTypeSchema } from "../src/enums.js";

describe("EntityTypeSchema", () => {
    const validTypes = [
        "person",
        "org",
        "domain",
        "email",
        "handle",
        "ip",
        "phone",
    ];

    it.each(validTypes)("accepts valid type: %s", (type) => {
        expect(EntityTypeSchema.parse(type)).toBe(type);
    });

    it("rejects invalid entity type", () => {
        expect(() => EntityTypeSchema.parse("invalid")).toThrow();
    });
});

describe("EdgeTypeSchema", () => {
    const validTypes = ["owns", "works_at", "associated_with", "alias_of"];

    it.each(validTypes)("accepts valid type: %s", (type) => {
        expect(EdgeTypeSchema.parse(type)).toBe(type);
    });

    it("rejects invalid edge type", () => {
        expect(() => EdgeTypeSchema.parse("invalid")).toThrow();
    });
});
