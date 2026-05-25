-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('lobby', 'active', 'finished');

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_user_id_fkey";

-- DropForeignKey
ALTER TABLE "game_state" DROP CONSTRAINT IF EXISTS "game_state_room_id_fkey";

-- DropForeignKey
ALTER TABLE "game_state" DROP CONSTRAINT IF EXISTS "game_state_user_id_fkey";

-- DropForeignKey
ALTER TABLE "move_history" DROP CONSTRAINT IF EXISTS "move_history_user_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT IF EXISTS "rooms_owner_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "game_state_user_id_idx";

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN IF EXISTS "status",
ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'lobby';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chat_messages_room_id_user_id_idx" ON "chat_messages"("room_id", "user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "move_history_room_id_user_id_idx" ON "move_history"("room_id", "user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rooms_owner_id_idx" ON "rooms"("owner_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rooms_status_idx" ON "rooms"("status");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_state" ADD CONSTRAINT "game_state_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_state" ADD CONSTRAINT "game_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_history" ADD CONSTRAINT "move_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
