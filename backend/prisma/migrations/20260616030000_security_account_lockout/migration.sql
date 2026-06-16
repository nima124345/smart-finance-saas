-- Account lockout (brute-force): นับ login ที่ผิด + เวลาปลดล็อก
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failed_login_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMPTZ(6);
