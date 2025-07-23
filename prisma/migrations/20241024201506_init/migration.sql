-- CreateTable
CREATE TABLE "Transaction" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "toUser" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "total" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "Transaction_fromUser_idx" ON "Transaction"("fromUser");
