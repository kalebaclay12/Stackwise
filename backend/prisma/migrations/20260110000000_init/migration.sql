-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionId" TEXT,
    "customerId" TEXT,
    "subscriptionExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "currencySymbol" TEXT NOT NULL DEFAULT '$',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '12h',
    "itemsPerPage" INTEGER NOT NULL DEFAULT 10,
    "defaultAccountId" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "negativeBalanceBehavior" TEXT NOT NULL DEFAULT 'auto_deallocate',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "linkedBankId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "availableBalance" REAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Account_linkedBankId_fkey" FOREIGN KEY ("linkedBankId") REFERENCES "LinkedBank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" REAL,
    "currentAmount" REAL NOT NULL DEFAULT 0,
    "targetDueDate" DATETIME,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoAllocate" BOOLEAN NOT NULL DEFAULT false,
    "autoAllocateAmount" REAL,
    "autoAllocateFrequency" TEXT,
    "autoAllocateStartDate" DATETIME,
    "autoAllocateNextDate" DATETIME,
    "resetBehavior" TEXT NOT NULL DEFAULT 'none',
    "recurringPeriod" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "pendingReset" BOOLEAN NOT NULL DEFAULT false,
    "overflowBehavior" TEXT NOT NULL DEFAULT 'next_priority',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stack_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "stackId" TEXT,
    "plaidTransactionId" TEXT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balance" REAL NOT NULL,
    "metadata" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "suggestedStackId" TEXT,
    "matchConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "matchRejected" BOOLEAN NOT NULL DEFAULT false,
    "matchConfidenceScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkedBank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plaidItemId" TEXT NOT NULL,
    "plaidAccessToken" TEXT NOT NULL,
    "plaidAccountId" TEXT,
    "institutionId" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "accountName" TEXT,
    "accountMask" TEXT,
    "accountType" TEXT,
    "currentBalance" REAL,
    "availableBalance" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkedBank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_linkedBankId_idx" ON "Account"("linkedBankId");

-- CreateIndex
CREATE INDEX "Stack_accountId_idx" ON "Stack"("accountId");

-- CreateIndex
CREATE INDEX "Stack_autoAllocateNextDate_idx" ON "Stack"("autoAllocateNextDate");

-- CreateIndex
CREATE INDEX "Stack_isCompleted_idx" ON "Stack"("isCompleted");

-- CreateIndex
CREATE INDEX "Stack_pendingReset_idx" ON "Stack"("pendingReset");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_stackId_idx" ON "Transaction"("stackId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_plaidTransactionId_idx" ON "Transaction"("plaidTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_suggestedStackId_idx" ON "Transaction"("suggestedStackId");

-- CreateIndex
CREATE INDEX "Transaction_matchConfirmed_idx" ON "Transaction"("matchConfirmed");

-- CreateIndex
CREATE INDEX "Transaction_isVirtual_idx" ON "Transaction"("isVirtual");

-- CreateIndex
CREATE INDEX "LinkedBank_userId_idx" ON "LinkedBank"("userId");

-- CreateIndex
CREATE INDEX "LinkedBank_plaidItemId_idx" ON "LinkedBank"("plaidItemId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

