-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "toUser" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "total" INTEGER NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    CONSTRAINT "Transaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "fromUser", "message", "timestamp", "toUser", "total", "uuid") SELECT "amount", "fromUser", "message", "timestamp", "toUser", "total", "uuid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_fromUser_idx" ON "Transaction"("fromUser");
CREATE INDEX "Transaction_fromUserId_idx" ON "Transaction"("fromUserId");
CREATE INDEX "Transaction_toUserId_idx" ON "Transaction"("toUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
