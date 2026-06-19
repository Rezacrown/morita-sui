CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "claim_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"game_id" integer NOT NULL,
	"item_template_id" integer NOT NULL,
	"recipient_identifier" varchar(255),
	"expires_at" timestamp NOT NULL,
	"claimed_at" timestamp,
	"claimed_by" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "claim_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "escrow_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"escrow_id" varchar(200) NOT NULL,
	"initiator_address" varchar(200) NOT NULL,
	"offer_game_id" integer,
	"offer_item_blob_id" varchar(200),
	"conditions_json" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"fulfilled_at" timestamp,
	"cancelled_at" timestamp,
	CONSTRAINT "escrow_index_escrow_id_unique" UNIQUE("escrow_id")
);
--> statement-breakpoint
CREATE TABLE "gamedevs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sui_address" varchar(200) NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gamedevs_sui_address_unique" UNIQUE("sui_address")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"sui_game_id" varchar(200),
	"publisher_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"genre" varchar(100),
	"website_url" varchar(500),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"game_capability_id" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_sui_game_id_unique" UNIQUE("sui_game_id")
);
--> statement-breakpoint
CREATE TABLE "item_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"blob_id" varchar(200) NOT NULL,
	"game_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_blob_id" varchar(200) NOT NULL,
	"tags" jsonb,
	"attributes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "item_cache_blob_id_unique" UNIQUE("blob_id")
);
--> statement-breakpoint
CREATE TABLE "item_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"sui_item_id" varchar(200),
	"name" varchar(255) NOT NULL,
	"item_type" varchar(100) NOT NULL,
	"rarity" varchar(100) NOT NULL,
	"description" text,
	"image_blob_id" varchar(200),
	"metadata_blob_id" varchar(200),
	"supply" integer DEFAULT 1 NOT NULL,
	"is_nft" boolean DEFAULT true NOT NULL,
	"attributes" jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" serial PRIMARY KEY NOT NULL,
	"sui_publisher_id" varchar(200) NOT NULL,
	"dev_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" varchar(500),
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "publishers_sui_publisher_id_unique" UNIQUE("sui_publisher_id")
);
--> statement-breakpoint
CREATE TABLE "tx_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_hash" varchar(200) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"game_id" integer,
	"from_address" varchar(200),
	"to_address" varchar(200),
	"item_blob_id" varchar(200),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_kiosks" (
	"id" serial PRIMARY KEY NOT NULL,
	"sui_address" varchar(200) NOT NULL,
	"kiosk_id" varchar(200) NOT NULL,
	"kiosk_owner_cap_id" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_kiosks_sui_address_unique" UNIQUE("sui_address"),
	CONSTRAINT "user_kiosks_kiosk_id_unique" UNIQUE("kiosk_id")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_codes" ADD CONSTRAINT "claim_codes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_codes" ADD CONSTRAINT "claim_codes_item_template_id_item_templates_id_fk" FOREIGN KEY ("item_template_id") REFERENCES "public"."item_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_index" ADD CONSTRAINT "escrow_index_offer_game_id_games_id_fk" FOREIGN KEY ("offer_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_cache" ADD CONSTRAINT "item_cache_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_templates" ADD CONSTRAINT "item_templates_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishers" ADD CONSTRAINT "publishers_dev_id_gamedevs_id_fk" FOREIGN KEY ("dev_id") REFERENCES "public"."gamedevs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tx_events" ADD CONSTRAINT "tx_events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_game_id_idx" ON "api_keys" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "claim_codes_code_idx" ON "claim_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "claim_codes_expires_at_idx" ON "claim_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "escrow_index_escrow_id_idx" ON "escrow_index" USING btree ("escrow_id");--> statement-breakpoint
CREATE INDEX "escrow_index_is_active_idx" ON "escrow_index" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "gamedevs_sui_address_idx" ON "gamedevs" USING btree ("sui_address");--> statement-breakpoint
CREATE UNIQUE INDEX "games_sui_game_id_idx" ON "games" USING btree ("sui_game_id");--> statement-breakpoint
CREATE INDEX "games_publisher_id_idx" ON "games" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "games_status_idx" ON "games" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "item_cache_blob_id_idx" ON "item_cache" USING btree ("blob_id");--> statement-breakpoint
CREATE INDEX "item_cache_game_id_idx" ON "item_cache" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "item_templates_game_id_idx" ON "item_templates" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "item_templates_status_idx" ON "item_templates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "publishers_sui_publisher_id_idx" ON "publishers" USING btree ("sui_publisher_id");--> statement-breakpoint
CREATE INDEX "publishers_dev_id_idx" ON "publishers" USING btree ("dev_id");--> statement-breakpoint
CREATE INDEX "tx_events_event_type_idx" ON "tx_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "tx_events_game_id_idx" ON "tx_events" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "tx_events_from_address_idx" ON "tx_events" USING btree ("from_address");--> statement-breakpoint
CREATE INDEX "tx_events_to_address_idx" ON "tx_events" USING btree ("to_address");--> statement-breakpoint
CREATE INDEX "tx_events_created_at_idx" ON "tx_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_kiosks_sui_address_idx" ON "user_kiosks" USING btree ("sui_address");--> statement-breakpoint
CREATE UNIQUE INDEX "user_kiosks_kiosk_id_idx" ON "user_kiosks" USING btree ("kiosk_id");