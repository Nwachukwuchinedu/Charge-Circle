-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_room_id_fkey";

-- DropForeignKey
ALTER TABLE "game_state" DROP CONSTRAINT "game_state_room_id_fkey";

-- DropForeignKey
ALTER TABLE "move_history" DROP CONSTRAINT "move_history_room_id_fkey";

-- AddForeignKey
ALTER TABLE "game_state" ADD CONSTRAINT "game_state_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_history" ADD CONSTRAINT "move_history_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
