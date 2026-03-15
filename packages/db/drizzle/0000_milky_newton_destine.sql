CREATE TYPE "public"."crawl_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."edge_type" AS ENUM('owns', 'works_at', 'associated_with', 'alias_of');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('person', 'org', 'domain', 'email', 'handle', 'ip', 'phone');--> statement-breakpoint
CREATE TABLE "crawl_job_entities" (
	"crawl_job_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"depth" integer NOT NULL,
	"scraper_used" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crawl_job_entities_crawl_job_id_entity_id_pk" PRIMARY KEY("crawl_job_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "crawl_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_query" text NOT NULL,
	"seed_type" "entity_type" NOT NULL,
	"max_depth" integer NOT NULL,
	"current_depth" integer DEFAULT 0 NOT NULL,
	"status" "crawl_status" DEFAULT 'pending' NOT NULL,
	"total_entities" integer DEFAULT 0 NOT NULL,
	"total_edges" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "data_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"source_provider" text NOT NULL,
	"source_url" text NOT NULL,
	"raw_data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "entity_type" NOT NULL,
	"name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"search_vector" "tsvector",
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"edge_type" "edge_type" NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"source_provider" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigation_entities" (
	"investigation_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "investigation_entities_investigation_id_entity_id_pk" PRIMARY KEY("investigation_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "investigations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crawl_job_entities" ADD CONSTRAINT "crawl_job_entities_crawl_job_id_crawl_jobs_id_fk" FOREIGN KEY ("crawl_job_id") REFERENCES "public"."crawl_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_job_entities" ADD CONSTRAINT "crawl_job_entities_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_points" ADD CONSTRAINT "data_points_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_edges" ADD CONSTRAINT "entity_edges_source_id_entities_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_edges" ADD CONSTRAINT "entity_edges_target_id_entities_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_entities" ADD CONSTRAINT "investigation_entities_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_entities" ADD CONSTRAINT "investigation_entities_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_points_entity_id_idx" ON "data_points" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entities_type_idx" ON "entities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "entities_deleted_at_idx" ON "entities" USING btree ("deleted_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "entities_type_name_active_idx" ON "entities" USING btree ("type","name") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "entities_search_vector_idx" ON "entities" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "edges_source_id_idx" ON "entity_edges" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "edges_target_id_idx" ON "entity_edges" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "edges_source_type_idx" ON "entity_edges" USING btree ("source_id","edge_type");--> statement-breakpoint
CREATE INDEX "edges_target_type_idx" ON "entity_edges" USING btree ("target_id","edge_type");--> statement-breakpoint
CREATE UNIQUE INDEX "edges_unique_active_idx" ON "entity_edges" USING btree ("source_id","target_id","edge_type") WHERE true;--> statement-breakpoint
CREATE OR REPLACE FUNCTION entities_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.metadata::text, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER entities_search_vector_trigger
    BEFORE INSERT OR UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION entities_search_vector_update();