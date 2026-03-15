import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema.js";

export async function createTestDb() {
    const client = new PGlite();
    const db = drizzle(client, { schema });

    // Create enums and tables manually for PGlite
    await client.exec(`
        DO $$ BEGIN
            CREATE TYPE entity_type AS ENUM ('person', 'org', 'domain', 'email', 'handle', 'ip', 'phone');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE edge_type AS ENUM ('owns', 'works_at', 'associated_with', 'alias_of');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        CREATE TABLE IF NOT EXISTS entities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            type entity_type NOT NULL,
            name TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            search_vector TEXT GENERATED ALWAYS AS (name) STORED,
            deleted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS entity_edges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_id UUID NOT NULL REFERENCES entities(id),
            target_id UUID NOT NULL REFERENCES entities(id),
            edge_type edge_type NOT NULL,
            confidence REAL NOT NULL DEFAULT 1.0,
            source_provider TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS data_points (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_id UUID NOT NULL REFERENCES entities(id),
            source_provider TEXT NOT NULL,
            source_url TEXT NOT NULL,
            raw_data JSONB NOT NULL,
            fetched_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS investigations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS investigation_entities (
            investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
            entity_id UUID NOT NULL REFERENCES entities(id),
            added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            notes TEXT,
            PRIMARY KEY (investigation_id, entity_id)
        );
    `);

    return { db, client };
}
