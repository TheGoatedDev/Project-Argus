import type { Database } from "./client.js";
import { dataPoints, entities, entityEdges, investigations } from "./schema.js";

export async function seed(db: Database) {
    const [john] = await db
        .insert(entities)
        .values({
            type: "person",
            name: "John Doe",
            metadata: { role: "Software Engineer" },
        })
        .returning();

    const [acme] = await db
        .insert(entities)
        .values({
            type: "org",
            name: "Acme Corp",
            metadata: { industry: "Technology" },
        })
        .returning();

    const [acmeDomain] = await db
        .insert(entities)
        .values({
            type: "domain",
            name: "acme-corp.com",
            metadata: { registrar: "Namecheap" },
        })
        .returning();

    const [johnEmail] = await db
        .insert(entities)
        .values({
            type: "email",
            name: "john.doe@acme-corp.com",
            metadata: { verified: true },
        })
        .returning();

    const [janeDoe] = await db
        .insert(entities)
        .values({
            type: "person",
            name: "Jane Smith",
            metadata: { role: "CTO" },
        })
        .returning();

    if (john && acme) {
        await db.insert(entityEdges).values({
            sourceId: john.id,
            targetId: acme.id,
            edgeType: "works_at",
            confidence: 0.95,
            sourceProvider: "manual",
        });
    }

    if (acme && acmeDomain) {
        await db.insert(entityEdges).values({
            sourceId: acme.id,
            targetId: acmeDomain.id,
            edgeType: "owns",
            confidence: 1.0,
            sourceProvider: "whois",
        });
    }

    if (john && johnEmail) {
        await db.insert(entityEdges).values({
            sourceId: john.id,
            targetId: johnEmail.id,
            edgeType: "owns",
            confidence: 0.9,
            sourceProvider: "manual",
        });
    }

    if (janeDoe && acme) {
        await db.insert(entityEdges).values({
            sourceId: janeDoe.id,
            targetId: acme.id,
            edgeType: "works_at",
            confidence: 0.8,
            sourceProvider: "linkedin",
        });
    }

    if (johnEmail && acmeDomain) {
        await db.insert(entityEdges).values({
            sourceId: johnEmail.id,
            targetId: acmeDomain.id,
            edgeType: "associated_with",
            confidence: 1.0,
            sourceProvider: "derived",
        });
    }

    if (john) {
        await db.insert(dataPoints).values({
            entityId: john.id,
            sourceProvider: "manual",
            sourceUrl: "https://example.com/profiles/johndoe",
            rawData: { bio: "Software engineer based in NYC", links: [] },
            fetchedAt: new Date(),
        });
    }

    await db.insert(investigations).values({
        name: "Sample Investigation",
        description: "A sample investigation for development",
    });
}
