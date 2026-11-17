-- AlterTable
ALTER TABLE "LoginAttempt" ADD COLUMN     "ip" TEXT;

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_success_createdAt_idx" ON "LoginAttempt"("ip", "success", "createdAt");
