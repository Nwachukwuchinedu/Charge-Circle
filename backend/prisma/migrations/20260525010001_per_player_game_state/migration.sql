-- Per-player GameState: convert from single-row-per-room (with turnQueue JSON)
-- to one-row-per-(room, player) model.

-- 1. Rename old table (also renames its primary key constraint)
ALTER TABLE "game_state" RENAME TO "game_state_old";

-- 2. Drop the old PK so new table can reuse the constraint name
ALTER TABLE "game_state_old" DROP CONSTRAINT "game_state_pkey";

-- 3. Create new table with composite PK (no explicit constraint name to avoid conflicts)
CREATE TABLE "game_state" (
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "piece_x" INTEGER NOT NULL DEFAULT 4,
    "piece_y" INTEGER NOT NULL DEFAULT 4,
    "target_x" INTEGER NOT NULL DEFAULT 2,
    "target_y" INTEGER NOT NULL DEFAULT 7,
    "score" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("room_id", "user_id")
);

-- 4. Migrate existing data: one row per player from turnQueue
INSERT INTO "game_state" ("room_id", "user_id", "piece_x", "piece_y", "target_x", "target_y", "score")
SELECT
    old."room_id",
    player."user_id",
    old."piece_x",
    old."piece_y",
    old."target_x",
    old."target_y",
    old."score"
FROM "game_state_old" old,
    LATERAL json_array_elements_text(old."turn_queue"::json) AS player("user_id");

-- 5. Drop old table
DROP TABLE "game_state_old";

-- 6. Foreign keys for new table
ALTER TABLE "game_state" ADD CONSTRAINT "game_state_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;
ALTER TABLE "game_state" ADD CONSTRAINT "game_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 7. Index on user_id for leaderboard lookups
CREATE INDEX "game_state_user_id_idx" ON "game_state"("user_id");

-- 8. Add round_ends_at to rooms
ALTER TABLE "rooms" ADD COLUMN "round_ends_at" TIMESTAMPTZ;
ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'lobby';
UPDATE "rooms" SET "status" = 'lobby' WHERE "status" IN ('waiting', 'playing');
