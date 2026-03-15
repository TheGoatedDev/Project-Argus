import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const sql = postgres(
    process.env.DATABASE_URL ?? "postgresql://localhost:5432/argus",
);

async function main() {
    // Read the journal to get migration hash and timestamp
    const journal = JSON.parse(
        readFileSync(
            join(import.meta.dirname, "../drizzle/meta/_journal.json"),
            "utf-8",
        ),
    );

    // Ensure drizzle schema and migration table exist
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await sql`
        CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash TEXT NOT NULL,
            created_at BIGINT
        )
    `;

    // Mark all existing migrations as applied
    for (const entry of journal.entries) {
        const existing = await sql`
            SELECT 1 FROM drizzle."__drizzle_migrations" WHERE hash = ${entry.tag}
        `;
        if (existing.length === 0) {
            await sql`
                INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
                VALUES (${entry.tag}, ${entry.when})
            `;
            console.log(`Marked migration ${entry.tag} as applied.`);
        } else {
            console.log(`Migration ${entry.tag} already marked as applied.`);
        }
    }

    // Clean up the public schema table if it exists
    await sql`DROP TABLE IF EXISTS public."__drizzle_migrations"`;

    console.log("Done.");
    await sql.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
