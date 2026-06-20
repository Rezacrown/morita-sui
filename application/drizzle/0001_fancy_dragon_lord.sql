CREATE TABLE "kiosk_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_object_id" varchar(200) NOT NULL,
	"seller_address" varchar(200) NOT NULL,
	"kiosk_id" varchar(200) NOT NULL,
	"price" varchar(50) NOT NULL,
	"item_name" varchar(255) DEFAULT '' NOT NULL,
	"item_type" varchar(100) DEFAULT '' NOT NULL,
	"rarity" varchar(100) DEFAULT '' NOT NULL,
	"game_name" varchar(255) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kiosk_listings_item_object_id_unique" UNIQUE("item_object_id")
);
--> statement-breakpoint
CREATE INDEX "kiosk_listings_seller_idx" ON "kiosk_listings" USING btree ("seller_address");--> statement-breakpoint
CREATE INDEX "kiosk_listings_active_idx" ON "kiosk_listings" USING btree ("is_active");