import type { Database } from "./client.js";
import { entities, entityEdges, investigations } from "./schema.js";

export async function seed(db: Database) {
    const [person] = await db
        .insert(entities)
        .values({
            type: "person",
            name: "John Doe",
            metadata: { role: "Software Engineer" },
        })
        .returning();

    const [org] = await db
        .insert(entities)
        .values({
            type: "org",
            name: "Acme Corp",
            metadata: { industry: "Technology" },
        })
        .returning();

    if (person && org) {
        await db.insert(entityEdges).values({
            sourceId: person.id,
            targetId: org.id,
            edgeType: "works_at",
            confidence: 0.95,
            sourceProvider: "manual",
        });
    }

    await db.insert(investigations).values({
        name: "Sample Investigation",
        description: "A sample investigation for development",
    });
}
