-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "round_ends_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "total_score" INTEGER NOT NULL DEFAULT 0;
