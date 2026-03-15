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
            deleted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Add tsvector column and trigger (PGlite doesn't support GENERATED tsvector)
        ALTER TABLE entities ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

        CREATE OR REPLACE FUNCTION entities_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(NEW.metadata::text, '')), 'B');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS entities_search_vector_trigger ON entities;
        CREATE TRIGGER entities_search_vector_trigger
            BEFORE INSERT OR UPDATE ON entities
            FOR EACH ROW EXECUTE FUNCTION entities_search_vector_update();

        CREATE INDEX IF NOT EXISTS entities_search_vector_idx ON entities USING GIN (search_vector);

        CREATE UNIQUE INDEX IF NOT EXISTS entities_type_name_active_idx
            ON entities (type, name) WHERE deleted_at IS NULL;

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

        CREATE UNIQUE INDEX IF NOT EXISTS edges_unique_active_idx
            ON entity_edges (source_id, target_id, edge_type) WHERE true;

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

        DO $$ BEGIN
            CREATE TYPE crawl_status AS ENUM ('pending', 'running', 'completed', 'failed');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        CREATE TABLE IF NOT EXISTS crawl_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            seed_query TEXT NOT NULL,
            seed_type entity_type NOT NULL,
            max_depth INTEGER NOT NULL,
            current_depth INTEGER NOT NULL DEFAULT 0,
            status crawl_status NOT NULL DEFAULT 'pending',
            total_entities INTEGER NOT NULL DEFAULT 0,
            total_edges INTEGER NOT NULL DEFAULT 0,
            error TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS crawl_job_entities (
            crawl_job_id UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
            entity_id UUID NOT NULL REFERENCES entities(id),
            depth INTEGER NOT NULL,
            scraper_used TEXT,
            added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (crawl_job_id, entity_id)
        );
    `);

    return { db, client };
}
