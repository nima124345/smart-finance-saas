-- Google OAuth: password เป็น nullable (ผู้ใช้ OAuth ไม่มีรหัสผ่าน) + เพิ่ม google_id, avatar_url

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(64);
ALTER TABLE "users" ADD COLUMN "avatar_url" VARCHAR(512);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
