CREATE TABLE "saved_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"data" jsonb NOT NULL,
	"token_count" integer NOT NULL,
	"colors" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_sets_name_length" CHECK (char_length("saved_sets"."name") between 1 and 80),
	CONSTRAINT "saved_sets_owner_length" CHECK (char_length("saved_sets"."owner_id") between 1 and 256),
	CONSTRAINT "saved_sets_revision_positive" CHECK ("saved_sets"."revision" > 0),
	CONSTRAINT "saved_sets_token_count" CHECK ("saved_sets"."token_count" between 1 and 1000),
	CONSTRAINT "saved_sets_version" CHECK (jsonb_typeof("saved_sets"."data") = 'object' and "saved_sets"."data"->>'version' = '1'),
	CONSTRAINT "saved_sets_colors" CHECK (jsonb_typeof("saved_sets"."colors") = 'array' and jsonb_array_length("saved_sets"."colors") <= 4)
);
--> statement-breakpoint
CREATE INDEX "saved_sets_owner_updated_id" ON "saved_sets" USING btree ("owner_id","updated_at","id");