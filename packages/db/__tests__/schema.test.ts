import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { entities } from "../src/schema.js";
import { createTestDb } from "../src/test-utils.js";

describe("database schema", () => {
    it("should insert and query an entity", async () => {
        const { db } = await createTestDb();

        const [inserted] = await db
            .insert(entities)
            .values({
                type: "person",
                name: "Jane Doe",
                metadata: { email: "jane@example.com" },
            })
            .returning();

        expect(inserted).toBeDefined();
        expect(inserted?.name).toBe("Jane Doe");
        expect(inserted?.type).toBe("person");

        const [queried] = await db
            .select()
            .from(entities)
            .where(eq(entities.id, inserted?.id));

        expect(queried).toBeDefined();
        expect(queried?.name).toBe("Jane Doe");
        expect(queried?.metadata).toEqual({ email: "jane@example.com" });
        expect(queried?.deletedAt).toBeNull();
    });
});
