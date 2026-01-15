-- CreateTable
CREATE TABLE "BalanceHistory" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceHistory_accountId_idx" ON "BalanceHistory"("accountId");

-- CreateIndex
CREATE INDEX "BalanceHistory_date_idx" ON "BalanceHistory"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceHistory_accountId_date_key" ON "BalanceHistory"("accountId", "date");

-- AddForeignKey
ALTER TABLE "BalanceHistory" ADD CONSTRAINT "BalanceHistory_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
